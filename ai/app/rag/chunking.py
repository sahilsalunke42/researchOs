from __future__ import annotations

from typing import Iterable


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")
    if overlap < 0:
        raise ValueError("overlap must not be negative")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks: list[str] = []
    step = chunk_size - overlap
    for start in range(0, len(words), step):
        end = start + chunk_size
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(words):
            break

    return chunks


def chunk_document(text: str, *, title: str | None = None) -> list[dict[str, str]]:
    chunks = chunk_text(text)
    return [
        {"chunk_id": str(index), "title": title or "", "text": chunk}
        for index, chunk in enumerate(chunks, start=1)
    ]