from __future__ import annotations

from dataclasses import asdict
import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.ingest import IngestResponse, IngestResultItem, SelectedPaper
from app.schemas.papers import PaperItem, PaperSearchResponse
from app.schemas.research import ResearchResponse
from app.services.gap_service import generate_double_threshold_gaps
from app.services.ingestion_service import IngestionResult, ingest_papers, paper_key
from app.services.paper_service import Paper, fetch_papers
from app.services.report_service import generate_report
from app.services.validation_service import ValidatedGap, validate_candidate_gap

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


def ingest_query(query: str, limit: int = 3, project_id: str | None = None) -> IngestResponse:
    logger.info("Ingesting papers for query=%r limit=%d project_id=%r", query, limit, project_id)
    papers = fetch_papers(query, limit=limit)
    results = ingest_papers(papers, project_id=project_id)
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


def ingest_selected_papers(papers: list[SelectedPaper], project_id: str | None = None) -> IngestResponse:
    logger.info("Ingesting %d selected papers project_id=%r", len(papers), project_id)
    paper_models = [_to_paper_model(paper) for paper in papers]
    selected_pdf_url_map = {
        paper_key(paper): selected.pdf_url
        for selected, paper in zip(papers, paper_models, strict=True)
        if selected.pdf_url
    }

    def _resolver(paper: Paper) -> str | None:
        return selected_pdf_url_map.get(paper_key(paper))

    results = ingest_papers(paper_models, pdf_url_resolver=_resolver, project_id=project_id)
    return _to_ingest_response("selected-papers", results)


class ResearchGraphState(TypedDict, total=False):
    topic: str
    paper_limit: int
    project_id: str | None
    user_id: str | None
    alpha: float
    beta: float
    papers: list[Paper]
    ingestion: IngestResponse
    gap_candidates: list[dict[str, Any]]
    report: str


def _discover_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    limit = int(state.get("paper_limit", 3))
    logger.info("LangGraph node=discover topic=%r limit=%d", topic, limit)
    papers = fetch_papers(topic, limit=limit)
    return {"papers": papers}


def _ingest_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    project_id = state.get("project_id")
    user_id = state.get("user_id")
    logger.info("LangGraph node=ingest topic=%r papers=%d project_id=%r", topic, len(papers), project_id)
    results = ingest_papers(papers, project_id=project_id, user_id=user_id)
    return {"ingestion": _to_ingest_response(topic, results)}


def _analyze_and_gaps_node(state: ResearchGraphState) -> ResearchGraphState:
    papers = state.get("papers") or []
    alpha = float(state.get("alpha", 0.15))
    beta = float(state.get("beta", 0.65))
    logger.info("LangGraph node=analyze_and_gaps papers=%d alpha=%.2f beta=%.2f", len(papers), alpha, beta)

    gap_data: list[dict[str, Any]] = []
    if papers:
        try:
            gap_res = generate_double_threshold_gaps(papers, alpha=alpha, beta=beta)
            validated_gaps = [validate_candidate_gap(cand, papers) for cand in gap_res.candidates]
            gap_data = [
                {
                    "topic_a": g.topic_a,
                    "topic_b": g.topic_b,
                    "statement": g.statement,
                    "co_occurrence_score": g.co_occurrence_score,
                    "validation_status": g.validation_status,
                    "confidence_rationale": g.confidence_rationale,
                    "evidence_items": [
                        {
                            "paper_title": e.paper_title,
                            "paper_doi": e.paper_doi,
                            "passage": e.passage,
                            "relation": e.relation,
                        }
                        for e in g.evidence_items
                    ],
                }
                for g in validated_gaps
            ]
        except Exception as exc:
            logger.warning("Error in double-threshold gap generation: %s", exc)

    return {"gap_candidates": gap_data}


def _generate_report_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    project_id = state.get("project_id")
    logger.info("LangGraph node=report topic=%r project_id=%r", topic, project_id)
    report_text = generate_report(topic, papers=papers, project_id=project_id)
    return {"report": report_text}


