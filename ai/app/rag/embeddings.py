from __future__ import annotations

from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def generate_embeddings(text: str) -> list[float]:
    return model.encode(text).tolist()


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return model.encode(texts).tolist()
