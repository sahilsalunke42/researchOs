# RESEARCHOS_AI_FLOW.md

# ResearchOS MVP - AI Workflow

> This document defines ONLY the AI pipeline for the MVP. It is the
> single source of truth for how the AI subsystem should behave.

------------------------------------------------------------------------

# High-Level AI Flow

``` text
User Enters Research Topic
            │
            ▼
Search Semantic Scholar + arXiv
            │
            ▼
Merge & Deduplicate Results
            │
            ▼
Return Relevant Papers
            │
            ▼
User Selects Papers
            │
            ▼
Download PDFs
            │
            ▼
Extract PDF Text
            │
            ▼
Clean & Normalize Text
            │
            ▼
Split Into Chunks
            │
            ▼
Generate Embeddings
            │
            ▼
Store Chunks + Metadata in Qdrant
            │
            ▼
Knowledge Base Ready
            │
            ▼
User Asks Question
            │
            ▼
Generate Query Embedding
            │
            ▼
Retrieve Top-K Relevant Chunks
            │
            ▼
Build Context
            │
            ▼
Qwen3 Generates Grounded Answer
            │
            ▼
Generate Paper Summaries
            │
            ▼
Generate Multi-Paper Comparison
            │
            ▼
Identify Research Gaps
            │
            ▼
Generate Literature Review
            │
            ▼
Generate Final Research Report
            │
            ▼
Export Markdown (PDF-ready architecture)
```

------------------------------------------------------------------------

# AI Responsibilities

## Phase 1: Paper Discovery

The AI must:

-   Search Semantic Scholar.
-   Search arXiv.
-   Merge results.
-   Remove duplicate papers.
-   Rank papers by relevance.
-   Return normalized metadata.

------------------------------------------------------------------------

## Phase 2: Knowledge Base Construction

For every selected paper:

1.  Download the PDF.
2.  Extract text.
3.  Clean the extracted text.
4.  Preserve useful sections/headings.
5.  Split into overlapping chunks.
6.  Generate embeddings.
7.  Store vectors and metadata in Qdrant.

The knowledge base should be reusable and avoid duplicate indexing.

------------------------------------------------------------------------

## Phase 3: Retrieval-Augmented Generation (RAG)

For every user question:

1.  Generate the query embedding.
2.  Search Qdrant.
3.  Retrieve the most relevant chunks.
4.  Construct a context prompt.
5.  Send the context to Qwen3.
6.  Generate an answer grounded only in retrieved evidence.

If the retrieved evidence is insufficient, explicitly say so.

------------------------------------------------------------------------

## Phase 4: Research Intelligence

Using the retrieved papers, generate:

-   Individual paper summaries.
-   Cross-paper comparison.
-   Common methodologies.
-   Common datasets.
-   Common evaluation metrics.
-   Strengths and limitations.
-   Emerging trends.

------------------------------------------------------------------------

## Phase 5: Research Gap Detection

Infer research gaps only from the indexed papers.

Examples:

-   Underexplored topics
-   Missing datasets
-   Weak evaluation strategies
-   Future research opportunities
-   Frequently mentioned limitations

Do not invent unsupported claims.

------------------------------------------------------------------------

## Phase 6: Literature Review

Generate a structured literature review containing:

-   Introduction
-   Existing Work
-   Comparative Analysis
-   Research Trends
-   Limitations
-   Research Gaps
-   Future Scope
-   References

------------------------------------------------------------------------

## Phase 7: Final Report

Generate a structured report including:

-   Executive Summary
-   Paper Summaries
-   Comparative Analysis
-   Research Gaps
-   Literature Review
-   References

Support Markdown output. Design the code so PDF export can be added
later.

------------------------------------------------------------------------

# MVP Rules

The AI must:

-   Always use RAG before answering.
-   Never bypass retrieval.
-   Never hallucinate.
-   Cite retrieved papers whenever possible.
-   Reuse the existing embedding model.
-   Reuse the existing Qdrant client.
-   Reuse the existing Ollama client.
-   Extend the existing architecture instead of rewriting it.

LangGraph is an orchestration layer and must be integrated only after
the complete AI workflow above is fully functional.
