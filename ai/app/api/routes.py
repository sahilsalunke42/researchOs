from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.ingest import IngestRequest, IngestResponse, IngestSelectedRequest
from app.schemas.papers import PaperSearchRequest, PaperSearchResponse
from app.schemas.report import ReportRequest, ReportResponse
from app.schemas.request import AskRequest
from app.schemas.research import ResearchRequest, ResearchResponse
from app.schemas.response import AskResponse
from app.security.service_auth import verify_service_token
from app.services.rag_service import answer_question
from app.services.report_service import generate_report
from app.services.research_service import ingest_query, ingest_selected_papers, run_research, search_papers, stream_research
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
def ask(
    request: AskRequest,
    _token: str = Depends(verify_service_token),
) -> AskResponse:
    try:
        answer = answer_question(request.prompt, project_id=request.project_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to answer question")
        raise HTTPException(status_code=500, detail="Failed to generate answer") from exc
    return AskResponse(response=answer)


@router.post("/report", response_model=ReportResponse)
def report(
    request: ReportRequest,
    _token: str = Depends(verify_service_token),
) -> ReportResponse:
    try:
        report_text = generate_report(request.topic)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to generate report")
        raise HTTPException(status_code=500, detail="Failed to generate report") from exc
    return ReportResponse(report=report_text)


@router.post("/papers/search", response_model=PaperSearchResponse)
def papers_search(
    request: PaperSearchRequest,
    _token: str = Depends(verify_service_token),
) -> PaperSearchResponse:
    try:
        return search_papers(request.query, limit=request.limit)
    except Exception as exc:
        logger.exception("Failed to search papers")
        raise HTTPException(status_code=502, detail="Failed to search papers") from exc


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    request: IngestRequest,
    _token: str = Depends(verify_service_token),
) -> IngestResponse:
    try:
        return ingest_query(request.query, limit=request.limit)
    except Exception as exc:
        logger.exception("Failed to ingest papers")
        raise HTTPException(status_code=502, detail="Failed to ingest papers") from exc


@router.post("/ingest/selected", response_model=IngestResponse)
def ingest_selected(
    request: IngestSelectedRequest,
    _token: str = Depends(verify_service_token),
) -> IngestResponse:
    try:
        return ingest_selected_papers(request.papers)
    except Exception as exc:
        logger.exception("Failed to ingest selected papers")
        raise HTTPException(status_code=502, detail="Failed to ingest selected papers") from exc


@router.post("/research", response_model=ResearchResponse)
def research(
    request: ResearchRequest,
    _token: str = Depends(verify_service_token),
) -> ResearchResponse:
    try:
        return run_research(
            topic=request.topic,
            paper_limit=request.paper_limit,
            project_id=request.project_id,
            user_id=request.user_id,
            alpha=request.alpha,
            beta=request.beta,
        )
    except Exception as exc:
        logger.exception("Failed to run research workflow")
        raise HTTPException(status_code=502, detail=f"Failed to run research workflow: {exc}") from exc


@router.post("/research/stream")
def research_stream(
    request: ResearchRequest,
    _token: str = Depends(verify_service_token),
) -> StreamingResponse:
    def line_generator():
        try:
            for event in stream_research(
                topic=request.topic,
                paper_limit=request.paper_limit,
                project_id=request.project_id,
                user_id=request.user_id,
                alpha=request.alpha,
                beta=request.beta,
            ):
                yield json.dumps(event) + "\n"
        except Exception as exc:
            logger.exception("Error during research streaming")
            yield json.dumps({"stage": "ERROR", "error": str(exc)}) + "\n"

    return StreamingResponse(line_generator(), media_type="application/x-ndjson")
