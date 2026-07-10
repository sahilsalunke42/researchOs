from __future__ import annotations

import logging
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.ingest import IngestResponse, IngestResultItem, SelectedPaper
from app.schemas.papers import PaperItem, PaperSearchResponse
from app.schemas.research import ResearchResponse
from app.services.ingestion_service import IngestionResult, ingest_papers, paper_key
from app.services.paper_service import Paper, fetch_papers
from app.services.report_service import generate_report

logger = logging.getLogger(__name__)


def _paper_to_item(paper: Paper) -> PaperItem:
    return PaperItem(
        title=paper.title,
        authors=list(paper.authors),
        year=paper.year,
        doi=paper.doi,
        source=paper.source,
        url=paper.url,
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
    total_chunks = sum(item.chunk_count for item in items)
    return IngestResponse(
        query=query,
        papers_processed=len(items),
        total_chunks=total_chunks,
        results=items,
    )


def ingest_query(query: str, limit: int = 3) -> IngestResponse:
    logger.info("Ingesting papers for query=%r limit=%d", query, limit)
    papers = fetch_papers(query, limit=limit)
    results = ingest_papers(papers)
    return _to_ingest_response(query, results)


def _to_paper_model(selected: SelectedPaper) -> Paper:
    return Paper(
        title=selected.title,
        authors=tuple(selected.authors),
        year=selected.year,
        doi=selected.doi,
        source=selected.source,
        url=selected.url,
        abstract=selected.abstract,
        external_id=selected.external_id,
    )


def ingest_selected_papers(papers: list[SelectedPaper]) -> IngestResponse:
    logger.info("Ingesting %d selected papers", len(papers))
    paper_models = [_to_paper_model(paper) for paper in papers]
    selected_pdf_url_map = {
        paper_key(paper): selected.pdf_url
        for selected, paper in zip(papers, paper_models, strict=True)
        if selected.pdf_url
    }

    def _resolver(paper: Paper) -> str | None:
        return selected_pdf_url_map.get(paper_key(paper))

    results = ingest_papers(paper_models, pdf_url_resolver=_resolver)
    return _to_ingest_response("selected-papers", results)


class ResearchGraphState(TypedDict, total=False):
    topic: str
    paper_limit: int
    papers: list[Paper]
    ingestion: IngestResponse
    report: str


def _discover_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    limit = int(state.get("paper_limit", 3))
    logger.info("LangGraph node=discover topic=%r limit=%d", topic, limit)
    return {"papers": fetch_papers(topic, limit=limit)}


def _ingest_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    logger.info("LangGraph node=ingest topic=%r papers=%d", topic, len(papers))
    return {"ingestion": _to_ingest_response(topic, ingest_papers(papers))}


def _generate_report_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    logger.info("LangGraph node=report topic=%r", topic)
    return {"report": generate_report(topic)}


def _build_research_graph():
    graph = StateGraph(ResearchGraphState)
    graph.add_node("discover", _discover_papers_node)
    graph.add_node("ingest", _ingest_papers_node)
    graph.add_node("report", _generate_report_node)
    graph.add_edge(START, "discover")
    graph.add_edge("discover", "ingest")
    graph.add_edge("ingest", "report")
    graph.add_edge("report", END)
    return graph.compile()


RESEARCH_GRAPH = _build_research_graph()


def run_research(topic: str, paper_limit: int = 3) -> ResearchResponse:
    logger.info("Running research workflow topic=%r paper_limit=%d", topic, paper_limit)
    graph_result = RESEARCH_GRAPH.invoke(
        {"topic": topic.strip(), "paper_limit": paper_limit},
    )
    ingestion = graph_result.get("ingestion")
    if ingestion is None:
        ingestion = _to_ingest_response(topic.strip(), [])
    report = str(graph_result.get("report") or "No source context was found for this topic.")
    return ResearchResponse(
        topic=topic,
        papers_processed=ingestion.papers_processed,
        total_chunks=ingestion.total_chunks,
        report=report,
    )
