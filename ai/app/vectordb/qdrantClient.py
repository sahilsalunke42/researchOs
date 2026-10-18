from __future__ import annotations

import logging
from qdrant_client import QdrantClient

from app.config.settings import QDRANT_API_KEY, QDRANT_HOST, QDRANT_PORT, QDRANT_URL

logger = logging.getLogger(__name__)


def init_qdrant_client() -> QdrantClient:
    """
    Initializes Qdrant client with prioritized failover:
    1. If QDRANT_URL is provided, connect to remote cluster using QDRANT_API_KEY.
    2. Try local QDRANT_HOST and QDRANT_PORT.
    3. If unavailable, fallback gracefully to in-memory Qdrant client (":memory:").
    """
    if QDRANT_URL:
        logger.info("Connecting to remote Qdrant cluster at %s", QDRANT_URL)
        try:
            c = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=10)
            c.get_collections()
            return c
        except Exception as exc:
            logger.warning("Failed to connect to remote Qdrant cluster at %s: %s", QDRANT_URL, exc)

    # Try local host/port
    try:
        c = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=2)
        c.get_collections()
        logger.info("Connected to local Qdrant at %s:%d", QDRANT_HOST, QDRANT_PORT)
        return c
    except Exception as exc:
        logger.warning(
            "Local Qdrant unavailable at %s:%d (%s). Falling back to in-memory Qdrant instance for development/testing.",
            QDRANT_HOST,
            QDRANT_PORT,
            exc,
        )
        return QdrantClient(":memory:")


client = init_qdrant_client()
