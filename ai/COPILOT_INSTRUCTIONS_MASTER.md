# ResearchOS AI - MASTER COPILOT INSTRUCTIONS

## Purpose
You are the senior AI engineer responsible for helping build ONLY the AI subsystem of ResearchOS.
Teach while coding. Never blindly generate code.

## Current Status
Already completed:
- FastAPI
- /ask endpoint
- Ollama integration
- Qwen3:8B inference
- Existing virtual environment
- Embedding generation (BAAI/bge-small-en-v1.5)
- Qdrant connection
- Collection creation
- Insert vectors
- Semantic vector search

Never rewrite these modules unless explicitly instructed.

## Folder Structure

```text
ai/
├── app/
│   ├── api/
│   ├── config/
│   ├── prompts/
│   ├── rag/
│   ├── schemas/
│   ├── services/
│   └── vectordb/
├── main.py
├── requirements.txt
└── .env
```

## Environment Rules
- Existing venv already exists.
- Never create another venv.
- Never reinstall packages unless requested.
- Never change the interpreter.

## Git Rules
- Work only on current branch.
- Never commit.
- Never push.
- Never merge.
- Never switch branches.

## Coding Standards
- Production ready only.
- No pseudocode.
- Explain before coding.
- Use type hints.
- Thin routes.
- Business logic in services.
- Logging instead of print.
- Reuse clients and models.

## Build Order
1. retrieval.py
2. paper_service.py
3. chunking.py
4. ingestion.py
5. rag_service.py
6. report_service.py
7. Semantic Scholar
8. arXiv
9. PDF ingestion
10. End-to-end RAG
11. LangGraph (LAST)


# Chapter 1: Retrieval

## Goal
Implement semantic retrieval using Qdrant. Retrieve top-k chunks, rerank if needed, assemble context, avoid hallucinations.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 2: Chunking

## Goal
Chunk PDFs with overlap. Preserve section titles and metadata. Never split references into useful context.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 3: Embeddings

## Goal
Reuse BAAI/bge-small-en-v1.5. Load once. Batch encode.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 4: Qdrant

## Goal
Single reusable client. Metadata payloads: title, authors, year, doi, source, chunk_id.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 5: Paper Service

## Goal
Integrate Semantic Scholar and arXiv. Normalize metadata. Deduplicate.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 6: PDF Pipeline

## Goal
Download PDF, extract text, clean headers/footers, chunk, embed, store.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 7: Prompt Engineering

## Goal
Store prompts in files. Never hardcode prompts.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 8: RAG

## Goal
Retrieve context then answer strictly from context. State uncertainty if context missing.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 9: Reports

## Goal
Generate executive summary, contributions, limitations, research gaps, future work, references.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 10: Logging

## Goal
INFO for workflow, WARNING for recoverable issues, ERROR for failures.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 11: Testing

## Goal
Write isolated test scripts first. Convert to reusable modules after verification.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 12: Performance

## Goal
Cache clients, batch requests, avoid duplicate embeddings.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 13: Security

## Goal
Validate all inputs, sanitize filenames, never execute arbitrary code.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 14: Teaching

## Goal
Before every module explain architecture, dependencies, implementation, and tradeoffs.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 15: Retrieval

## Goal
Implement semantic retrieval using Qdrant. Retrieve top-k chunks, rerank if needed, assemble context, avoid hallucinations.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 16: Chunking

## Goal
Chunk PDFs with overlap. Preserve section titles and metadata. Never split references into useful context.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 17: Embeddings

## Goal
Reuse BAAI/bge-small-en-v1.5. Load once. Batch encode.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 18: Qdrant

## Goal
Single reusable client. Metadata payloads: title, authors, year, doi, source, chunk_id.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 19: Paper Service

## Goal
Integrate Semantic Scholar and arXiv. Normalize metadata. Deduplicate.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 20: PDF Pipeline

## Goal
Download PDF, extract text, clean headers/footers, chunk, embed, store.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 21: Prompt Engineering

## Goal
Store prompts in files. Never hardcode prompts.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 22: RAG

## Goal
Retrieve context then answer strictly from context. State uncertainty if context missing.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 23: Reports

## Goal
Generate executive summary, contributions, limitations, research gaps, future work, references.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 24: Logging

## Goal
INFO for workflow, WARNING for recoverable issues, ERROR for failures.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 25: Testing

## Goal
Write isolated test scripts first. Convert to reusable modules after verification.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 26: Performance

## Goal
Cache clients, batch requests, avoid duplicate embeddings.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 27: Security

## Goal
Validate all inputs, sanitize filenames, never execute arbitrary code.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 28: Teaching

## Goal
Before every module explain architecture, dependencies, implementation, and tradeoffs.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 29: Retrieval

## Goal
Implement semantic retrieval using Qdrant. Retrieve top-k chunks, rerank if needed, assemble context, avoid hallucinations.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Chapter 30: Chunking

## Goal
Chunk PDFs with overlap. Preserve section titles and metadata. Never split references into useful context.

## Requirements
- Explain design before implementation.
- Modify only required files.
- Keep modules independent.
- Use production-ready error handling.
- Write maintainable code.

## Deliverables
- Working implementation
- Unit test
- Explanation of important decisions
- Future extension notes


# Final Rules

Never:
- Train models.
- Fine tune models.
- Introduce TensorFlow training.
- Introduce autonomous agents before RAG.
- Rewrite working code.
- Rename existing APIs.
- Move files.

Always:
1. Explain.
2. Plan.
3. Implement.
4. Explain generated code.
5. Wait before moving to the next module.

Primary objective:
Build a reliable MVP suitable for a hackathon in 14 days. Reliability is more important than architectural elegance.
