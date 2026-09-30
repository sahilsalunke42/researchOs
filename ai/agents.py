"""
ResearchOS
"""

# 0. IMPORTS

import os
import uuid
import time
from dataclasses import dataclass

import arxiv
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from transformers import pipeline


# 1. CONFIG —  keys 

os.environ["GROQ_API_KEY"] = "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"


os.environ["QDRANT_URL"] = "https://fb088512-ea6f-4ac6-87cb-404c025cf9e0.eu-central-1-0.aws.cloud.qdrant.io"
os.environ["QDRANT_API_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Mzg3YTAzY2UtMjFlNy00Y2Q0LTkyMTItMTllMTVjYjlkZGM0In0.26a9EIsA6jfHM3olJ12wQbKpLw8N-vIf5GwDLnB_uk8"

QDRANT_URL = os.environ["QDRANT_URL"]
QDRANT_API_KEY = os.environ["QDRANT_API_KEY"] or None
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

COLLECTION_PAPERS = "papers"
COLLECTION_MEMORY = "query_memory"

EMBED_MODEL_NAME = "all-MiniLM-L6-v2"   
EMBED_DIM = 384


LLM_MODEL_NAME = "openai/gpt-oss-120b"

SENTIMENT_MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50



# 2. PAPER FETCHER — pulls papers from arXiv, splits into chunks

@dataclass
class PaperChunk:
    paper_id: str
    title: str
    authors: list
    published: str
    chunk_id: int
    text: str


def fetch_papers(query: str, max_results: int = 10) -> list:
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
    )
    papers = []
    for result in client.results(search):
        papers.append({
            "id": result.entry_id,
            "title": result.title,
            "authors": [a.name for a in result.authors],
            "published": str(result.published.date()),
            "abstract": result.summary.replace("\n", " "),
        })
    return papers


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def build_paper_chunks(papers: list) -> list:
    all_chunks = []
    for paper in papers:
        for i, chunk in enumerate(chunk_text(paper["abstract"])):
            all_chunks.append(PaperChunk(
                paper_id=paper["id"], title=paper["title"], authors=paper["authors"],
                published=paper["published"], chunk_id=i, text=chunk,
            ))
    return all_chunks


# 3. RETRIEVAL AGENT — embeds chunks, indexes + searches in Qdrant

class RetrievalAgent:
    def __init__(self):
        self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        self.embedder = SentenceTransformer(EMBED_MODEL_NAME)
        self._ensure_collection()

    def _ensure_collection(self):
        existing = [c.name for c in self.client.get_collections().collections]
        if COLLECTION_PAPERS not in existing:
            self.client.create_collection(
                collection_name=COLLECTION_PAPERS,
                vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
            )

    def index_chunks(self, chunks: list):
        texts = [c.text for c in chunks]
        vectors = self.embedder.encode(texts, show_progress_bar=True)
        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector.tolist(),
                payload={
                    "paper_id": c.paper_id, "title": c.title, "authors": c.authors,
                    "published": c.published, "chunk_id": c.chunk_id, "text": c.text,
                },
            )
            for vector, c in zip(vectors, chunks)
        ]
        self.client.upsert(collection_name=COLLECTION_PAPERS, points=points)
        print(f"Indexed {len(points)} chunks into '{COLLECTION_PAPERS}'")

    def search(self, query: str, top_k: int = 6) -> list:
        query_vector = self.embedder.encode(query).tolist()
        results = self.client.query_points(
            collection_name=COLLECTION_PAPERS, query=query_vector, limit=top_k,
        ).points
        return [
            {"score": r.score, "title": r.payload["title"], "authors": r.payload["authors"],
             "text": r.payload["text"], "paper_id": r.payload["paper_id"]}
            for r in results
        ]



# 4. MEMORY MODULE — remembers past queries + their retrieved results

class SessionMemory:
    def __init__(self, qdrant_client, embedder):
        self.client = qdrant_client
        self.embedder = embedder
        self._ensure_collection()

    def _ensure_collection(self):
        existing = [c.name for c in self.client.get_collections().collections]
        if COLLECTION_MEMORY not in existing:
            self.client.create_collection(
                collection_name=COLLECTION_MEMORY,
                vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
            )

    def remember(self, query: str, retrieved_chunks: list):
        vector = self.embedder.encode(query).tolist()
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "query": query, "timestamp": time.time(),
                "paper_titles": list({c["title"] for c in retrieved_chunks}),
                "chunks": retrieved_chunks,
            },
        )
        self.client.upsert(collection_name=COLLECTION_MEMORY, points=[point])

    def recall_similar(self, query: str, top_k: int = 3) -> list:
        vector = self.embedder.encode(query).tolist()
        results = self.client.query_points(
            collection_name=COLLECTION_MEMORY, query=vector, limit=top_k,
        ).points
        return [r.payload for r in results]



# 5. SENTIMENT AGENT — labels each retrieved chunk's stance

class SentimentAgent:
    def __init__(self):
        self.classifier = pipeline("sentiment-analysis", model=SENTIMENT_MODEL_NAME)

    def analyze_chunk(self, chunk_text: str) -> dict:
        result = self.classifier(chunk_text[:512])[0]
        return {"label": result["label"], "confidence": round(result["score"], 3)}

    def analyze_chunks(self, chunks: list) -> list:
        return [{**c, "sentiment": self.analyze_chunk(c["text"])} for c in chunks]



