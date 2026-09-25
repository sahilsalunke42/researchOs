import logging
from qdrant_client import QdrantClient
from app.config.settings import QDRANT_HOST, QDRANT_PORT

logger = logging.getLogger(__name__)

try:
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=2.0)
    client.get_collections()
    logger.info("Connected to Qdrant server at %s:%d", QDRANT_HOST, QDRANT_PORT)
except Exception as exc:
    logger.warning("Could not connect to Qdrant server (%s). Falling back to in-memory Qdrant.", exc)
    client = QdrantClient(location=":memory:")

