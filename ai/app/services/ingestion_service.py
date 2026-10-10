from __future__ import annotations

import hashlib
import logging
import re
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse

import requests
from qdrant_client.models import PointStruct

from app.config.settings import QDRANT_COLLECTION
from app.rag.chunking import chunk_text, strip_references
from app.rag.embeddings import generate_embeddings_batch
from app.rag.ingestion import extract_pdf_pages, extract_pdf_text
from app.services.paper_service import Paper, dedupe_papers
from app.vectordb.qdrantClient import client, ensure_collection as ensure_qdrant_collection

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = QDRANT_COLLECTION


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


def sanitize_filename(value: str) -> str:
    sanitized = re.sub(r"[^\w.\-]+", "_", value.strip())
    return sanitized[:120] or "paper"


def clean_extracted_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.split("\n")]
    cleaned = "\n".join(line for line in lines if line)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned).strip()
    return strip_references(cleaned)


def _paper_from_pdf_url(
    paper: Paper,
) -> str:

    if paper.pdf_url:
        return paper.pdf_url

    # Direct PDF URL.
    if paper.url:
        parsed = urlparse(paper.url)

        if parsed.path.lower().endswith(".pdf"):
            return paper.url

    # arXiv paper URL -> convert to PDF URL.
    if paper.source == "arxiv":
        parsed = urlparse(paper.url or "")

        path = parsed.path.strip("/")

        arxiv_id: str | None = None

        if path.startswith("abs/"):
            arxiv_id = path[len("abs/"):]

        elif path.startswith("pdf/"):
            arxiv_id = path[len("pdf/"):]

        if arxiv_id:
            normalized_id = arxiv_id.removesuffix(".pdf")

            return (
                f"https://arxiv.org/pdf/"
                f"{normalized_id}.pdf"
            )

    raise ValueError(
        f"no downloadable PDF URL for paper: "
        f"{paper.title}"
    )


def download_pdf(url: str, destination: Path, timeout: int = 60) -> Path:
    with requests.get(url, stream=True, timeout=timeout) as response:
        response.raise_for_status()
        content_type = response.headers.get("content-type", "").casefold()
        if content_type and "pdf" not in content_type and "octet-stream" not in content_type:
            raise ValueError(f"expected a PDF download, received content type {content_type!r}")

        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    handle.write(chunk)

    if not destination.exists() or destination.stat().st_size == 0:
        raise ValueError("downloaded PDF is empty")

    with destination.open("rb") as handle:
        if handle.read(5) != b"%PDF-":
            raise ValueError("downloaded file is not a PDF")
    return destination


def ensure_collection(collection_name: str, vector_size: int) -> None:
    ensure_qdrant_collection(
        collection_name=collection_name,
        vector_size=vector_size,
    )


def build_point_id(paper: Paper, chunk_index: int, chunk_text_value: str, page: int | None = None) -> str:
    key = paper_key(paper)
    digest = hashlib.sha1(f"{key}:{page}:{chunk_index}:{chunk_text_value}".encode("utf-8")).hexdigest()
    # Qdrant accepts point IDs as unsigned integers or UUIDs; use deterministic UUIDs for idempotent upserts.
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, digest))


def build_payload(
    paper: Paper,
    *,
    source_url: str,
    chunk_index: int,
    total_chunks: int,
    chunk_text_value: str,
    page: int | None = None,
) -> dict[str, Any]:
    return {
        "paper_key": paper_key(paper),
        "title": paper.title,
        "authors": list(paper.authors),
        "year": paper.year,
        "doi": paper.doi,
        "source": paper.source,
        "url": paper.url,
        "pdf_url": paper.pdf_url,
        "source_url": source_url,
        "external_id": paper.external_id,
        "chunk_id": f"{paper_key(paper)}:{chunk_index}",
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "page": page,
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

    total_chunks = len(chunks)
    vectors = generate_embeddings_batch(chunks)
    points: list[PointStruct] = []
    for index, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True), start=1):
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


def prepare_points_from_pages(
    paper: Paper,
    pages: list[str],
    *,
    source_url: str,
    chunk_size: int = 800,
    overlap: int = 120,
) -> list[PointStruct]:
    page_chunks: list[tuple[int, str]] = []
    for page_number, page_text in enumerate(pages, start=1):
        cleaned = clean_extracted_text(page_text)
        for chunk in chunk_text(cleaned, chunk_size=chunk_size, overlap=overlap):
            page_chunks.append((page_number, chunk))

    if not page_chunks:
        return []

    vectors = generate_embeddings_batch([chunk for _, chunk in page_chunks])
    total_chunks = len(page_chunks)
    points: list[PointStruct] = []
    for index, ((page_number, chunk), vector) in enumerate(zip(page_chunks, vectors, strict=True), start=1):
        payload = build_payload(
            paper,
            source_url=source_url,
            chunk_index=index,
            total_chunks=total_chunks,
            chunk_text_value=chunk,
            page=page_number,
        )
        points.append(
            PointStruct(
                id=build_point_id(paper, index, chunk, page_number),
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
    pages = extract_pdf_pages(path)
    text = "\n".join(pages).strip()
    if not text:
        raise ValueError(f"PDF contains no extractable text: {path.name}")
    resolved_source_url = source_url or str(path)
    points = prepare_points_from_pages(
        paper,
        pages,
        source_url=resolved_source_url,
        chunk_size=chunk_size,
        overlap=overlap,
    )
    if not points:
        return IngestionResult(paper_key=paper_key(paper), chunk_count=0, point_ids=(), source_url=resolved_source_url)

    ensure_collection(collection_name, len(points[0].vector))
    existing = client.retrieve(collection_name=collection_name, ids=[point.id for point in points], with_payload=False)
    existing_ids = {str(point.id) for point in existing}
    new_points = [point for point in points if str(point.id) not in existing_ids]
    if new_points:
        client.upsert(collection_name=collection_name, points=new_points)
    return IngestionResult(
        paper_key=paper_key(paper),
        chunk_count=len(points),
        point_ids=tuple(str(point.id) for point in new_points),
        source_url=resolved_source_url,
    )


def ingest_papers(
    papers: Iterable[Paper],
    *,
    collection_name: str = DEFAULT_COLLECTION_NAME,
    chunk_size: int = 800,
    overlap: int = 120,
) -> list[IngestionResult]:

    results: list[IngestionResult] = []

    for paper in dedupe_papers(list(papers)):
        try:
            try:
                source_url = _paper_from_pdf_url(paper)
            except ValueError as exc:
                logger.warning(
                    "Skipping paper without downloadable PDF: %s",
                    exc,
                )
                continue

            with tempfile.TemporaryDirectory() as temp_dir:
                filename = sanitize_filename(paper_key(paper))
                pdf_path = Path(temp_dir) / f"{filename}.pdf"

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

        except Exception as exc:
            logger.exception(
                "Failed to ingest paper title=%r url=%r: %s",
                paper.title,
                paper.url,
                exc,
            )

    return results
