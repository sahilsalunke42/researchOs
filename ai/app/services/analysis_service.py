from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.rag.retrieval import RetrievedChunk, SourceCitation, extract_sources
from app.services.llmService import ask_json

logger = logging.getLogger(__name__)

CONTRAST_WORDS = re.compile(
    r"\b(however|although|whereas|in contrast|unlike|contrary|conflicting|mixed results|disagree|did not support)\b",
    re.I,
)
GAP_WORDS = re.compile(
    r"\b(limitation|limitations|future work|further research|lack of|lacks|not addressed|remains unclear|underexplored|insufficient)\b",
    re.I,
)


def _compact_context(chunks: list[RetrievedChunk], max_chunks: int = 10) -> str:
    sections: list[str] = []
    for index, chunk in enumerate(chunks[:max_chunks], start=1):
        p = chunk.payload
        title = str(p.get("title") or "Unknown paper")
        page = p.get("page")
        page_text = f", page {page}" if page is not None else ""
        text = re.sub(r"\s+", " ", chunk.text).strip()
        sections.append(f"EVIDENCE {index}\nPAPER: {title}{page_text}\nTEXT: {text[:900]}")
    return "\n\n".join(sections)


def _safe_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(1.0, number))


def _source_dict(source: SourceCitation) -> dict[str, object | None]:
    return {
        "title": source.title,
        "authors": list(source.authors),
        "year": source.year,
        "doi": source.doi,
        "url": source.url,
        "source": source.source,
    }


def _fallback_analysis(topic: str, chunks: list[RetrievedChunk]) -> dict[str, Any]:
    sources = extract_sources(chunks)
    supporting: list[dict[str, Any]] = []
    contrasting: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []

    for chunk in chunks[:8]:
        p = chunk.payload
        title = str(p.get("title") or "Unknown paper")
        page = p.get("page")
        text = re.sub(r"\s+", " ", chunk.text).strip()
        item = {
            "claim": f"Evidence relevant to {topic}",
            "evidence": text[:700],
            "paper": title,
            "page": page,
            "source_url": p.get("source_url") or p.get("url"),
            "evidence_type": "supporting",
        }
        supporting.append(item)
        if CONTRAST_WORDS.search(text):
            contrasting.append({**item, "evidence_type": "contrasting"})
        if GAP_WORDS.search(text):
            gaps.append({
                "gap": "A limitation or unresolved issue is reported in the retrieved literature.",
                "description": text[:500],
                "evidence": [text[:500]],
                "source_papers": [title],
                "confidence": None,
            })

    return {
        "paper_analysis": [
            {
                "paper": s.title,
                "objective": "Not available in the retrieved evidence.",
                "method": "Not available in the retrieved evidence.",
                "dataset": "Not available in the retrieved evidence.",
                "findings": "Not available in the retrieved evidence.",
                "limitations": "Not available in the retrieved evidence.",
            }
            for s in sources
        ],
        "research_gaps": gaps[:6],
        "contradictions": [],
        "supporting_evidence": supporting[:8],
        "contrasting_evidence": contrasting[:6],
    }


def analyze_research(topic: str, chunks: list[RetrievedChunk]) -> dict[str, Any]:
    if not chunks:
        return {
            **_fallback_analysis(topic, []),
            "report": "No source evidence was retrieved for this research run.",
        }

    context = _compact_context(chunks)
    prompt = f"""You are analyzing scientific literature for ResearchOS.
Use ONLY the evidence supplied below. Do not use outside knowledge and do not invent paper facts.

Return JSON only with these keys:
report, paper_analysis, research_gaps, contradictions, supporting_evidence, contrasting_evidence.

Rules:
- report must be concise markdown and grounded in the evidence.
- paper_analysis: objective, method, dataset, findings, limitations for each paper; use 'Not available in the retrieved evidence.' when absent.
- research_gaps must be evidence-grounded, not generic future-work suggestions.
- contradictions must be marked 'potential' unless the evidence clearly establishes conflicting claims.
- supporting_evidence and contrasting_evidence must quote/paraphrase only the supplied evidence; never invent quotations.
- page is an integer when supplied, otherwise null.
- confidence is null unless a defensible heuristic is available.

Required JSON shape:
{{
  "report": "markdown",
  "paper_analysis": [{{"paper":"", "objective":"", "method":"", "dataset":"", "findings":"", "limitations":""}}],
  "research_gaps": [{{"gap":"", "description":"", "evidence":[], "source_papers":[], "confidence":null}}],
  "contradictions": [{{"claim_a":"", "claim_b":"", "paper_a":"", "paper_b":"", "evidence_a":"", "evidence_b":"", "possible_reason":null, "confidence":null, "status":"potential"}}],
  "supporting_evidence": [{{"claim":"", "evidence":"", "paper":"", "page":null, "source_url":null, "evidence_type":"supporting"}}],
  "contrasting_evidence": [{{"claim":"", "evidence":"", "paper":"", "page":null, "source_url":null, "evidence_type":"contrasting"}}]
}}

TOPIC: {topic}

EVIDENCE:
{context}
"""
    try:
        result = ask_json(prompt, num_predict=1800)
        fallback = _fallback_analysis(topic, chunks)
        for key in fallback:
            result.setdefault(key, fallback[key])
        if not isinstance(result.get("report"), str) or not result["report"].strip():
            result["report"] = _fallback_report(topic, chunks)
        return result
    except Exception as exc:
        logger.exception("Structured literature analysis failed; using grounded fallback: %s", exc)
        fallback = _fallback_analysis(topic, chunks)
        fallback["report"] = _fallback_report(topic, chunks)
        return fallback


def _fallback_report(topic: str, chunks: list[RetrievedChunk]) -> str:
    sources = extract_sources(chunks)
    lines = [
        "# Research Intelligence Report",
        f"## Topic\n{topic}",
        "## Evidence Summary",
        "The report below is limited to the retrieved evidence.",
    ]
    for index, source in enumerate(sources, start=1):
        lines.append(f"### [{index}] {source.title}")
        lines.append("Evidence was retrieved from this paper; detailed claims are limited to the extracted passages.")
    lines.append("## Research Gaps\nEvidence-grounded gap identification requires sufficient explicit limitations or unresolved questions in the retrieved passages.")
    lines.append("## References")
    for index, source in enumerate(sources, start=1):
        citation = source.doi or source.url or "source unavailable"
        lines.append(f"{index}. **{source.title}** — {citation}")
    return "\n\n".join(lines)
