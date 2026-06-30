import logging

from fastapi import FastAPI
import uvicorn

from app.api.routes import router
from app.config.settings import LOG_LEVEL

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(title="ResearchOS AI API")
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
