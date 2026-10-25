from __future__ import annotations

from dataclasses import asdict
import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas.ingest import IngestResponse, IngestResultItem, SelectedPaper
from app.schemas.papers import PaperItem, PaperSearchResponse
from app.schemas.research import ResearchResponse
from app.services.gap_service import GapCandidate, generate_double_threshold_gaps
from app.services.ingestion_service import IngestionResult, get_paper_pages, ingest_papers, paper_key
from app.services.paper_analysis_service import PaperAnalysis, analyze_paper_content
from app.services.paper_service import Paper, fetch_papers
from app.services.report_service import generate_report
from app.services.validation_service import ValidatedGap, formulate_and_validate_scientific_gaps, validate_candidate_gap

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
    paper_analyses: list[PaperAnalysis]
    dt_candidates: list[GapCandidate]
    gap_candidates: list[dict[str, Any]]
    report: str


def _discover_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    if state.get("papers"):
        return {"papers": state["papers"]}
    topic = str(state["topic"]).strip()
    limit = int(state.get("paper_limit", 5))
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


def _analyze_papers_node(state: ResearchGraphState) -> ResearchGraphState:
    papers = state.get("papers") or []
    logger.info("LangGraph node=analyze_papers papers=%d", len(papers))
    analyses: list[PaperAnalysis] = []
    for paper in papers:
        pages = get_paper_pages(paper)
        analysis = analyze_paper_content(paper, pages=pages)
        analyses.append(analysis)
    return {"paper_analyses": analyses}


def _serialize_analysis(pa: PaperAnalysis) -> dict[str, Any]:
    return {
        "paper_title": pa.paper_title,
        "paper_doi": pa.paper_doi,
        "source": pa.source,
        "is_abstract_only": pa.is_abstract_only,
        "research_objective": pa.research_objective,
        "proposed_method": pa.proposed_method,
        "dataset_info": pa.dataset_info,
        "experimental_setup": pa.experimental_setup,
        "limitations_summary": pa.limitations_summary,
        "future_work_summary": pa.future_work_summary,
        "findings": [
            {
                "problem_statement": f.problem_statement,
                "category": f.category.value,
                "supporting_passage": f.supporting_passage,
                "source_location": f.source_location,
                "why_limitation": f.why_limitation,
                "confidence": f.confidence,
                "relevant_experiment_or_metric": f.relevant_experiment_or_metric,
                "missing_verification": f.missing_verification,
            }
            for f in pa.findings
        ],
    }


def _gap_analysis_node(state: ResearchGraphState) -> ResearchGraphState:
    papers = state.get("papers") or []
    analyses = state.get("paper_analyses") or []
    alpha = float(state.get("alpha", 0.15))
    beta = float(state.get("beta", 0.65))
    project_id = state.get("project_id")
    logger.info("LangGraph node=gap_analysis papers=%d alpha=%.2f beta=%.2f", len(papers), alpha, beta)

    gap_data: list[dict[str, Any]] = []
    dt_candidates: list[GapCandidate] = []
    if papers:
        try:
            # 1. Generate double-threshold candidates for exploratory keyword co-occurrence context
            dt_result = generate_double_threshold_gaps(papers, alpha=alpha, beta=beta)
            dt_candidates = dt_result.candidates

            # 2. Formulate evidence-backed research gaps from paper-level analyses
            validated_gaps = formulate_and_validate_scientific_gaps(
                paper_analyses=analyses,
                papers=papers,
                dt_candidates=dt_candidates,
                project_id=project_id,
            )

            gap_data = [
                {
                    "topic_a": g.topic_a,
                    "topic_b": g.topic_b,
                    "statement": g.statement,
                    "co_occurrence_score": g.co_occurrence_score,
                    "validation_status": g.validation_status,
                    "confidence_rationale": g.confidence_rationale,
                    "supporting_paper_count": g.supporting_paper_count,
                    "contradicting_paper_count": g.contradicting_paper_count,
                    "total_corpus_papers": g.total_corpus_papers,
                    "corpus_limitations": g.corpus_limitations,
                    "task_and_conditions": g.task_and_conditions,
                    "existing_attempts": g.existing_attempts,
                    "unresolved_technical_problem": g.unresolved_technical_problem,
                    "verification_needed": g.verification_needed,
                    "evidence_items": [
                        {
                            "paper_title": e.paper_title,
                            "paper_doi": e.paper_doi,
                            "passage": e.passage,
                            "page_number": e.page_number,
                            "section": e.section,
                            "relation": e.relation,
                            "rationale": e.rationale,
                            "finding_category": getattr(e, "finding_category", "EXPLICIT_LIMITATION"),
                        }
                        for e in g.evidence_items
                    ],
                }
                for g in validated_gaps
            ]
        except Exception as exc:
            logger.warning("Error in paper-first scientific gap analysis: %s", exc)

    return {"dt_candidates": dt_candidates, "gap_candidates": gap_data}


