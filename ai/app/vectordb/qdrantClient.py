from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.config.settings import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT

COLLECTION_NAME = QDRANT_COLLECTION

client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT
)


def ensure_collection(
    collection_name: str = COLLECTION_NAME,
    vector_size: int = 384,
) -> None:
    collections = client.get_collections().collections

    if any(collection.name == collection_name for collection in collections):
        collection = client.get_collection(collection_name)
        vectors = collection.config.params.vectors
        actual_size = getattr(vectors, "size", None)

        if actual_size != vector_size:
            raise RuntimeError(
                f"Qdrant collection {collection_name!r} uses vectors of size "
                f"{actual_size}, but the embedding model produces {vector_size}. "
                "Use a collection with the matching dimension or recreate this collection."
            )
        return

    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=vector_size,
            distance=Distance.COSINE
        )
    )
