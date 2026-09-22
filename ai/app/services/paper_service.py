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
PDF_PROBE_HEADERS = {
    "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
    "Range": "bytes=0-4",
    "User-Agent": "ResearchOS/1.0 (evidence retrieval)",
}


@dataclass(frozen=True)
class Paper:
    title: str
    authors: tuple[str, ...]
    year: int | None
    doi: str | None
    source: str
    url: str | None = None
    pdf_url: str | None = None
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
    pdf_url = data.get("pdf_url")
    abstract = data.get("abstract") or data.get("summary")
    external_id = data.get("external_id")
    return Paper(
        title=title,
        authors=_normalize_authors(list(authors)),
        year=int(year) if year is not None else None,
        doi=str(doi).strip() if doi else None,
        source=source,
        url=str(url).strip() if url else None,
        pdf_url=str(pdf_url).strip() if pdf_url else None,
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
                    "pdf_url": getattr(result, "pdf_url", None),
                    "abstract": result.summary,
                    "external_id": result.entry_id,
                },
                source="arxiv",
            )
        )
    return papers


def _has_downloadable_pdf(pdf_url: str, timeout: int = 20) -> bool:
    """Check that a provider URL returns PDF content before selecting it."""
    try:
        with requests.get(
            pdf_url,
            headers=PDF_PROBE_HEADERS,
            stream=True,
            timeout=timeout,
        ) as response:
            content_type = response.headers.get("content-type", "").casefold()
            if response.status_code not in {200, 206}:
                logger.info(
                    "Skipping PDF candidate status=%d url=%s",
                    response.status_code,
                    pdf_url,
                )
                return False
            if content_type and "pdf" not in content_type and "octet-stream" not in content_type:
                logger.info(
                    "Skipping PDF candidate content_type=%r url=%s",
                    content_type,
                    pdf_url,
                )
                return False
            if next(response.iter_content(chunk_size=5), b"") != b"%PDF-":
                logger.info("Skipping PDF candidate with invalid magic bytes url=%s", pdf_url)
                return False
    except requests.RequestException as exc:
        logger.info("Skipping unreachable PDF candidate url=%s error=%s", pdf_url, exc)
        return False

    return True


def fetch_openalex(query: str, limit: int = 5) -> list[Paper]:
    url = "https://api.openalex.org/works"

    # Request extra results because some OpenAlex papers
    # do not have a downloadable PDF.
    search_limit = min(max(limit * 5, 10), 50)

    logger.info("OpenAlex request started query=%r limit=%d", query, limit)
    response = requests.get(
        url,
        params={
            "search": query,
            "per-page": search_limit,
            "select": (
                "id,title,authorships,publication_year,doi,"
                "best_oa_location,primary_location,abstract_inverted_index"
            ),
        },
        timeout=20,
    )

    logger.info("OpenAlex HTTP status=%d", response.status_code)
    response.raise_for_status()

    payload = response.json()
    raw_results = payload.get("results", [])
    logger.info("OpenAlex returned raw_results=%d", len(raw_results))

    papers: list[Paper] = []
    normalized_count = 0
    advertised_pdf_count = 0
    pdf_ready_count = 0

    for item in raw_results:
        primary_location = item.get("primary_location") or {}

        best_oa_location = (
            item.get("best_oa_location") or {}
        )

        # Prefer an actual PDF URL.
        pdf_url = (
            best_oa_location.get("pdf_url")
            or primary_location.get("pdf_url")
        )

        # Skip papers that do not expose a downloadable PDF.
        if not pdf_url:
            continue

        advertised_pdf_count += 1
        if not _has_downloadable_pdf(str(pdf_url)):
            continue

        pdf_ready_count += 1

        authors = [
            (author.get("author") or {}).get(
                "display_name"
            ) or ""
            for author in (item.get("authorships") or [])
        ]

        authors = [
            name for name in authors
            if name
        ]

        abstract = None

        inverted_index = (
            item.get("abstract_inverted_index")
            or {}
        )

        if inverted_index:
            words: list[tuple[int, str]] = []

            for word, positions in inverted_index.items():
                for position in positions:
                    words.append(
                        (position, word)
                    )

            words.sort(
                key=lambda x: x[0]
            )

            abstract = " ".join(
                word for _, word in words
            )

        paper = normalize_paper(
                {
                    "title": item.get("title") or "",
                    "authors": authors,
                    "year": item.get("publication_year"),
                    "doi": item.get("doi"),
                    "url": (
                        best_oa_location.get("landing_page_url")
                        or primary_location.get("landing_page_url")
                        or item.get("id")
                    ),
                    "pdf_url": pdf_url,
                    "abstract": abstract,
                    "external_id": item.get("id"),
                },
                source="openalex",
            )
        normalized_count += 1
        papers.append(paper)

        if len(papers) >= limit:
            break

    logger.info(
        "OpenAlex normalized=%d advertised_pdf=%d pdf_ready=%d returning=%d",
        normalized_count,
        advertised_pdf_count,
        pdf_ready_count,
        len(papers),
    )

    return papers


def fetch_papers(
    query: str,
    limit: int = 5,
) -> list[Paper]:

    openalex_papers: list[Paper] = []
    arxiv_papers: list[Paper] = []

    # OpenAlex is the primary source.
    try:
        openalex_papers = fetch_openalex(
            query,
            limit=limit,
        )

        logger.info(
            "OpenAlex returned %d PDF-ready papers",
            len(openalex_papers),
        )

    except Exception as exc:
        logger.warning(
            "OpenAlex search failed: %s",
            exc,
        )

    # If OpenAlex cannot provide enough PDF-ready papers,
    # use arXiv for the remaining papers.
    if len(openalex_papers) < limit:

        try:
            remaining = (
                limit - len(openalex_papers)
            )

            arxiv_papers = fetch_arxiv(
                query,
                limit=remaining,
            )

            logger.info(
                "arXiv returned %d fallback papers",
                len(arxiv_papers),
            )

        except Exception as exc:
            logger.warning(
                "arXiv fallback failed: %s",
                exc,
            )

    papers = dedupe_papers(
        openalex_papers + arxiv_papers
    )

    if not papers:
        logger.warning(
            "No papers were retrieved for query=%r",
            query,
        )
        return []

    logger.info("fetch_papers returning=%d", min(len(papers), limit))

    query_embedding = np.array(
        generate_embeddings(query),
        dtype=float,
    )

    texts = [
        f"{paper.title}\n\n"
        f"{paper.abstract or ''}".strip()
        for paper in papers
    ]

    paper_embeddings = (
        generate_embeddings_batch(texts)
    )

    ranked: list[Paper] = []

    for paper, embedding in zip(
        papers,
        paper_embeddings,
        strict=True,
    ):

        score = _cosine_similarity(
            query_embedding,
            np.array(
                embedding,
                dtype=float,
            ),
        )

        ranked.append(
            Paper(
                title=paper.title,
                authors=paper.authors,
                year=paper.year,
                doi=paper.doi,
                source=paper.source,
                url=paper.url,
                pdf_url=paper.pdf_url,
                abstract=paper.abstract,
                external_id=paper.external_id,
                relevance_score=score,
            )
        )

    ranked.sort(
        key=lambda paper:
            paper.relevance_score or -1.0,
        reverse=True,
    )

    return ranked[:limit]
