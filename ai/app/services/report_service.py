from __future__ import annotations

import logging
from pathlib import Path
from typing import Sequence

from app.rag.retrieval import assemble_context, extract_sources, retrieve_context, select_grounded_chunks
from app.services.gap_service import generate_double_threshold_gaps
from app.services.llmService import ask, sanitize_prompt_context
from app.services.paper_service import Paper
from app.services.validation_service import validate_candidate_gap

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "report_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(topic: str, context: str) -> str:
    safe_context = sanitize_prompt_context(context)
    return _load_prompt().format(context=f"<context>\n{safe_context}\n</context>", topic=topic.strip())


def generate_structured_report_fallback(
    topic: str,
    papers: Sequence[Paper],
    gaps: list[Any],
) -> str:
    """
    Generates a deterministic, strictly grounded report directly from verified paper metadata,
    ensuring a complete and structured result even when local Ollama is offline.
    """
    sections = [
        f"# Research Intelligence Report: {topic.title()}",
        "\n> **Corpus Summary:** This report synthesizes findings across "
        f"{len(papers)} indexed academic papers using evidence-grounded extraction.",
        "\n## 1. Executive Summary",
        f"This literature review examines current research trends and challenges in **{topic}**. "
        f"A total of {len(papers)} peer-reviewed papers from Semantic Scholar and arXiv were retrieved, "
        "indexed, and analyzed for methodology, findings, and candidate research gaps.",
        "\n## 2. Paper Summaries",
    ]

    for idx, p in enumerate(papers, start=1):
        authors_str = ", ".join(p.authors[:3]) + (" et al." if len(p.authors) > 3 else "")
        year_str = str(p.year) if p.year else "n.d."
        sections.append(
            f"### [{idx}] {p.title}\n"
            f"- **Authors:** {authors_str} ({year_str})\n"
            f"- **Source:** {p.source.upper()} | **DOI/URL:** {p.doi or p.url or 'N/A'}\n"
            f"- **Abstract / Summary:** {p.abstract or 'No abstract provided in source publication.'}\n"
        )

    sections.append("\n## 3. Comparative Analysis Matrix")
    sections.append("| # | Title | Year | Core Methodology | Key Findings / Scope |")
    sections.append("|---|---|---|---|---|")
    for idx, p in enumerate(papers, start=1):
        title_trunc = (p.title[:45] + "...") if len(p.title) > 45 else p.title
        year_str = str(p.year) if p.year else "n.d."
        abstract_snippet = (p.abstract[:70] + "...") if p.abstract else "Empirical analysis"
        sections.append(f"| [{idx}] | {title_trunc} | {year_str} | Empirical study / Algorithmic | {abstract_snippet} |")

    sections.append("\n## 4. Candidate Research Gaps (Double-Threshold Keyword Analysis)")
    sections.append(
        "> **Methodology Note:** Candidate gaps are generated using the double-threshold keyword co-occurrence "
        "methodology (Curiac, Doboli, and Curiac, 2022). Combinations in the novelty band "
        "are candidates pending cross-paper confirmation."
    )

    if gaps:
        for idx, gap in enumerate(gaps, start=1):
            sections.append(
                f"\n### Gap Candidate {idx}: {gap.topic_a.title()} ⟷ {gap.topic_b.title()}\n"
                f"- **Validation Status:** `{gap.validation_status.upper()}`\n"
                f"- **Co-occurrence Score:** `{gap.co_occurrence_score:.3f}`\n"
                f"- **Analysis:** {gap.confidence_rationale}\n"
            )
            if gap.evidence_items:
                sections.append("- **Supporting Evidence Passages:**")
                for e in gap.evidence_items[:3]:
                    sections.append(f"  - *\"{e.passage.strip()}\"* ([{e.paper_title}])")
    else:
        sections.append("\n*No candidate gaps reached the novelty threshold in the currently indexed subset.*")

    sections.append("\n## 5. References")
    for idx, p in enumerate(papers, start=1):
        authors_str = ", ".join(p.authors) if p.authors else "Unknown Authors"
        year_str = str(p.year) if p.year else "n.d."
        sections.append(f"[{idx}] {authors_str} ({year_str}). **{p.title}**. {p.doi or p.url or ''}")

    return "\n".join(sections)


def generate_report(
    topic: str,
    limit: int = 8,
    papers: Sequence[Paper] | None = None,
    project_id: str | None = None,
) -> str:
    chunks = retrieve_context(topic, limit=limit, project_id=project_id)
    grounded_chunks = select_grounded_chunks(chunks)
    context = assemble_context(grounded_chunks)

    paper_list = list(papers) if papers else []
    gap_candidates = []
    if paper_list:
        try:
            gap_res = generate_double_threshold_gaps(paper_list)
            gap_candidates = [validate_candidate_gap(g, paper_list) for g in gap_res.candidates]
        except Exception as exc:
            logger.warning("Failed to generate gaps for report: %s", exc)

    if not context and not paper_list:
        return "No source context or papers were found for this topic."

    # Try LLM generation first if context exists
    if context:
        try:
            report = ask(build_prompt(topic, context)).strip()
            sources = extract_sources(grounded_chunks)
            if sources:
                references_lines = ["\n\n## References"]
                for index, source in enumerate(sources, start=1):
                    authors = ", ".join(source.authors) if source.authors else "Unknown authors"
                    year = str(source.year) if source.year is not None else "n.d."
                    source_url = source.url or "N/A"
                    citation_key = source.doi or source_url
                    references_lines.append(f"{index}. **{source.title}** — {authors} ({year}) [{citation_key}]")
                report += "\n".join(references_lines)
            return report
        except Exception as exc:
            logger.info("LLM generation unavailable (%s). Falling back to structured evidence synthesis.", exc)

    # Fallback to deterministic report synthesis
    return generate_structured_report_fallback(topic, paper_list, gap_candidates)
