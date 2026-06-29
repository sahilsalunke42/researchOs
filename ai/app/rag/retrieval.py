from app.rag.embeddings import generate_embeddings
from app.vectordb.qdrantClient import client

def retrieveContext(query: str, limit: int =5):
    query_vector = generate_embeddings(query)

    results = client.query_points(
        collection_name = "research_papers",
        query= query_vector,
        limit = limit
    )

    context =[]

    for point in results.points:
        context.append(point.payload["text"])

    return context