from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def extract_pdf_pages(pdf_path: str | Path) -> list[str]:
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(path)
    if path.suffix.lower() != ".pdf":
        raise ValueError("pdf_path must point to a PDF file")

    reader = PdfReader(str(path))
    return [(page.extract_text() or "").strip() for page in reader.pages]


def extract_pdf_text(pdf_path: str | Path) -> str:
    return "\n".join(extract_pdf_pages(pdf_path)).strip()
