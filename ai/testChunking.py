from app.rag.chunking import chunk_text, strip_references


def main() -> None:
    chunks = chunk_text("one two three four five six seven eight", chunk_size=3, overlap=1)
    assert chunks == ["one two three", "three four five", "five six seven", "seven eight"]

    body = "Methods\nWe evaluate models.\nReferences\n[1] Smith"
    assert "Smith" not in strip_references(body)
    assert "Methods" in strip_references(body)


if __name__ == "__main__":
    main()
