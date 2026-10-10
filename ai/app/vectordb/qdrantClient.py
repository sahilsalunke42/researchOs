import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config.settings import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT

logger = logging.getLogger(__name__)

COLLECTION_NAME = QDRANT_COLLECTION

try:
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=2.0)
    client.get_collections()
    logger.info("Connected to Qdrant server at %s:%d", QDRANT_HOST, QDRANT_PORT)
except Exception as exc:
    logger.warning("Could not connect to Qdrant server (%s). Falling back to in-memory Qdrant.", exc)
    client = QdrantClient(location=":memory:")


def ensure_collection(
    collection_name: str = COLLECTION_NAME,
    vector_size: int = 384,
) -> None:
    try:
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
    except Exception as exc:
        logger.warning("ensure_collection encountered error: %s", exc)
