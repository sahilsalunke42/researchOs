from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = "research_papers"


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    score: float | None
    payload: dict[str, Any]


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


def retrieveContext(query: str, limit: int = 5):
    return [chunk.text for chunk in retrieve_context(query=query, limit=limit)]