def _build_research_graph():
    graph = StateGraph(ResearchGraphState)
    graph.add_node("discover", _discover_papers_node)
    graph.add_node("ingest", _ingest_papers_node)
    graph.add_node("analyze_and_gaps", _analyze_and_gaps_node)
    graph.add_node("report", _generate_report_node)

    graph.add_edge(START, "discover")
    graph.add_edge("discover", "ingest")
    graph.add_edge("ingest", "analyze_and_gaps")
    graph.add_edge("analyze_and_gaps", "report")
    graph.add_edge("report", END)
    return graph.compile()


RESEARCH_GRAPH = _build_research_graph()


def run_research(
    topic: str,
    paper_limit: int = 3,
    project_id: str | None = None,
    user_id: str | None = None,
    alpha: float = 0.15,
    beta: float = 0.65,
) -> ResearchResponse:
    logger.info(
        "Running research workflow topic=%r paper_limit=%d project_id=%r alpha=%.2f beta=%.2f",
        topic,
        paper_limit,
        project_id,
        alpha,
        beta,
    )
    graph_result = RESEARCH_GRAPH.invoke(
        {
            "topic": topic.strip(),
            "paper_limit": paper_limit,
            "project_id": project_id,
            "user_id": user_id,
            "alpha": alpha,
            "beta": beta,
        },
    )
    ingestion = graph_result.get("ingestion")
    if ingestion is None:
        ingestion = _to_ingest_response(topic.strip(), [])
    report = str(graph_result.get("report") or "No source context was found for this topic.")
    papers = graph_result.get("papers") or []
    gap_candidates = graph_result.get("gap_candidates") or []

    paper_items = [_paper_to_item(p) for p in papers]

    return ResearchResponse(
        topic=topic,
        project_id=project_id,
        papers_processed=ingestion.papers_processed,
        total_chunks=ingestion.total_chunks,
        papers=paper_items,
        gap_candidates=gap_candidates,
        report=report,
    )


def stream_research(
    topic: str,
    paper_limit: int = 3,
    project_id: str | None = None,
    user_id: str | None = None,
    alpha: float = 0.15,
    beta: float = 0.65,
):
    """
    Streams LangGraph node execution events in real time as each agent runs.
    """
    logger.info(
        "Streaming research workflow topic=%r paper_limit=%d project_id=%r",
        topic,
        paper_limit,
        project_id,
    )
    yield {"stage": "DISCOVERY", "status": "RUNNING"}

    for update in RESEARCH_GRAPH.stream(
        {
            "topic": topic.strip(),
            "paper_limit": paper_limit,
            "project_id": project_id,
            "user_id": user_id,
            "alpha": alpha,
            "beta": beta,
        },
        stream_mode="updates",
    ):
        if "discover" in update:
            papers = update["discover"].get("papers") or []
            paper_items = [_paper_to_item(p).model_dump() for p in papers]
            yield {
                "stage": "DISCOVERY",
                "status": "COMPLETE",
                "papers": paper_items,
            }
            yield {"stage": "INGESTION", "status": "RUNNING"}
        elif "ingest" in update:
            ingestion = update["ingest"].get("ingestion")
            yield {
                "stage": "INGESTION",
                "status": "COMPLETE",
                "papers_processed": ingestion.papers_processed if ingestion else 0,
                "total_chunks": ingestion.total_chunks if ingestion else 0,
            }
            yield {"stage": "ANALYSIS", "status": "RUNNING"}
            yield {"stage": "GAPS", "status": "RUNNING"}
        elif "analyze_and_gaps" in update:
            gap_candidates = update["analyze_and_gaps"].get("gap_candidates") or []
            yield {"stage": "ANALYSIS", "status": "COMPLETE"}
            yield {
                "stage": "GAPS",
                "status": "COMPLETE",
                "gap_candidates": gap_candidates,
            }
            yield {"stage": "REPORT", "status": "RUNNING"}
        elif "report" in update:
            report_text = update["report"].get("report") or ""
            yield {
                "stage": "REPORT",
                "status": "COMPLETE",
                "report": report_text,
            }

    yield {"stage": "COMPLETE", "status": "COMPLETE"}
