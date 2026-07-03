from __future__ import annotations

from pathlib import Path

from app.rag.retrieval import (
    RetrievedChunk,
    assemble_context,
    extract_sources,
    retrieve_context,
    select_grounded_chunks,
)
from app.services.llmService import ask

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "rag_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(question: str, context: str) -> str:
    return _load_prompt().format(context=context, question=question.strip())


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


def answer_question(question: str, limit: int = 5) -> str:
    chunks = retrieve_context(question, limit=limit)
    grounded_chunks = select_grounded_chunks(chunks)
    context = assemble_context(grounded_chunks)
    if not context:
        return "I do not know based on the available context."
    answer = ask(build_prompt(question, context))
    return f"{answer.strip()}{_format_references(grounded_chunks)}".strip()
