from __future__ import annotations

import logging
from pathlib import Path

from app.rag.retrieval import (
    RetrievedChunk,
    assemble_context,
    extract_sources,
    retrieve_context,
    select_grounded_chunks,
)
from app.services.llmService import ask, sanitize_prompt_context

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "rag_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(question: str, context: str) -> str:
    safe_context = sanitize_prompt_context(context)
    return _load_prompt().format(context=f"<context>\n{safe_context}\n</context>", question=question.strip())


def _format_references(context_chunks: list[RetrievedChunk]) -> str:
    sources = extract_sources(context_chunks)
    if not sources:
        return ""
    lines = ["\n\nReferences:"]
    for index, source in enumerate(sources, start=1):
        authors = ", ".join(source.authors) if source.authors else "Unknown authors"
        year = str(source.year) if source.year is not None else "n.d."
        link = source.doi or source.url or "N/A"
        lines.append(f"[{index}] {source.title} — {authors} ({year}) [{link}]")
    return "\n".join(lines)


def answer_question(question: str, limit: int = 5, project_id: str | None = None) -> str:
    chunks = retrieve_context(question, limit=limit, project_id=project_id)
    grounded_chunks = select_grounded_chunks(chunks)
    context = assemble_context(grounded_chunks)
    if not context:
        return "I do not know based on the available indexed context for this project."

    try:
        answer = ask(build_prompt(question, context))
        return f"{answer.strip()}{_format_references(grounded_chunks)}".strip()
    except Exception as exc:
        logger.info("LLM unavailable (%s). Returning grounded passages directly.", exc)
        passages_text = "\n\n".join(
            f"**Passage {i}:** {c.text}" for i, c in enumerate(grounded_chunks[:3], start=1)
        )
        return (
            f"Directly retrieved evidence from corpus:\n\n{passages_text}"
            f"{_format_references(grounded_chunks)}"
        )
