from app.rag.chunking import chunk_text


def main() -> None:
    chunks = chunk_text("one two three four five six seven eight", chunk_size=3, overlap=1)
    assert chunks == ["one two three", "three four five", "five six seven", "seven eight"]


if __name__ == "__main__":
    main()
