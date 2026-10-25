from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


@dataclass(frozen=True)
class PDFPage:
    page_number: int  # 1-indexed
    text: str


def extract_pdf_pages(pdf_path: str | Path) -> list[PDFPage]:
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(path)
    if path.suffix.lower() != ".pdf":
        raise ValueError("pdf_path must point to a PDF file")

    reader = PdfReader(str(path))
    pages: list[PDFPage] = []
    for idx, page in enumerate(reader.pages, start=1):
        txt = (page.extract_text() or "").strip()
        pages.append(PDFPage(page_number=idx, text=txt))
    return pages


def extract_pdf_text(pdf_path: str | Path) -> str:
    pages = extract_pdf_pages(pdf_path)
    return "\n\n".join(p.text for p in pages if p.text).strip()