def _generate_report_node(state: ResearchGraphState) -> ResearchGraphState:
    topic = str(state["topic"]).strip()
    papers = state.get("papers") or []
    analyses = state.get("paper_analyses") or []
    gap_candidates = state.get("gap_candidates") or []
    dt_candidates = state.get("dt_candidates") or []
    project_id = state.get("project_id")
    limit = int(state.get("paper_limit", 5))
    logger.info("LangGraph node=report topic=%r project_id=%r gaps=%d limit=%d", topic, project_id, len(gap_candidates), limit)
    report_text = generate_report(
        topic,
        limit=limit,
        papers=papers,
        project_id=project_id,
        gaps=gap_candidates,
        paper_analyses=analyses,
        dt_candidates=dt_candidates,
    )
    return {"report": report_text}


def _build_research_graph():
    graph = StateGraph(ResearchGraphState)
    graph.add_node("discover", _discover_papers_node)
    graph.add_node("ingest", _ingest_papers_node)
    graph.add_node("analyze_papers", _analyze_papers_node)
    graph.add_node("gap_analysis", _gap_analysis_node)
    graph.add_node("report", _generate_report_node)

    graph.add_edge(START, "discover")
    graph.add_edge("discover", "ingest")
    graph.add_edge("ingest", "analyze_papers")
    graph.add_edge("analyze_papers", "gap_analysis")
    graph.add_edge("gap_analysis", "report")
    graph.add_edge("report", END)
    return graph.compile()


RESEARCH_GRAPH = _build_research_graph()


def run_research(
    topic: str,
    paper_limit: int = 5,
    project_id: str | None = None,
    user_id: str | None = None,
    alpha: float = 0.15,
    beta: float = 0.65,
    papers: list[Paper] | None = None,
) -> ResearchResponse:
    logger.info(
        "Running research workflow topic=%r paper_limit=%d project_id=%r alpha=%.2f beta=%.2f",
        topic,
        paper_limit,
        project_id,
        alpha,
        beta,
    )
    initial_state: dict[str, Any] = {
        "topic": topic.strip(),
        "paper_limit": paper_limit,
        "project_id": project_id,
        "user_id": user_id,
        "alpha": alpha,
        "beta": beta,
    }
    if papers:
        initial_state["papers"] = list(papers)

    graph_result = RESEARCH_GRAPH.invoke(initial_state)
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
    paper_limit: int = 5,
    project_id: str | None = None,
    user_id: str | None = None,
    alpha: float = 0.15,
    beta: float = 0.65,
):
    """
    Streams LangGraph node execution events in real time as each agent runs:
    DISCOVERY -> INGESTION -> ANALYSIS -> GAPS -> REPORT -> COMPLETE
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
        elif "analyze_papers" in update:
            analyses = update["analyze_papers"].get("paper_analyses") or []
            analysis_dicts = [_serialize_analysis(pa) for pa in analyses]
            yield {
                "stage": "ANALYSIS",
                "status": "COMPLETE",
                "paper_analyses": analysis_dicts,
            }
            yield {"stage": "GAPS", "status": "RUNNING"}
        elif "gap_analysis" in update:
            gap_candidates = update["gap_analysis"].get("gap_candidates") or []
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
