from fastapi import APIRouter
from app.schemas.request import AskRequest
from app.schemas.response import AskResponse
from app.schemas.report import ReportRequest, ReportResponse
from app.services.rag_service import answer_question
from app.services.report_service import generate_report

router = APIRouter()

@router.post("/ask")
def ask(request: AskRequest):
    answer = answer_question(request.prompt)
    return AskResponse(
        response=answer
    )


@router.post("/report")
def report(request: ReportRequest):
    report_text = generate_report(request.topic)
    return ReportResponse(report=report_text)