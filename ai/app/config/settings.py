from pathlib import Path
from dotenv import load_dotenv
import os

_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.groq.com/openai/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen/qwen3.8-27b")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "127.0.0.1")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "research_papers")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
SEMANTIC_SCHOLAR_TIMEOUT = int(os.getenv("SEMANTIC_SCHOLAR_TIMEOUT", "20"))
SEMANTIC_SCHOLAR_MAX_RETRIES = int(os.getenv("SEMANTIC_SCHOLAR_MAX_RETRIES", "3"))
SEMANTIC_SCHOLAR_BACKOFF_SECONDS = float(os.getenv("SEMANTIC_SCHOLAR_BACKOFF_SECONDS", "1.5"))
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "ros-internal-service-token-dev")
