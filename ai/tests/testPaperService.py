from app.services.paper_service import Paper, dedupe_papers, normalize_paper


def main() -> None:
    paper = normalize_paper(
        {
            "title": "  A Study on RAG  ",
            "authors": [{"name": "Ada Lovelace"}],
            "year": "2024",
            "doi": "10.1000/example",
            "url": "https://example.com",
            "abstract": "  Useful abstract  ",
            "external_id": "paper-1",
        },
        source="semantic_scholar",
    )
    assert paper.title == "A Study on RAG"
    assert paper.authors == ("Ada Lovelace",)
    assert paper.year == 2024

    unique = dedupe_papers(
        [
            paper,
            Paper(
                title="A Study on RAG",
                authors=("Ada Lovelace",),
                year=2024,
                doi="10.1000/example",
                source="arxiv",
            ),
        ]
    )
    assert len(unique) == 1


if __name__ == "__main__":
    main()
