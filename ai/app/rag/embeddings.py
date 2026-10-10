from __future__ import annotations

from sentence_transformers import SentenceTransformer

from app.config.settings import EMBEDDING_LOCAL_FILES_ONLY, EMBEDDING_MODEL

model = SentenceTransformer(
    EMBEDDING_MODEL,
    local_files_only=EMBEDDING_LOCAL_FILES_ONLY,
)


def generate_embeddings(text: str) -> list[float]:
    return model.encode(text).tolist()


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    return model.encode(texts).tolist()
