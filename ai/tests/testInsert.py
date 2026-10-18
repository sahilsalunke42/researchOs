from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client
from qdrant_client.models import PointStruct

vector = generate_embeddings(
    "ResearchOs Ai research assistant"
)

from app.services.ingestion_service import ensure_collection

ensure_collection("research_papers", len(vector))
client.upsert(
    collection_name= "research_papers",
    points=[
        PointStruct(
            id=1,
            vector=vector,
            payload={
                "text": "ResearchOs is an AI research assistant"
            }
        )
    ]
)