from app.rag.embeddings import generate_embeddings

vector = generate_embeddings("Hello, world!")

print(len(vector))
print(vector[:5])