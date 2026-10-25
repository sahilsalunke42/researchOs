from __future__ import annotations

from dataclasses import dataclass
import hashlib
import logging
from pathlib import Path
import re
import tempfile
from typing import Any, Callable, Iterable
from urllib.parse import urlparse
import uuid

from qdrant_client.models import Distance, PointStruct, VectorParams
import requests

from app.config.settings import QDRANT_COLLECTION
from app.rag.chunking import chunk_text, strip_references
from app.rag.embeddings import generate_embeddings_batch
from app.rag.ingestion import PDFPage, extract_pdf_pages, extract_pdf_text
from app.security.document_safety import validate_download_url
from app.services.paper_service import Paper, dedupe_papers
from app.vectordb.qdrantClient import client

logger = logging.getLogger(__name__)

DEFAULT_COLLECTION_NAME = QDRANT_COLLECTION
MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB max

PAPER_CONTENT_REGISTRY: dict[str, list[PDFPage]] = {}


def get_paper_pages(paper: Paper) -> list[PDFPage] | None:
    return PAPER_CONTENT_REGISTRY.get(paper_key(paper))



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


def _paper_from_pdf_url(paper: Paper, pdf_url: str | None) -> str:
    if pdf_url:
        return pdf_url
    if getattr(paper, "pdf_url", None):
        return paper.pdf_url
    if paper.url and paper.url.lower().endswith(".pdf"):
        return paper.url
    if paper.source == "arxiv":
        parsed = urlparse(paper.url or "")
        path = parsed.path.strip("/")
        arxiv_id: str | None = None
        if path.startswith("abs/"):
            arxiv_id = path[len("abs/") :]
        elif path.startswith("pdf/"):
            arxiv_id = path[len("pdf/") :]
        if arxiv_id:
            normalized_id = arxiv_id.removesuffix(".pdf")
            return f"https://arxiv.org/pdf/{normalized_id}.pdf"
    raise ValueError(f"no downloadable PDF URL for paper: {paper.title}")


def download_pdf(url: str, destination: Path, timeout: int = 30) -> Path:
    # SSRF guard: validates scheme, hostname, DNS resolution and blocks private/loopback CIDRs
    safe_url = validate_download_url(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ResearchOS/1.0",
        "Accept": "application/pdf,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    }
    response = requests.get(safe_url, headers=headers, stream=True, timeout=timeout)
    response.raise_for_status()

    content_length = response.headers.get("Content-Length")
    if content_length and int(content_length) > MAX_PDF_SIZE_BYTES:
        raise ValueError(f"PDF exceeds maximum allowed size ({MAX_PDF_SIZE_BYTES} bytes)")

    destination.parent.mkdir(parents=True, exist_ok=True)
    downloaded_size = 0
    with destination.open("wb") as handle:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                downloaded_size += len(chunk)
                if downloaded_size > MAX_PDF_SIZE_BYTES:
                    raise ValueError(f"PDF exceeded maximum allowed size during download ({MAX_PDF_SIZE_BYTES} bytes)")
                handle.write(chunk)
    return destination


def ensure_collection(collection_name: str, vector_size: int) -> None:
    collections = client.get_collections().collections
    if not any(collection.name == collection_name for collection in collections):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        try:
            client.create_payload_index(
                collection_name=collection_name,
                field_name="project_id",
                field_schema="keyword",
            )
            client.create_payload_index(
                collection_name=collection_name,
                field_name="user_id",
                field_schema="keyword",
            )
        except Exception:
            pass


def build_point_id(paper: Paper, chunk_index: int, chunk_text_value: str) -> str:
    key = paper_key(paper)
    digest = hashlib.sha1(f"{key}:{chunk_index}:{chunk_text_value}".encode("utf-8")).hexdigest()
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, digest))


def build_payload(
    paper: Paper,
    *,
    source_url: str,
    chunk_index: int,
    total_chunks: int,
    chunk_text_value: str,
    project_id: str | None = None,
    user_id: str | None = None,
    page_number: int | None = None,
    section: str | None = None,
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
        "project_id": project_id,
        "user_id": user_id,
        "page_number": page_number,
        "section": section,
    }


def prepare_points(
    paper: Paper,
    text: str,
    *,
    source_url: str,
    chunk_size: int = 800,
    overlap: int = 120,
    project_id: str | None = None,
    user_id: str | None = None,
    pages: list[PDFPage] | None = None,
) -> list[PointStruct]:
    chunks_with_meta: list[tuple[str, int | None, str | None]] = []
    if pages:
        for page in pages:
            cleaned = clean_extracted_text(page.text)
            page_chunks = chunk_text(cleaned, chunk_size=chunk_size, overlap=overlap)
            for c in page_chunks:
                chunks_with_meta.append((c, page.page_number, "Full-text PDF"))
    else:
        cleaned_text = clean_extracted_text(text)
        chunks = chunk_text(cleaned_text, chunk_size=chunk_size, overlap=overlap)
        chunks_with_meta = [(c, None, "Abstract") for c in chunks]

    if not chunks_with_meta:
        return []

    total_chunks = len(chunks_with_meta)
    vectors = generate_embeddings_batch([item[0] for item in chunks_with_meta])
    points: list[PointStruct] = []
    for index, ((chunk, page_num, sec), vector) in enumerate(zip(chunks_with_meta, vectors, strict=True), start=1):
        payload = build_payload(
            paper,
            source_url=source_url,
            chunk_index=index,
            total_chunks=total_chunks,
            chunk_text_value=chunk,
            project_id=project_id,
            user_id=user_id,
            page_number=page_num,
            section=sec,
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
    project_id: str | None = None,
    user_id: str | None = None,
) -> IngestionResult:
    path = Path(pdf_path)
    pages = extract_pdf_pages(path)
    PAPER_CONTENT_REGISTRY[paper_key(paper)] = pages
    text = extract_pdf_text(path)
    resolved_source_url = source_url or str(path)
    points = prepare_points(
        paper,
        text,
        source_url=resolved_source_url,
        chunk_size=chunk_size,
        overlap=overlap,
        project_id=project_id,
        user_id=user_id,
        pages=pages,
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
    project_id: str | None = None,
    user_id: str | None = None,
) -> list[IngestionResult]:
    results: list[IngestionResult] = []
    for paper in dedupe_papers(list(papers)):
        pdf_url = pdf_url_resolver(paper) if pdf_url_resolver else None
        try:
            source_url = _paper_from_pdf_url(paper, pdf_url)
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
                        project_id=project_id,
                        user_id=user_id,
                    )
                )
        except Exception:
            logger.info("PDF download failed for '%s'; indexing abstract and metadata directly into vector store", paper.title)
            try:
                text = f"{paper.title}\n\nAbstract:\n{paper.abstract or ''}".strip()
                if text:
                    points = prepare_points(
                        paper,
                        text,
                        source_url=paper.url or f"doi:{paper.doi or ''}",
                        chunk_size=chunk_size,
                        overlap=overlap,
                        project_id=project_id,
                        user_id=user_id,
                    )
                    if points:
                        ensure_collection(collection_name, len(points[0].vector))
                        client.upsert(collection_name=collection_name, points=points)
                        results.append(
                            IngestionResult(
                                paper_key=paper_key(paper),
                                chunk_count=len(points),
                                point_ids=tuple(str(p.id) for p in points),
                                source_url=paper.url or "",
                            )
                        )
            except Exception:
                logger.exception("Failed to index abstract for paper: %s", paper.title)
    return results
