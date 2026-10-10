from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
EMBEDDING_LOCAL_FILES_ONLY = os.getenv("EMBEDDING_LOCAL_FILES_ONLY", "true").strip().casefold() in {
    "1",
    "true",
    "yes",
}
QDRANT_HOST = os.getenv("QDRANT_HOST", "127.0.0.1")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "research_papers")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
SEMANTIC_SCHOLAR_TIMEOUT = int(os.getenv("SEMANTIC_SCHOLAR_TIMEOUT", "20"))
SEMANTIC_SCHOLAR_MAX_RETRIES = int(os.getenv("SEMANTIC_SCHOLAR_MAX_RETRIES", "3"))
SEMANTIC_SCHOLAR_BACKOFF_SECONDS = float(os.getenv("SEMANTIC_SCHOLAR_BACKOFF_SECONDS", "1.5"))
