from __future__ import annotations

from pathlib import Path

from app.rag.retrieval import assemble_context, extract_sources, retrieve_context, select_grounded_chunks
from app.services.llmService import ask

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "report_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(topic: str, context: str) -> str:
    return _load_prompt().format(context=context, topic=topic.strip())


def generate_report(topic: str, limit: int = 8) -> str:
    chunks = retrieve_context(topic, limit=limit)
    grounded_chunks = select_grounded_chunks(chunks)
    context = assemble_context(grounded_chunks)
    if not context:
        return "No source context was found for this topic."
    report = ask(build_prompt(topic, context)).strip()
    sources = extract_sources(grounded_chunks)
    if not sources:
        return report

    references_lines = ["## References"]
    for index, source in enumerate(sources, start=1):
        authors = ", ".join(source.authors) if source.authors else "Unknown authors"
        year = str(source.year) if source.year is not None else "n.d."
        source_url = source.url or "N/A"
        citation_key = source.doi or source_url
        references_lines.append(f"{index}. **{source.title}** — {authors} ({year}) [{citation_key}]")
    return f"{report}\n\n" + "\n".join(references_lines)
