from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.ingest import IngestRequest, IngestResponse
from app.schemas.papers import PaperSearchRequest, PaperSearchResponse
from app.schemas.report import ReportRequest, ReportResponse
from app.schemas.request import AskRequest
from app.schemas.response import AskResponse
from app.schemas.research import ResearchRequest, ResearchResponse
from app.services.rag_service import answer_question
from app.services.report_service import generate_report
from app.services.research_service import ingest_query, run_research, search_papers
from app.vectordb.qdrantClient import client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    try:
        client.get_collections()
        qdrant_status = "ok"
    except Exception as exc:
        logger.warning("Qdrant health check failed: %s", exc)
        qdrant_status = "unavailable"

    return {"status": "ok", "qdrant": qdrant_status}


@router.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    try:
        answer = answer_question(request.prompt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to answer question")
        raise HTTPException(status_code=500, detail="Failed to generate answer") from exc
    return AskResponse(response=answer)


@router.post("/report", response_model=ReportResponse)
def report(request: ReportRequest) -> ReportResponse:
    try:
        report_text = generate_report(request.topic)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to generate report")
        raise HTTPException(status_code=500, detail="Failed to generate report") from exc
    return ReportResponse(report=report_text)


@router.post("/papers/search", response_model=PaperSearchResponse)
def papers_search(request: PaperSearchRequest) -> PaperSearchResponse:
    try:
        return search_papers(request.query, limit=request.limit)
    except Exception as exc:
        logger.exception("Failed to search papers")
        raise HTTPException(status_code=502, detail="Failed to search papers") from exc


@router.post("/ingest", response_model=IngestResponse)
def ingest(request: IngestRequest) -> IngestResponse:
    try:
        return ingest_query(request.query, limit=request.limit)
    except Exception as exc:
        logger.exception("Failed to ingest papers")
        raise HTTPException(status_code=502, detail="Failed to ingest papers") from exc


@router.post("/research", response_model=ResearchResponse)
def research(request: ResearchRequest) -> ResearchResponse:
    try:
        return run_research(request.topic, paper_limit=request.paper_limit)
    except Exception as exc:
        logger.exception("Failed to run research workflow")
        raise HTTPException(status_code=502, detail="Failed to run research workflow") from exc
