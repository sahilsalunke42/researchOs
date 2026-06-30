from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
QDRANT_HOST = os.getenv("QDRANT_HOST", "127.0.0.1")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "research_papers")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
