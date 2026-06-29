from __future__ import annotations

from pathlib import Path

from app.rag.retrieval import assemble_context, retrieve_context
from app.services.llmService import ask

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "report_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(topic: str, context: str) -> str:
    return _load_prompt().format(context=context, topic=topic.strip())


def generate_report(topic: str, limit: int = 8) -> str:
    chunks = retrieve_context(topic, limit=limit)
    context = assemble_context(chunks)
    if not context:
        return "No source context was found for this topic."
    return ask(build_prompt(topic, context))
