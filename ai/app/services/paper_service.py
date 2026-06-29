from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

import arxiv
import requests

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"


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
    )


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


def fetch_semantic_scholar(query: str, limit: int = 5, timeout: int = 20) -> list[Paper]:
    response = requests.get(
        SEMANTIC_SCHOLAR_URL,
        params={
            "query": query,
            "limit": limit,
            "fields": "title,authors,year,abstract,url,doi,externalIds",
        },
        timeout=timeout,
    )
    response.raise_for_status()
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
    for result in search.results():
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
    papers = fetch_semantic_scholar(query, limit=limit) + fetch_arxiv(query, limit=limit)
    return dedupe_papers(papers)
