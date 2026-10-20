from __future__ import annotations

import logging
from pathlib import Path
import re

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

GENERIC_REFUSAL_MESSAGE = (
    "I can only answer questions directly concerning the papers discovered and analyzed in this project. "
    "Please ask about the methodologies, findings, datasets, or conclusions from your indexed literature."
)

OFF_TOPIC_REGEX = re.compile(
    r"\b(?:write|create|generate|code|solve|program)\s+(?:a\s+)?(?:python|javascript|typescript|c\+\+|java|rust|bash|sql|code|script|function|program|app|game|calculator)\b"
    r"|\b(?:what\s+is\s+the\s+capital\s+of|who\s+is\s+the\s+president\s+of|tell\s+me\s+a\s+joke|how\s+to\s+cook|recipe\s+for|what\s+is\s+the\s+weather)\b",
    re.IGNORECASE,
)


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
    clean_q = question.strip()
    if not clean_q:
        return "Please ask a question about the papers indexed in this project."

    # Intercept clearly generic/off-topic questions that are not about the fetched papers
    if OFF_TOPIC_REGEX.search(clean_q):
        return GENERIC_REFUSAL_MESSAGE

    chunks = retrieve_context(clean_q, limit=limit, project_id=project_id)
    grounded_chunks = select_grounded_chunks(chunks)
    context = assemble_context(grounded_chunks)
    if not context or not grounded_chunks:
        return (
            "I can only answer questions directly concerning the papers discovered and analyzed in this project. "
            "No relevant passages were found in your literature corpus for this query."
        )

    try:
        answer = ask(build_prompt(clean_q, context))
        return f"{answer.strip()}{_format_references(grounded_chunks)}".strip()
    except Exception as exc:
        logger.info("LLM unavailable (%s). Synthesizing concise grounded findings.", exc)
        key_findings = []
        for c in grounded_chunks[:3]:
            passage_clean = c.text.replace("\n", " ").strip()
            # Extract first 1-2 clean sentences
            sentences = [s.strip() for s in passage_clean.split(".") if len(s.strip()) > 20]
            summary = ". ".join(sentences[:2]) + "." if sentences else (passage_clean[:180] + "...")
            source_title = getattr(getattr(c, "source", None), "title", "Indexed Paper") or "Indexed Paper"
            key_findings.append(f"• {summary} ([{source_title}])")

        agent_response = (
            "Based on the literature indexed for this project:\n\n"
            + "\n".join(key_findings)
        )
        return f"{agent_response}{_format_references(grounded_chunks)}".strip()
