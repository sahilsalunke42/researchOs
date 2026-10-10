from __future__ import annotations

import logging
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.ingest import IngestResponse, IngestResultItem, SelectedPaper
from app.schemas.papers import PaperItem, PaperSearchResponse
from app.schemas.research import ResearchResponse
from app.services.ingestion_service import IngestionResult, ingest_papers, paper_key
from app.services.paper_service import Paper, fetch_papers
from app.services.report_service import generate_research_intelligence

logger = logging.getLogger(__name__)


def _paper_to_item(paper: Paper) -> PaperItem:
    return PaperItem(
        title=paper.title,
        authors=list(paper.authors),
        year=paper.year,
        doi=paper.doi,
        source=paper.source,
        url=paper.url,
        pdf_url=paper.pdf_url,
        abstract=paper.abstract,
        external_id=paper.external_id,
        relevance_score=paper.relevance_score,
    )


def search_papers(query: str, limit: int = 5) -> PaperSearchResponse:
    logger.info("Searching papers for query=%r limit=%d", query, limit)
    papers = fetch_papers(query, limit=limit)
    items = [_paper_to_item(paper) for paper in papers]
    return PaperSearchResponse(papers=items, count=len(items))


def _to_ingest_response(query: str, results: list[IngestionResult]) -> IngestResponse:
    items = [
        IngestResultItem(
            paper_key=result.paper_key,
            chunk_count=result.chunk_count,
            source_url=result.source_url,
        )
        for result in results
    ]
    return IngestResponse(
        query=query,
        papers_processed=len(items),
        total_chunks=sum(item.chunk_count for item in items),
        results=items,
    )


def ingest_query(query: str, limit: int = 3) -> IngestResponse:
    papers = fetch_papers(query, limit=limit)
    return _to_ingest_response(query, ingest_papers(papers))


def _to_paper_model(selected: SelectedPaper) -> Paper:
    return Paper(
        title=selected.title,
        authors=tuple(selected.authors),
        year=selected.year,
        doi=selected.doi,
        source=selected.source,
        url=selected.url,
        pdf_url=selected.pdf_url,
        abstract=selected.abstract,
        external_id=selected.external_id,
    )


def ingest_selected_papers(papers: list[SelectedPaper]) -> IngestResponse:
    paper_models = [_to_paper_model(paper) for paper in papers]
    return _to_ingest_response("selected-papers", ingest_papers(paper_models))


class ResearchGraphState(TypedDict, total=False):
    topic: str
    paper_limit: int
    papers: list[Paper]
    ingestion: IngestResponse
    intelligence: dict[str, object]


def _discover_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    limit = int(state.get("paper_limit", 3))
    logger.info("LangGraph node=discover topic=%r limit=%d", topic, limit)
    papers = fetch_papers(topic, limit=limit)
    logger.info("Discovered %d papers", len(papers))
    return {"papers": papers}


def _ingest_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    logger.info("LangGraph node=ingest topic=%r papers=%d", topic, len(papers))
    ingestion = _to_ingest_response(topic, ingest_papers(papers))
    logger.info("Ingestion completed papers=%d chunks=%d", ingestion.papers_processed, ingestion.total_chunks)
    return {"ingestion": ingestion}


def _generate_intelligence_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    ingestion = state.get("ingestion")
    if not papers or not ingestion or ingestion.papers_processed == 0:
        return {"intelligence": {"report": "No research papers with downloadable evidence could be ingested."}}

    result = generate_research_intelligence(
        topic,
        paper_keys=[paper_key(paper) for paper in papers],
        retrieval_limit=max(8, min(15, len(papers) * 5)),
    )
    return {"intelligence": result}


def _build_research_graph():
    graph = StateGraph(ResearchGraphState)
    graph.add_node("discover", _discover_papers_node)
    graph.add_node("ingest", _ingest_papers_node)
    graph.add_node("analyze", _generate_intelligence_node)
    graph.add_edge(START, "discover")
    graph.add_edge("discover", "ingest")
    graph.add_edge("ingest", "analyze")
    graph.add_edge("analyze", END)
    return graph.compile()


RESEARCH_GRAPH = _build_research_graph()


def run_research(topic: str, paper_limit: int = 3) -> ResearchResponse:
    topic = topic.strip()
    graph_result = RESEARCH_GRAPH.invoke({"topic": topic, "paper_limit": paper_limit})
    ingestion = graph_result.get("ingestion") or _to_ingest_response(topic, [])
    intelligence = graph_result.get("intelligence") or {}

    return ResearchResponse(
        topic=topic,
        papers_processed=ingestion.papers_processed,
        total_chunks=ingestion.total_chunks,
        report=str(intelligence.get("report") or "No source context was found for this topic."),
        paper_analysis=intelligence.get("paper_analysis", []),
        research_gaps=intelligence.get("research_gaps", []),
        contradictions=intelligence.get("contradictions", []),
        supporting_evidence=intelligence.get("supporting_evidence", []),
        contrasting_evidence=intelligence.get("contrasting_evidence", []),
        sources=intelligence.get("sources", []),
    )
