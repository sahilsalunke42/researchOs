from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def generate_embeddings(text: str):
    return model.encode(text).tolist()