from __future__ import annotations

from dataclasses import dataclass
import logging
import re
import time
from typing import Any

import arxiv
import numpy as np
import requests

from app.config.settings import (
    SEMANTIC_SCHOLAR_API_KEY,
    SEMANTIC_SCHOLAR_BACKOFF_SECONDS,
    SEMANTIC_SCHOLAR_MAX_RETRIES,
    SEMANTIC_SCHOLAR_TIMEOUT,
)
from app.rag.embeddings import generate_embeddings, generate_embeddings_batch

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
SEMANTIC_SCHOLAR_FIELDS_PRIMARY = "paperId,title,authors,year,abstract,url,doi,externalIds"
SEMANTIC_SCHOLAR_FIELDS_FALLBACK = "paperId,title,authors,year,abstract,url,doi"
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Paper:
    title: str
    authors: tuple[str, ...]
    year: int | None
    doi: str | None
    source: str
    url: str | None = None
    abstract: str | None = None
    external_id: str | None = None
    relevance_score: float | None = None


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().casefold()


def _normalize_authors(authors: list[Any]) -> tuple[str, ...]:
    names: list[str] = []
    for author in authors:
        if isinstance(author, str):
            name = author
        else:
            name = str(author.get("name", "")).strip()
        if name:
            names.append(name)
    return tuple(names)


def normalize_paper(data: dict[str, Any], source: str) -> Paper:
    title = str(data.get("title", "")).strip()
    authors = data.get("authors") or []
    doi = data.get("doi")
    year = data.get("year")
    url = data.get("url") or data.get("entry_id")
    abstract = data.get("abstract") or data.get("summary")
    external_id = data.get("external_id")
    return Paper(
        title=title,
        authors=_normalize_authors(list(authors)),
        year=int(year) if year is not None else None,
        doi=str(doi).strip() if doi else None,
        source=source,
        url=str(url).strip() if url else None,
        abstract=str(abstract).strip() if abstract else None,
        external_id=str(external_id).strip() if external_id else None,
        relevance_score=None,
    )


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denominator = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denominator == 0.0:
        return 0.0
    return float(np.dot(a, b) / denominator)


def dedupe_papers(papers: list[Paper]) -> list[Paper]:
    seen: set[str] = set()
    unique: list[Paper] = []
    for paper in papers:
        key = paper.doi.casefold() if paper.doi else _normalize_text(paper.title)
        if key in seen:
            continue
        seen.add(key)
        unique.append(paper)
    return unique


def fetch_semantic_scholar(query: str, limit: int = 5, timeout: int | None = None) -> list[Paper]:
    timeout_value = timeout or SEMANTIC_SCHOLAR_TIMEOUT
    headers: dict[str, str] = {}
    if SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = SEMANTIC_SCHOLAR_API_KEY

    response: requests.Response | None = None
    last_error: Exception | None = None
    max_attempts = max(1, SEMANTIC_SCHOLAR_MAX_RETRIES)
    fields = SEMANTIC_SCHOLAR_FIELDS_PRIMARY
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(
                SEMANTIC_SCHOLAR_URL,
                params={
                    "query": query,
                    "limit": limit,
                    "fields": fields,
                },
                headers=headers,
                timeout=timeout_value,
            )
            if response.status_code == 400 and fields != SEMANTIC_SCHOLAR_FIELDS_FALLBACK:
                logger.warning(
                    "Semantic Scholar rejected fields=%r; retrying with fallback field set",
                    fields,
                )
                fields = SEMANTIC_SCHOLAR_FIELDS_FALLBACK
                continue
            if response.status_code in {429, 500, 502, 503, 504} and attempt < max_attempts:
                wait_seconds = SEMANTIC_SCHOLAR_BACKOFF_SECONDS * attempt
                logger.warning(
                    "Semantic Scholar temporary failure (status=%s), retrying in %.1fs (attempt %d/%d)",
                    response.status_code,
                    wait_seconds,
                    attempt,
                    max_attempts,
                )
                time.sleep(wait_seconds)
                continue
            response.raise_for_status()
            break
        except requests.RequestException as exc:
            last_error = exc
            if attempt >= max_attempts:
                raise
            wait_seconds = SEMANTIC_SCHOLAR_BACKOFF_SECONDS * attempt
            logger.warning(
                "Semantic Scholar request failed, retrying in %.1fs (attempt %d/%d): %s",
                wait_seconds,
                attempt,
                max_attempts,
                exc,
            )
            time.sleep(wait_seconds)
    if response is None:
        raise RuntimeError("Semantic Scholar request failed without response") from last_error

    payload = response.json()
    data = payload.get("data", [])
    papers = []
    for item in data:
        external_ids = item.get("externalIds") or {}
        normalized = normalize_paper(
            {
                "title": item.get("title", ""),
                "authors": item.get("authors", []),
                "year": item.get("year"),
                "doi": item.get("doi") or external_ids.get("DOI"),
                "url": item.get("url"),
                "abstract": item.get("abstract"),
                "external_id": item.get("paperId"),
            },
            source="semantic_scholar",
        )
        papers.append(normalized)
    return papers


def fetch_arxiv(query: str, limit: int = 5) -> list[Paper]:
    search = arxiv.Search(query=query, max_results=limit)
    papers = []
    if hasattr(search, "results"):
        iterator = search.results()
    else:
        iterator = arxiv.Client().results(search)
    for result in iterator:
        papers.append(
            normalize_paper(
                {
                    "title": result.title,
                    "authors": [author.name for author in result.authors],
                    "year": result.published.year if result.published else None,
                    "doi": result.doi,
                    "url": result.entry_id,
                    "abstract": result.summary,
                    "external_id": result.entry_id,
                },
                source="arxiv",
            )
        )
    return papers


def fetch_papers(query: str, limit: int = 5) -> list[Paper]:
    errors: list[Exception] = []
    semantic_papers: list[Paper] = []
    arxiv_papers: list[Paper] = []

    try:
        semantic_papers = fetch_semantic_scholar(query, limit=limit)
    except Exception as exc:
        errors.append(exc)
        logger.warning("Semantic Scholar search failed, continuing with arXiv only: %s", exc)

    try:
        arxiv_papers = fetch_arxiv(query, limit=limit)
    except Exception as exc:
        errors.append(exc)
        logger.warning("arXiv search failed, continuing with Semantic Scholar only: %s", exc)

    papers = dedupe_papers(semantic_papers + arxiv_papers)
    if not papers and errors:
        raise RuntimeError("Both Semantic Scholar and arXiv searches failed") from errors[0]

    if not papers:
        return []

    query_embedding = np.array(generate_embeddings(query), dtype=float)
    texts = [f"{paper.title}\n\n{paper.abstract or ''}".strip() for paper in papers]
    paper_embeddings = generate_embeddings_batch(texts)

    ranked: list[Paper] = []
    for paper, embedding in zip(papers, paper_embeddings, strict=True):
        score = _cosine_similarity(query_embedding, np.array(embedding, dtype=float))
        ranked.append(
            Paper(
                title=paper.title,
                authors=paper.authors,
                year=paper.year,
                doi=paper.doi,
                source=paper.source,
                url=paper.url,
                abstract=paper.abstract,
                external_id=paper.external_id,
                relevance_score=score,
            )
        )

    ranked.sort(key=lambda paper: paper.relevance_score or -1.0, reverse=True)
    return ranked
