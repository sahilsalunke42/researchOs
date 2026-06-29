from __future__ import annotations

from pathlib import Path

from app.rag.retrieval import assemble_context, retrieve_context
from app.services.llmService import ask

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "rag_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(question: str, context: str) -> str:
    return _load_prompt().format(context=context, question=question.strip())


def answer_question(question: str, limit: int = 5) -> str:
    chunks = retrieve_context(question, limit=limit)
    context = assemble_context(chunks)
    if not context:
        return "I do not know based on the available context."
    return ask(build_prompt(question, context))
