
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.config.settings import QDRANT_COLLECTION
from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = QDRANT_COLLECTION


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    score: float | None
    payload: dict[str, Any]


@dataclass(frozen=True)
class SourceCitation:
    title: str
    authors: tuple[str, ...]
    year: int | None
    doi: str | None
    url: str | None
    source: str | None


def _iter_points(results: Any) -> list[Any]:
    points = getattr(results, "points", results)
    return list(points or [])


def retrieve_context(
    query: str,
    limit: int = 5,
    collection_name: str = DEFAULT_COLLECTION_NAME,
) -> list[RetrievedChunk]:
    query = query.strip()
    if not query:
        raise ValueError("query must not be empty")
    if limit <= 0:
        raise ValueError("limit must be greater than zero")

    query_vector = generate_embeddings(query)
    results = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=limit,
        with_payload=True,
    )

    chunks: list[RetrievedChunk] = []
    for point in _iter_points(results):
        payload = dict(getattr(point, "payload", {}) or {})
        text = payload.get("text") or payload.get("chunk_text")
        if not text:
            logger.warning("Skipping retrieved point without text payload")
            continue

        chunks.append(
            RetrievedChunk(
                text=str(text),
                score=getattr(point, "score", None),
                payload=payload,
            )
        )

    return chunks


def assemble_context(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return ""

    sections: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        payload = chunk.payload
        header_bits = [f"Source {index}"]
        for key in ("title", "authors", "year"):
            value = payload.get(key)
            if value:
                header_bits.append(str(value))
        sections.append(f"{' | '.join(header_bits)}\n{chunk.text}".strip())

    return "\n\n".join(sections)


def select_grounded_chunks(chunks: list[RetrievedChunk], min_score: float = 0.3) -> list[RetrievedChunk]:
    grounded: list[RetrievedChunk] = []
    for chunk in chunks:
        score = chunk.score
        if score is None or score >= min_score:
            grounded.append(chunk)
    return grounded


def extract_sources(chunks: list[RetrievedChunk]) -> list[SourceCitation]:
    sources: list[SourceCitation] = []
    seen: set[tuple[str, str | None, int | None]] = set()
    for chunk in chunks:
        payload = chunk.payload
        title = str(payload.get("title") or "").strip()
        if not title:
            continue
        doi = payload.get("doi")
        year_value = payload.get("year")
        try:
            year = int(year_value) if year_value is not None else None
        except (TypeError, ValueError):
            year = None
        key = (title.casefold(), str(doi) if doi else None, year)
        if key in seen:
            continue
        seen.add(key)
        authors_value = payload.get("authors")
        if isinstance(authors_value, list):
            authors = tuple(str(author).strip() for author in authors_value if str(author).strip())
        else:
            authors = ()
        sources.append(
            SourceCitation(
                title=title,
                authors=authors,
                year=year,
                doi=str(doi) if doi else None,
                url=str(payload.get("source_url") or payload.get("url") or "") or None,
                source=str(payload.get("source") or "") or None,
            )
        )
    return sources


def retrieveContext(query: str, limit: int = 5):
    return [chunk.text for chunk in retrieve_context(query=query, limit=limit)]