# 6. CROSS-VALIDATION AGENT — LLM finds agreements/conflicts/gaps

CROSS_VALIDATION_PROMPT = """You are a research analyst cross-validating findings across multiple papers.

Below are excerpts from different papers, each with a sentiment label indicating
whether the excerpt reports a positive or negative/critical result.

{excerpts}

Based ONLY on the excerpts above, produce:
1. AGREEMENTS — findings that multiple papers support (cite paper titles).
2. CONFLICTS — findings where papers disagree (cite paper titles on each side).
3. GAPS — specific questions relevant to the topic that none of these excerpts answer.

Be concise and stay strictly evidence-grounded — do not invent findings not present above.
"""


class CrossValidationAgent:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)

    def _format_excerpts(self, labeled_chunks: list) -> str:
        lines = []
        for c in labeled_chunks:
            sentiment = c.get("sentiment", {})
            lines.append(f"- [{c['title']}] (sentiment: {sentiment.get('label', 'N/A')}): {c['text']}")
        return "\n".join(lines)

    def cross_validate(self, labeled_chunks: list) -> str:
        excerpts = self._format_excerpts(labeled_chunks)
        prompt = CROSS_VALIDATION_PROMPT.format(excerpts=excerpts)
        response = self.client.chat.completions.create(
            model=LLM_MODEL_NAME, max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content



# 7. LITERATURE REVIEW AGENT — writes a structured review + explicit gaps



LITERATURE_REVIEW_PROMPT = """You are a research assistant writing a literature review section
for an academic paper on the topic: "{topic}"

The reader wants to understand: {user_query}

Below are excerpts retrieved from several papers, each with a sentiment label
(POSITIVE = reports a favorable/successful result, NEGATIVE = reports a
limitation, critique, or unfavorable result):

{excerpts}

Using ONLY the excerpts above, write a literature review with these sections:

## Introduction
2-3 sentences framing why this topic matters, based on what the excerpts show.

## Thematic Synthesis
Group the papers into 2-4 themes/approaches (do not just list papers one by one).
For each theme, summarize what the papers say, note points of agreement, and
flag any disagreements. Cite paper titles in [brackets].

## Research Gaps
A clearly numbered list of specific, concrete gaps — questions or problems
that the excerpts above do NOT address, but which a researcher extending this
work should investigate. Each gap should be 1-2 sentences and justified by
what IS and ISN'T covered in the excerpts (e.g. "None of the retrieved papers
evaluate X, despite Y being a stated challenge in [Paper Title]").

## References
A numbered list of the distinct paper titles used above.

Stay strictly evidence-grounded — do not invent findings, statistics, or
papers not present in the excerpts. If evidence is thin on a theme, say so
explicitly rather than padding the section.
"""


class LiteratureReviewAgent:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)

    def _format_excerpts(self, labeled_chunks: list) -> str:
        lines = []
        for c in labeled_chunks:
            sentiment = c.get("sentiment", {})
            lines.append(f"- [{c['title']}] (sentiment: {sentiment.get('label', 'N/A')}): {c['text']}")
        return "\n".join(lines)

    def generate_review(self, topic: str, user_query: str, labeled_chunks: list) -> str:
        excerpts = self._format_excerpts(labeled_chunks)
        prompt = LITERATURE_REVIEW_PROMPT.format(
            topic=topic, user_query=user_query, excerpts=excerpts,
        )
        response = self.client.chat.completions.create(
            model=LLM_MODEL_NAME, max_tokens=1800,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content



def run_pipeline(topic: str, user_query: str):
    print(f"\n=== STEP 1: Fetching papers on '{topic}' ===")
    papers = fetch_papers(topic, max_results=10)
    chunks = build_paper_chunks(papers)
    print(f"Fetched {len(papers)} papers -> {len(chunks)} chunks")

    print("\n=== STEP 2: Indexing + retrieving relevant chunks ===")
    retrieval_agent = RetrievalAgent()
    retrieval_agent.index_chunks(chunks)
    retrieved = retrieval_agent.search(user_query, top_k=8)
    for r in retrieved:
        print(f"  [{r['score']:.3f}] {r['title']}")

    print("\n=== STEP 3: Saving to memory ===")
    memory = SessionMemory(retrieval_agent.client, retrieval_agent.embedder)
    memory.remember(user_query, retrieved)

    print("\n=== STEP 4: Sentiment-tagging retrieved chunks ===")
    sentiment_agent = SentimentAgent()
    labeled = sentiment_agent.analyze_chunks(retrieved)
    for c in labeled:
        print(f"  {c['sentiment']['label']} ({c['sentiment']['confidence']}) — {c['title']}")

    print("\n=== STEP 5: Cross-validating findings ===")
    cross_agent = CrossValidationAgent()
    cross_report = cross_agent.cross_validate(labeled)
    print("\n--- CROSS-VALIDATION REPORT ---\n")
    print(cross_report)

    print("\n=== STEP 6: Generating literature review + gap identification ===")
    review_agent = LiteratureReviewAgent()
    review = review_agent.generate_review(topic, user_query, labeled)
    print("\n--- LITERATURE REVIEW ---\n")
    print(review)

    return {"cross_validation": cross_report, "literature_review": review}



if __name__ == "__main__":
    topic = input("Enter a research topic (e.g. 'vehicle automation'): ")
    user_query = input("What do you want to know about it?: ")
    run_pipeline(topic=topic, user_query=user_query)


