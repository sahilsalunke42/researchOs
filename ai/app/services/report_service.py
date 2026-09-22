from __future__ import annotations

from app.rag.retrieval import extract_sources, retrieve_context, select_grounded_chunks
from app.services.analysis_service import analyze_research
from app.services.llmService import ask


def _source_payload(source) -> dict[str, object | None]:
    return {
        "title": source.title,
        "authors": list(source.authors),
        "year": source.year,
        "doi": source.doi,
        "url": source.url,
        "source": source.source,
        "page": source.page,
    }


def generate_research_intelligence(
    topic: str,
    *,
    paper_keys: list[str] | None = None,
    retrieval_limit: int = 10,
) -> dict[str, object]:
    chunks = retrieve_context(
        topic,
        limit=retrieval_limit,
        paper_keys=paper_keys,
    )
    grounded_chunks = select_grounded_chunks(chunks, min_score=0.25)

    if not grounded_chunks:
        return {
            "report": "No source context was found for this research run.",
            "paper_analysis": [],
            "research_gaps": [],
            "contradictions": [],
            "supporting_evidence": [],
            "contrasting_evidence": [],
            "sources": [],
        }

    analysis = analyze_research(topic, grounded_chunks)
    sources = extract_sources(grounded_chunks)
    analysis["sources"] = [_source_payload(source) for source in sources]
    analysis["retrieved_chunks"] = len(grounded_chunks)
    return analysis


def generate_report(
    topic: str,
    limit: int = 2,
    paper_keys: list[str] | None = None,
) -> str:
    result = generate_research_intelligence(
        topic,
        paper_keys=paper_keys,
        retrieval_limit=max(limit, 4),
    )
    return str(result.get("report") or "No source context was found for this research run.")
