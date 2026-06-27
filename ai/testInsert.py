from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client
from qdrant_client.models import PointStruct

vector = generate_embeddings(
    "ResearchOs Ai research assistant"
)

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