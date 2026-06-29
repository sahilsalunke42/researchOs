from __future__ import annotations

import hashlib
import logging
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Iterable

import requests
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.rag.chunking import chunk_text
from app.rag.embeddings import generate_embeddings
from app.rag.ingestion import extract_pdf_text
from app.services.paper_service import Paper, dedupe_papers
from app.vectordb.qdrantClient import client

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = "research_papers"


@dataclass(frozen=True)
class IngestionResult:
    paper_key: str
    chunk_count: int
    point_ids: tuple[str, ...]
    source_url: str | None


def paper_key(paper: Paper) -> str:
    if paper.doi:
        return paper.doi.casefold().strip()
    authors = ",".join(author.casefold().strip() for author in paper.authors)
    return f"{paper.title.casefold().strip()}|{authors}|{paper.year or ''}"


def clean_extracted_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.split("\n")]
    cleaned = "\n".join(line for line in lines if line)
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def _paper_from_pdf_url(paper: Paper, pdf_url: str | None) -> str:
    if pdf_url:
        return pdf_url
    if paper.url and paper.url.lower().endswith(".pdf"):
        return paper.url
    if paper.source == "arxiv":
        match = re.search(r"arxiv\.org/(?:abs|pdf)/([^?#/]+)", paper.url or "")
        if match:
            arxiv_id = match.group(1).removesuffix(".pdf")
            return f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    raise ValueError(f"no downloadable PDF URL for paper: {paper.title}")


def download_pdf(url: str, destination: Path, timeout: int = 60) -> Path:
    response = requests.get(url, stream=True, timeout=timeout)
    response.raise_for_status()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                handle.write(chunk)
    return destination


def ensure_collection(collection_name: str, vector_size: int) -> None:
    collections = client.get_collections().collections
    if any(collection.name == collection_name for collection in collections):
        return
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )


def build_point_id(paper: Paper, chunk_index: int, chunk_text_value: str) -> str:
    key = paper_key(paper)
    digest = hashlib.sha1(f"{key}:{chunk_index}:{chunk_text_value}".encode("utf-8")).hexdigest()
    return digest


def build_payload(
    paper: Paper,
    *,
    source_url: str,
    chunk_index: int,
    total_chunks: int,
    chunk_text_value: str,
) -> dict[str, Any]:
    return {
        "paper_key": paper_key(paper),
        "title": paper.title,
        "authors": list(paper.authors),
        "year": paper.year,
        "doi": paper.doi,
        "source": paper.source,
        "url": paper.url,
        "source_url": source_url,
        "external_id": paper.external_id,
        "chunk_id": f"{paper_key(paper)}:{chunk_index}",
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "text": chunk_text_value,
    }


def prepare_points(
    paper: Paper,
    text: str,
    *,
    source_url: str,
    chunk_size: int = 800,
    overlap: int = 120,
) -> list[PointStruct]:
    cleaned_text = clean_extracted_text(text)
    chunks = chunk_text(cleaned_text, chunk_size=chunk_size, overlap=overlap)
    if not chunks:
        return []

    points: list[PointStruct] = []
    total_chunks = len(chunks)
    for index, chunk in enumerate(chunks, start=1):
        vector = generate_embeddings(chunk)
        payload = build_payload(
            paper,
            source_url=source_url,
            chunk_index=index,
            total_chunks=total_chunks,
            chunk_text_value=chunk,
        )
        points.append(
            PointStruct(
                id=build_point_id(paper, index, chunk),
                vector=vector,
                payload=payload,
            )
        )
    return points


def ingest_pdf_file(
    paper: Paper,
    pdf_path: str | Path,
    *,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    source_url: str | None = None,
    chunk_size: int = 800,
    overlap: int = 120,
) -> IngestionResult:
    path = Path(pdf_path)
    text = extract_pdf_text(path)
    resolved_source_url = source_url or str(path)
    points = prepare_points(
        paper,
        text,
        source_url=resolved_source_url,
        chunk_size=chunk_size,
        overlap=overlap,
    )
    if not points:
        return IngestionResult(paper_key=paper_key(paper), chunk_count=0, point_ids=(), source_url=resolved_source_url)

    ensure_collection(collection_name, len(points[0].vector))
    client.upsert(collection_name=collection_name, points=points)
    return IngestionResult(
        paper_key=paper_key(paper),
        chunk_count=len(points),
        point_ids=tuple(str(point.id) for point in points),
        source_url=resolved_source_url,
    )


def ingest_papers(
    papers: Iterable[Paper],
    *,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    pdf_url_resolver: Callable[[Paper], str | None] | None = None,
    chunk_size: int = 800,
    overlap: int = 120,
) -> list[IngestionResult]:
    results: list[IngestionResult] = []
    for paper in dedupe_papers(list(papers)):
        pdf_url = pdf_url_resolver(paper) if pdf_url_resolver else None
        source_url = _paper_from_pdf_url(paper, pdf_url)
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = Path(temp_dir) / f"{paper_key(paper)}.pdf"
            download_pdf(source_url, pdf_path)
            results.append(
                ingest_pdf_file(
                    paper,
                    pdf_path,
                    collection_name=collection_name,
                    source_url=source_url,
                    chunk_size=chunk_size,
                    overlap=overlap,
                )
            )
    return results
