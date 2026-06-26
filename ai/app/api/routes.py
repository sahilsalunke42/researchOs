from fastapi import APIRouter
from app.schemas.request import AskRequest
from app.schemas.response import AskResponse
from app.services.llmService import ask

router = APIRouter()

@router.post("/ask")
def ask(request: AskRequest):

    answer = ask(
        request.prompt
    )
    return AskResponse(
        response=answer
    )