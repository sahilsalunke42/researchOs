from app.services.rag_service import build_prompt as build_rag_prompt
from app.services.report_service import build_prompt as build_report_prompt


def main() -> None:
    rag = build_rag_prompt("What is RAG?", "Context text")
    assert "What is RAG?" in rag
    assert "Context text" in rag

    report = build_report_prompt("RAG", "Context text")
    assert "RAG" in report
    assert "Context text" in report


if __name__ == "__main__":
    main()
