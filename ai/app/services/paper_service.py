from __future__ import annotations

from dataclasses import dataclass
import html
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
SEMANTIC_SCHOLAR_FIELDS_PRIMARY = "paperId,title,authors,year,abstract,url,doi,externalIds,openAccessPdf"
SEMANTIC_SCHOLAR_FIELDS_FALLBACK = "paperId,title,authors,year,abstract,url,doi"
logger = logging.getLogger(__name__)


def clean_human_readable_text(text: str | None) -> str:
    """
    Cleans raw paper text, abstracts, and summaries to ensure they are human-readable
    and free of ASCII/LaTeX artifacts, hard line-breaks, unescaped HTML, or control chars.
    """
    if not text:
        return ""

    # Unescape HTML entities (&amp;, &lt;, &gt;, &#39;, &quot;)
    cleaned = html.unescape(text)

    # Convert common LaTeX math/formatting artifacts into readable characters
    cleaned = re.sub(r"\\(?:cite|citep|citet)\{[^}]*\}", "", cleaned)
    cleaned = re.sub(r"\\(?:textbf|textit|emph|mathrm|mathbf)\{([^}]*)\}", r"\1", cleaned)
    cleaned = re.sub(r"\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|sigma|omega)", lambda m: m.group(0)[1:], cleaned)
    cleaned = cleaned.replace(r"\&", "&").replace(r"\%", "%").replace(r"\$", "$").replace(r"\_", "_")
    cleaned = cleaned.replace(r"~", " ")

    # Normalize TeX style quotes ``word'' or `word' to standard quotes
    cleaned = re.sub(r"``|''", '"', cleaned)
    cleaned = re.sub(r"`|'", "'", cleaned)

    # Remove non-printable / control characters (except standard newlines/tabs)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", " ", cleaned)

    # Unwrap single hard line-breaks inside sentences, while keeping true paragraphs
    paragraphs = re.split(r"\n\s*\n", cleaned)
    normalized_paragraphs: list[str] = []
    for para in paragraphs:
        para_unwrapped = re.sub(r"(?<=\S)\n(?=\S)", " ", para)
        para_clean = re.sub(r"\s+", " ", para_unwrapped).strip()
        if para_clean:
            normalized_paragraphs.append(para_clean)

    return "\n\n".join(normalized_paragraphs)


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
    pdf_url: str | None = None


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
    raw_title = str(data.get("title", "")).strip()
    title = clean_human_readable_text(raw_title)
    title = re.sub(r"\s+", " ", title).strip() or raw_title
    authors = data.get("authors") or []
    doi = data.get("doi")
    year = data.get("year")
    url = data.get("url") or data.get("entry_id")
    raw_abstract = data.get("abstract") or data.get("summary")
    cleaned_abstract = clean_human_readable_text(raw_abstract) if raw_abstract else None
    abstract = cleaned_abstract if cleaned_abstract else None
    external_id = data.get("external_id")
    pdf_url = data.get("pdf_url")
    return Paper(
        title=title,
        authors=_normalize_authors(list(authors)),
        year=int(year) if year is not None else None,
        doi=str(doi).strip() if doi else None,
        source=source,
        url=str(url).strip() if url else None,
        abstract=abstract,
        external_id=str(external_id).strip() if external_id else None,
        relevance_score=None,
        pdf_url=str(pdf_url).strip() if pdf_url else None,
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


def reconstruct_abstract(inverted_index: dict[str, list[int]] | None) -> str | None:
    if not inverted_index:
        return None
    words: list[tuple[int, str]] = []
    for word, positions in inverted_index.items():
        for pos in positions:
            words.append((pos, word))
    words.sort(key=lambda x: x[0])
    return " ".join(w for _, w in words)


def fetch_openalex(query: str, limit: int = 5, timeout: int = 12) -> list[Paper]:
    """
    Fetches peer-reviewed academic literature from the OpenAlex API.
    Provides fast, free, open-access academic literature discovery without strict rate-limiting.
    """
    url = "https://api.openalex.org/works"
    params = {"search": query, "per-page": limit}
    headers = {"User-Agent": "ResearchOS/1.0 (mailto:support@researchos.local)"}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            logger.warning("OpenAlex returned HTTP %d", resp.status_code)
            return []
        data = resp.json().get("results", [])
        papers: list[Paper] = []
        for item in data:
            title = item.get("display_name") or item.get("title") or ""
            authors = [
                a.get("author", {}).get("display_name")
                for a in item.get("authorships", [])
                if a.get("author", {}).get("display_name")
            ]
            doi = item.get("doi")
            if doi and doi.startswith("https://doi.org/"):
                doi = doi[len("https://doi.org/"):]
            abstract = reconstruct_abstract(item.get("abstract_inverted_index"))
            primary_loc = item.get("primary_location") or {}
            best_oa_loc = item.get("best_oa_location") or {}
            open_access = item.get("open_access") or {}

            # Direct PDF retrieval if available
            pdf_url = best_oa_loc.get("pdf_url") or primary_loc.get("pdf_url")
            oa_url = open_access.get("oa_url")
            if not pdf_url and oa_url and str(oa_url).lower().endswith(".pdf"):
                pdf_url = oa_url

            url_val = item.get("doi") or primary_loc.get("landing_page_url") or item.get("id")
            papers.append(
                normalize_paper(
                    {
                        "title": title,
                        "authors": authors,
                        "year": item.get("publication_year"),
                        "doi": doi,
                        "url": url_val,
                        "abstract": abstract,
                        "external_id": item.get("id"),
                        "pdf_url": pdf_url,
                    },
                    source="openalex",
                )
            )
        return papers
    except Exception as exc:
        logger.warning("OpenAlex search failed: %s", exc)
        return []


def fetch_semantic_scholar(query: str, limit: int = 5, timeout: int | None = None) -> list[Paper]:
    timeout_value = timeout or SEMANTIC_SCHOLAR_TIMEOUT
    headers: dict[str, str] = {"User-Agent": "ResearchOS/1.0 (academic-research-assistant)"}
    if SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = SEMANTIC_SCHOLAR_API_KEY

    response: requests.Response | None = None
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
                fields = SEMANTIC_SCHOLAR_FIELDS_FALLBACK
                continue
            if response.status_code == 429:
                logger.warning("Semantic Scholar rate-limited (HTTP 429); skipping to alternate academic providers.")
                return []
            if response.status_code in {500, 502, 503, 504} and attempt < max_attempts:
                time.sleep(SEMANTIC_SCHOLAR_BACKOFF_SECONDS * attempt)
                continue
            response.raise_for_status()
            break
        except requests.RequestException as exc:
            if attempt >= max_attempts:
                logger.warning("Semantic Scholar request failed: %s", exc)
                return []
            time.sleep(SEMANTIC_SCHOLAR_BACKOFF_SECONDS * attempt)

    if response is None or not response.ok:
        return []

    try:
        payload = response.json()
        data = payload.get("data", [])
        papers = []
        for item in data:
            external_ids = item.get("externalIds") or {}
            oa_pdf = item.get("openAccessPdf") or {}
            pdf_url = oa_pdf.get("url")
            normalized = normalize_paper(
                {
                    "title": item.get("title", ""),
                    "authors": item.get("authors", []),
                    "year": item.get("year"),
                    "doi": item.get("doi") or external_ids.get("DOI"),
                    "url": item.get("url"),
                    "abstract": item.get("abstract"),
                    "external_id": item.get("paperId"),
                    "pdf_url": pdf_url,
                },
                source="semantic_scholar",
            )
            papers.append(normalized)
        return papers
    except Exception as exc:
        logger.warning("Failed to parse Semantic Scholar payload: %s", exc)
        return []


def fetch_arxiv(query: str, limit: int = 5) -> list[Paper]:
    try:
        client = arxiv.Client(
            page_size=min(limit, 25),
            delay_seconds=2.0,
            num_retries=1,
        )
        search = arxiv.Search(query=query, max_results=limit)
        papers = []
        for result in client.results(search):
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
                        "pdf_url": result.pdf_url,
                    },
                    source="arxiv",
                )
            )
        return papers
    except Exception as exc:
        logger.warning("arXiv search failed or rate-limited: %s", exc)
        return []


def fetch_papers(query: str, limit: int = 5) -> list[Paper]:
    # 1. Fetch from OpenAlex (fastest & highest availability)
    openalex_papers = fetch_openalex(query, limit=limit)

    # 2. Fetch from Semantic Scholar
    semantic_papers = fetch_semantic_scholar(query, limit=limit)

    # 3. Fetch from arXiv
    arxiv_papers = fetch_arxiv(query, limit=limit)

    combined = openalex_papers + semantic_papers + arxiv_papers
    papers = dedupe_papers(combined)

    if not papers:
        logger.warning("No papers discovered from any academic provider for query: %r", query)
        return []

    try:
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
                    pdf_url=paper.pdf_url,
                )
            )

        ranked.sort(key=lambda paper: paper.relevance_score or -1.0, reverse=True)
        return ranked[:limit]
    except Exception as exc:
        logger.warning("Error computing embedding relevance ranking; returning deduplicated papers: %s", exc)
        return papers[:limit]
