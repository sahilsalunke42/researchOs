from app.vectordb.qdrantClient import client

from qdrant_client.models import (
    VectorParams,
    Distance
)

collections = [c.name for c in client.get_collections().collections]
if 'research_papers' not in collections:
    client.create_collection(
        collection_name = 'research_papers',
        vectors_config = VectorParams(
            size = 384,
            distance = Distance.COSINE
        )
    )

print(client.get_collections())
