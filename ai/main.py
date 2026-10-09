import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
import uvicorn

from app.api.routes import router
from app.config.settings import LOG_LEVEL

from app.vectordb.qdrantClient import ensure_collection

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        ensure_collection()
    except Exception as exc:
        # Keep the API health endpoint available when Qdrant is starting up or
        # temporarily unavailable. Ingestion/retrieval will surface the actual
        # dependency error to the caller.
        logger.warning("Qdrant collection initialization failed: %s", exc)
    yield


app = FastAPI(title="ResearchOS AI API", lifespan=lifespan)
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
