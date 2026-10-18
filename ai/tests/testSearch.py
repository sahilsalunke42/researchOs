from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client

search_vector = generate_embeddings(
    "AI research platform"
)

from app.services.ingestion_service import ensure_collection

ensure_collection("research_papers", len(search_vector))
results = client.query_points(
    collection_name="research_papers",
    query=search_vector,
    limit=3
)

print(results)