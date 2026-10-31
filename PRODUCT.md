# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Academic researchers, scientists, and graduate students conducting literature reviews, paper comparisons, and research gap identification.

## Product Purpose
ResearchOS guides researchers from an initial research question to a rigorous, traceable understanding of existing scientific literature. It automates literature discovery, paper ingestion and metadata extraction, semantic search, RAG-grounded question answering, cross-paper comparison matrices, candidate research gap generation via double-threshold keyword co-occurrence, Multi-paper gap validation, and structured literature-review reporting.

## Positioning
Strict distinction between indexed literature evidence and AI conjecture. Gap candidates are explicitly marked as candidate hypotheses rather than confirmed findings until validated against corpus evidence with verifiable citations and source tracebacks.

## Operating Context
Literature discovery, paper analysis, methodology and findings comparison, gap validation, and academic review drafting across scientific domains (e.g., arXiv, PubMed, open-access repositories).

## Capabilities and Constraints
- Capabilities: Paper search & discovery, PDF ingestion and metadata parsing, semantic vector retrieval (Qdrant), RAG question answering, double-threshold keyword co-occurrence gap detection, comparative matrix generation, structured Markdown report export.
- Constraints: Must not hallucinate citations, paper claims, or progress. Long-running asynchronous execution with truthful status updates. User data isolation.
- Stack: Next.js 14 (App Router) + Tailwind CSS + Radix UI frontend, Express backend, FastAPI AI service, PostgreSQL relational store, Qdrant vector database.

## Brand Commitments
- Name: ResearchOS
- Tone: Academic rigor, precision, restraint, transparency, and clarity.

## Evidence on Hand
- Architecture documents and system specifications in `Achitecture.md`, `Instructions.md`, and `IMPLEMENTATION_PLAN.md`.
- Working Next.js 14 client application in `client/` with existing UI components, Lucide icons, and Tailwind styling.

## Product Principles
1. Grounded Provenance: Every claim and gap candidate links back to specific paper evidence or is explicitly flagged as unverified AI conjecture.
2. Honest Execution: Never fake agent progress, percentages, or completion; communicate real backend state and provider limits.
3. Researcher-Centric Efficiency: Surface high-density information (methodologies, datasets, limitations, gap metrics) clearly without visual clutter.
4. Privacy & Integrity: Scoped user data, parameter-controlled queries, and reproducible scientific workflows.
