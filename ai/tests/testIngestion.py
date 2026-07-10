from app.services.ingestion_service import clean_extracted_text, sanitize_filename


def main() -> None:
    text = "Intro line\nReferences\n[1] Doe et al."
    assert "Doe" not in clean_extracted_text(text)
    assert "Intro line" in clean_extracted_text(text)

    assert sanitize_filename("paper/key?") == "paper_key_"
    assert sanitize_filename("   ") == "paper"


if __name__ == "__main__":
    main()
