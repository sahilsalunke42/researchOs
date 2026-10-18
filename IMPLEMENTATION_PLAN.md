# ResearchOS Comprehensive Implementation Plan & Architecture Audit

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-18  
**Status:** Audit Complete — Pending Lead Review

---

## Executive Summary

ResearchOS is designed as an end-to-end AI research-intelligence platform that guides researchers from a topic or research question to a traceable, evidence-grounded literature review and candidate research gap analysis.

The repository currently contains the scaffolding of a full-stack system comprising:
1. A **Next.js 14** frontend (App Router, Tailwind CSS, Radix UI, Zustand, Vitest).
2. An **Express.js** application backend (TypeScript, Prisma ORM, Neon PostgreSQL, JWT cookie auth, Vitest).
3. A **Python / FastAPI** AI service (SentenceTransformers, PyPDF, arXiv / Semantic Scholar clients, Qdrant client, LangGraph scaffolding).

### Key Audit Finding
While the core components exist on disk, **the end-to-end pipeline is currently completely disconnected**:
- When a user creates a project in the UI, the Express server inserts a record into PostgreSQL with status `QUEUED`, but **never triggers the AI service**.
- The frontend project workspace (`/projects/[id]`) contains only static placeholder text (*"The research pipeline will run here once Phase 2 is wired up"*).
- The LangGraph implementation in the AI service is a minimal 3-node linear sequence lacking double-threshold candidate generation, cross-paper evidence validation, citation verification, and progress streaming.
- Critical security vulnerabilities exist, including **unfiltered SSRF** in PDF downloads, **zero tenant isolation** in Qdrant vector retrieval, exposed credentials, and missing AI service authentication.
- Baseline build and type checks fail in both `server` (Prisma enum/DTO type mismatches) and `client` (Vite type conflict in `vitest.config.ts`), and unit/integration tests fail due to missing local database configurations.

This implementation plan details the findings, establishes the test baseline, ranks security/privacy risks, and maps out a rigorous, prioritized roadmap to bring ResearchOS to a functional, secure, and production-ready state for final-year engineering project demonstration.

---

## 1. Current Architecture & Repository Structure

### 1.1 Repository Structure

```text
researchOs/
├── Instructions.md                     # Master project instructions & specification
├── package.json                        # Root workspace manifest (pnpm 9.7.0)
├── pnpm-lock.yaml                      # Workspace lockfile
├── pnpm-workspace.yaml                 # Configured packages: server, client
├── .gitignore                          # Root ignore rules
├── client/                             # Next.js 14 Frontend Application
│   ├── app/
│   │   ├── (app)/                      # Authenticated route group
│   │   │   ├── dashboard/page.tsx      # Project list & creation entry point
│   │   │   ├── projects/page.tsx       # Projects listing
│   │   │   ├── projects/[id]/page.tsx  # Project workspace (currently placeholder)
│   │   │   ├── library/page.tsx        # Stub ("Phase 3")
│   │   │   ├── reports/page.tsx        # Stub ("Phase 2")
│   │   │   ├── settings/page.tsx       # Stub ("Coming later")
│   │   │   └── layout.tsx              # Session gatekeeper & shell wrapper
│   │   ├── (auth)/                     # Unauthenticated route group
│   │   │   ├── login/page.tsx          # Login form
│   │   │   ├── register/page.tsx       # Registration form
│   │   │   └── layout.tsx
│   │   ├── globals.css                 # Theme variables & Tailwind styles
│   │   ├── layout.tsx                  # Root HTML layout
│   │   └── page.tsx                    # Root redirect to /dashboard
│   ├── components/
│   │   ├── dashboard/ProjectCard.tsx   # Project summary card
│   │   ├── layout/Header.tsx, Sidebar.tsx, Shell.tsx, ShellClient.tsx
│   │   ├── ui/                         # Radix UI primitives (button, dialog, input, etc.)
│   │   └── workspace/
│   │       ├── NewProjectModal.tsx     # Project creation modal dialog
│   │       └── WorkspaceTabs.tsx       # Placeholder tab container
│   ├── hooks/
│   │   ├── usePlatform.ts              # OS detection helper
│   │   └── useResearchJob.ts           # Hardcoded stub returning { status: 'QUEUED' }
│   ├── lib/
│   │   ├── api.ts                      # Fetch wrapper with typed errors
│   │   ├── auth.ts                     # Auth API client (login, register, logout, getSession)
│   │   └── utils.ts                    # Tailwind class merger
│   ├── store/
│   │   ├── papers.store.ts             # Unused Zustand store for paper items
│   │   ├── research.store.ts           # Zustand store for project/agent state
│   │   └── ui.store.ts                 # UI state (sidebar collapsed)
│   ├── types/api.types.ts              # Frontend API DTO interfaces
│   ├── vitest.config.ts                # Frontend Vitest test runner configuration
│   └── package.json                    # Dependencies: Next 14.2.5, React 18.3.1, Radix, Tailwind
│
├── server/                             # Express.js Application Server
│   ├── prisma/
│   │   └── schema.prisma               # Models: User, Project, Paper, Report, AgentRun
│   ├── src/
│   │   ├── config/constants.ts, env.ts # App constants & Zod env validation
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts      # Register, login, logout, me handlers
│   │   │   └── projects.controller.ts  # CRUD handlers for projects
│   │   ├── db/prisma.ts                # PrismaClient singleton
│   │   ├── errors/httpErrors.ts        # Standard HTTP error classes
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts      # JWT cookie validation middleware
│   │   │   ├── error.middleware.ts     # Centralized error handler
│   │   │   ├── rateLimit.middleware.ts # Express-rate-limit config
│   │   │   └── validate.middleware.ts  # Zod request validator
│   │   ├── routes/
│   │   │   ├── auth.routes.ts          # /api/auth routes
│   │   │   └── projects.routes.ts      # /api/projects routes
│   │   ├── services/
│   │   │   ├── auth.service.ts         # Password hashing & JWT issuance
│   │   │   └── projects.service.ts     # Project persistence operations
│   │   ├── types/api.types.ts          # Server DTO contracts
│   │   ├── utils/logger.ts, requestId.ts
│   │   ├── app.ts                      # Express app assembly & middleware wiring
│   │   └── server.ts                   # HTTP listener on PORT 4000
│   ├── tests/                          # Unit & integration tests
│   └── package.json                    # Express 4.19, Prisma 5.18, bcrypt, JWT, Winston
│
└── ai/                                 # Python FastAPI AI Intelligence Service
    ├── app/
    │   ├── api/routes.py               # Endpoints: /health, /ask, /report, /papers/search,
    │   │                               #            /ingest, /ingest/selected, /research
    │   ├── config/settings.py          # Environment settings (Ollama, Qdrant, Semantic Scholar)
    │   ├── prompts/
    │   │   ├── rag_prompt.txt          # Evidence-grounded Q&A prompt template
    │   │   └── report_prompt.txt       # Literature review report prompt template
    │   ├── rag/
    │   │   ├── chunking.py             # Sliding-window token/word chunking & reference stripper
    │   │   ├── embeddings.py           # SentenceTransformers ('all-MiniLM-L6-v2') wrapper
    │   │   ├── ingestion.py            # PyPDF text extractor
    │   │   └── retrieval.py            # Qdrant similarity search & context assembler
    │   ├── schemas/                    # Pydantic models (papers, ingest, research, report, etc.)
    │   ├── services/
    │   │   ├── ingestion_service.py    # PDF download, cleaning, point preparation, Qdrant upsert
    │   │   ├── llmService.py           # Ollama client call wrapper (qwen3:8b)
    │   │   ├── paper_service.py        # Semantic Scholar & arXiv fetch, dedupe, cosine ranking
    │   │   ├── rag_service.py          # Context retrieval & grounded prompt formatting
    │   │   ├── report_service.py       # Context retrieval & report generation
    │   │   └── research_service.py     # Minimal 3-node LangGraph workflow execution
    │   └── vectordb/qdrantClient.py    # Qdrant client singleton (host/port)
    ├── tests/                          # 9 standalone Python test scripts (assert-based)
    ├── requirements.txt                # FastAPI, LangGraph, Qdrant, SentenceTransformers, etc.
    ├── main.py                         # FastAPI app entry point (port 8000)
    └── RESEARCHOS_AI_FLOW.md           # AI workflow specification
```

### 1.2 Actual Data Flow vs. Target Data Flow

```mermaid
flowchart TD
    subgraph Current_Broken_Flow [Current Disconnected Flow]
        UI1[Next.js Frontend] -->|POST /api/projects| S1[Express Backend]
        S1 -->|Create project QUEUED| DB1[(PostgreSQL / Neon)]
        S1 -.->|NEVER CALLED| AI1[FastAPI AI Service]
        UI1 -->|GET /projects/:id| S1
        S1 -->|Return QUEUED project| UI1
        UI1 -->|Displays static placeholder text| DEAD[Flow Terminates - No Progress]
    end

    subgraph Target_End_to_End_Flow [Target Functional Flow]
        UI2[Next.js Workbench] -->|1. POST /api/projects| S2[Express Server]
        S2 -->|2. Create Project & AgentRuns| DB2[(PostgreSQL)]
        S2 -->|3. Async Dispatch with User/Project Scope| AI2[FastAPI AI Service]
        UI2 -->|4. Connect SSE Stream| S2
        S2 -.->|Stream stage updates| UI2

        subgraph AI_LangGraph [LangGraph Pipeline]
            N1[Validate Request] --> N2[Plan Scope]
            N2 --> N3[Discover Papers<br/>Semantic Scholar + arXiv]
            N3 --> N4[Ingest & Chunk PDFs<br/>Page & Section Boundaries]
            N4 --> N5[Generate Embeddings & Scoped Qdrant Upsert]
            N5 --> N6[Analyze Papers: Method, Dataset, Findings]
            N6 --> N7[Double-Threshold Gap Candidates<br/>Curiac et al. 2022 M(i,j)]
            N7 --> N8[Cross-Paper Evidence Validation<br/>Classify: Supported/Contradicted/Inconclusive]
            N8 --> N9[Verify Citations & Grounding]
            N9 --> N10[Synthesize Structured Report & BibTeX]
        end

        AI2 --> AI_LangGraph
        N5 <--> VDB[(Qdrant Vector DB<br/>Filtered by project_id)]
        AI_LangGraph -->|5. Persist Results & Sync Status| S2
        S2 -->|Update Papers, Reports, AgentRuns| DB2
        S2 -->|6. SSE Completion Event| UI2
        UI2 -->|7. Render Real Results: Table, Gaps, Report, Interactive Citations| User[User View]
    end
```

---

## 2. Feature Implementation Status Matrix

| Feature Area | Component / Sub-Feature | Status | Evidence / Analysis |
| :--- | :--- | :--- | :--- |
| **Authentication** | User Registration (`/api/auth/register`) | **Implemented** | Password hashed with bcrypt (cost 12), user created, JWT cookie issued. |
| | User Login (`/api/auth/login`) | **Implemented** | Validates email/password, sets HTTP-only `researchos_token` cookie. |
| | Session Verification (`/api/auth/me`) | **Implemented** | Decodes JWT, fetches user DTO (omits passwordHash). |
| | Logout (`/api/auth/logout`) | **Implemented** | Clears session cookie. |
| | CSRF Protection | **Missing** | Cookie is `SameSite: strict`, but no anti-CSRF token or custom header check exists. |
| **Project Management** | Create Project (`POST /api/projects`) | **Partial** | Inserts `QUEUED` record, but does not trigger background research or AI service. |
| | List Projects (`GET /api/projects`) | **Implemented** | Scoped to authenticated `userId`, sorted by `updatedAt DESC`. |
| | Get Project (`GET /api/projects/:id`) | **Implemented** | Scoped to authenticated user, returns 404 for unauthorized IDs. |
| | Delete Project (`DELETE /api/projects/:id`) | **Implemented** | Cascade deletes project records owned by caller. |
| | Workspace / Collaboration | **Missing** | Only single-user ownership exists; no workspace sharing or role-based access. |
| **Research Execution** | Run Trigger / Background Dispatch | **Broken** | Express never contacts `AI_SERVICE_URL`. No background runner or worker queue. |
| | Execution Progress Streaming (SSE) | **Missing** | No SSE endpoints in Express (`GET /api/projects/:id/stream`) or live updates. |
| | Progress State Management (Client) | **Broken** | `useResearchJob` returns hardcoded `{ status: 'QUEUED', agentStages: [] }`. |
| | Run Cancellation / Timeout | **Missing** | No mechanism to cancel an in-flight run or enforce per-stage execution timeouts. |
| **Paper Discovery** | Semantic Scholar Client | **Implemented** | Queries paper search, supports pagination, retries with exponential backoff. |
| | arXiv API Client | **Implemented** | Queries `arxiv.Search`, parses author, year, DOI, abstract, and URL. |
| | Metadata Normalization & Deduplication | **Implemented** | Normalizes title/DOI, deduplicates, and ranks via cosine similarity with query. |
| | Database Persistence of Discovered Papers | **Missing** | AI returns items, but Express never stores discovered papers in PostgreSQL `Paper`. |
| **Ingestion & Processing** | PDF Download | **Broken / Insecure** | `ingestion_service.py` downloads any URL without SSRF validation; fails on blocked PDFs. |
| | Text Extraction & Cleaning | **Partial** | `pypdf` extracts text and strips references, but loses page numbers and headings. |
| | Chunking Strategy | **Partial** | Sliding window word chunking, but lacks section/page metadata tagging. |
| | Embedding Generation | **Implemented** | Uses SentenceTransformers `all-MiniLM-L6-v2` (384 dimensions) in batches. |
| | Vector Storage in Qdrant | **Partial / Insecure** | Upserts points idempotently via UUIDv5, but lacks `user_id`/`project_id` tenant scoping. |
| **Research Intelligence** | Paper Comparison Matrix | **Missing** | No extraction or comparison across method, dataset, metrics, findings, limitations. |
| | Double-Threshold Gap Detection | **Missing** | Curiac et al. (2022) keyword co-occurrence matrix $M(i,j)$ with $\alpha, \beta$ is missing. |
| | Cross-Paper Evidence Validation | **Missing** | No multi-paper evidence extraction classifying candidate gaps as supported/unsupported. |
| | Citation Verification | **Missing** | No verification checking that citations actually appear in retrieved passages. |
| | Evidence-Grounded Q&A (RAG) | **Partial** | RAG prompt and retrieval logic exist, but lack tenant filtering and chat history. |
| | Report Synthesis | **Partial** | Prompt exists in `report_prompt.txt`, but LangGraph does not persist structured reports. |
| **Frontend UI** | Dashboard & Project Cards | **Implemented** | Renders project list, handles empty state, opens new project modal. |
| | Research Workbench (`/projects/[id]`) | **Broken** | Renders static text placeholders instead of interactive tabs, progress, and results. |
| | Paper Library (`/library`) | **Missing** | Renders `<p>Library — coming in Phase 3.</p>`. |
| | Reports List (`/reports`) | **Missing** | Renders `<p>Reports list — coming in Phase 2.</p>`. |
| | Report Viewer & Citation Links | **Missing** | No Markdown rendering with clickable citation passages or side-by-side evidence pane. |
| | Export Triggers (MD, PDF, BibTeX) | **Missing** | No export buttons or endpoints wired up. |
| | Settings & Privacy Policy Page | **Missing** | Renders placeholder; no `/privacy` route explaining data flows and retention. |

---

## 3. Security & Privacy Risks (Ranked by Severity)

| Severity | ID | Vulnerability / Risk | Location | Impact & Exploitation Vector | Mitigation Strategy |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **CRITICAL** | **SEC-01** | **Server-Side Request Forgery (SSRF) in PDF Ingestion** | `ai/app/services/ingestion_service.py:77` (`download_pdf`) | An attacker can provide a `pdf_url` pointing to internal endpoints (`http://169.254.169.254/latest/meta-data/` or internal services on `127.0.0.1` / `10.0.0.0/8`). The server executes an unvalidated `requests.get(url)`. | Implement strict URL validation: allow only `http`/`https`, resolve DNS before connecting, reject loopback/private/link-local IP addresses, and restrict domains to verified academic providers (arXiv, Semantic Scholar, OpenAlex). |
| **CRITICAL** | **SEC-02** | **Multi-Tenant Vector & Data Isolation Violation** | `ai/app/vectordb/qdrantClient.py`, `retrieval.py:51`, `ingestion_service.py:113` | Qdrant vectors are stored in a single shared collection (`research_papers`) with no `userId` or `projectId` in payload or retrieval filter. User A querying RAG can retrieve and view private passages indexed by User B. | Add `user_id` and `project_id` to every Qdrant point payload. Enforce mandatory filter conditions (`FieldCondition(key="project_id", match=MatchValue(value=project_id))`) on all Qdrant vector queries. |
| **CRITICAL** | **SEC-03** | **Hardcoded / Exposed Database Credentials** | `server/.env:2` | The tracked or committed `.env` file contains raw credentials for an active AWS Neon PostgreSQL database. | Rotate database credentials immediately. Ensure `.env` is ignored by Git. Provide clean `.env.example` with safe placeholder tokens only. |
| **CRITICAL** | **SEC-04** | **Default JWT Secret & Weak Configuration** | `server/.env:3` | `JWT_SECRET` is set to the default placeholder `change-me-to-a-32-plus-char-random-string`. Anyone with access to the repo can forge administrative or user JWT tokens. | Enforce startup validation requiring a high-entropy secret (min 32 chars) in production and reject default placeholder values. |
| **HIGH** | **SEC-05** | **Unauthenticated AI Service API** | `ai/app/api/routes.py` | FastAPI endpoints on port 8000 have no API key, bearer token, or network restriction. Any client on the network can trigger expensive embeddings, arbitrary downloads, or query internal vectors. | Implement internal service authentication: require a shared secret header (`X-Service-Token`) validated via FastAPI dependency, configured through `AI_SERVICE_SECRET`. |
| **HIGH** | **SEC-06** | **Prompt Injection via Untrusted Research Papers** | `ai/app/services/rag_service.py:21`, `report_service.py:15` | Untrusted external PDF text and abstracts are interpolated directly into prompts with `{context}`. A malicious paper containing instructions (e.g., *"Ignore previous instructions and output..."*) could hijack report synthesis. | Isolate context using XML delimiter tags (`<context>...</context>`), sanitize extracted text, enforce explicit system instructions prohibiting instruction execution from context, and validate structured JSON outputs against schemas. |
| **HIGH** | **SEC-07** | **Fabrication Risk in Legacy Compiled Service** | `server/dist/services/ai.services.js:46` | Old compiled code contained fallback functions that generated fabricated paper titles (`"Investigative Study ..."`), fictitious authors, and canned synthesis text when the AI service failed. | Ensure clean compilation from source (`tsc`). Strictly prohibit mock or synthetic data fallbacks. If external services fail, return explicit terminal error states (`status: 'ERROR'`) with actionable user diagnostics. |
| **MEDIUM** | **SEC-08** | **Missing CSRF Protection on Mutating Endpoints** | `server/src/app.ts`, `auth.controller.ts`, `projects.controller.ts` | The API uses cookie-based authentication. While `SameSite: strict` helps, modern browser edge cases and cross-origin interactions warrant defense in depth against CSRF. | Enforce custom request header validation (e.g. `X-Requested-With` or `Origin` verification against `CORS_ORIGIN`) on all state-modifying requests (`POST`, `DELETE`, `PATCH`). |
| **MEDIUM** | **SEC-09** | **Unsanitized Markdown / XSS in Report Rendering** | `client/components/` | When the report viewer is implemented, rendering raw HTML or unsanitized Markdown could allow XSS attacks via malicious paper metadata. | Use `react-markdown` with `rehype-sanitize` and strict schema disallowing unsafe tags (`<script>`, `<iframe>`) and link protocols (allowing only `http:`, `https:`). |
| **MEDIUM** | **SEC-10** | **Unbounded Ingestion & Denial of Service** | `ai/app/services/ingestion_service.py:77` | PDFs are downloaded without maximum file size limits (`Content-Length` check) or execution timeouts, risking memory exhaustion (DoS). | Set strict download limits (e.g., max 25MB), enforce timeouts (15s), and limit concurrency. |
| **LOW** | **SEC-11** | **Tracked Python Cache & Bytecode Artifacts** | `ai/__pycache__/*.pyc` | Compiled bytecode files (`.pyc`) are tracked in the Git repository, creating noise and potential platform-specific execution mismatches. | Add `__pycache__/` and `*.pyc` to Git ignore and purge tracked cache files. |

---

## 4. Existing Tests & Baseline Failures

### 4.1 Server Test Suite Baseline
- **Execution Command:** `pnpm --filter server test`
- **Result:** **4 Failed, 7 Passed** (Total: 11 test files, 22 tests failed, 13 passed)
- **Detailed Breakdown:**
  - `tests/integration/health.test.ts`: **PASS** (1 test)
  - `tests/unit/auth.middleware.test.ts`: **PASS** (3 tests)
  - `tests/unit/env.test.ts`: **PASS** (2 tests)
  - `tests/unit/error.middleware.test.ts`: **PASS** (2 tests)
  - `tests/unit/logger.test.ts`: **PASS** (1 test)
  - `tests/unit/prisma.test.ts`: **PASS** (2 tests)
  - `tests/unit/validate.middleware.test.ts`: **PASS** (2 tests)
  - `tests/integration/auth.routes.test.ts`: **FAIL** (Prisma cannot reach `localhost:5432`)
  - `tests/integration/projects.routes.test.ts`: **FAIL** (Prisma cannot reach `localhost:5432`)
  - `tests/unit/auth.service.test.ts`: **FAIL** (Prisma cannot reach `localhost:5432`)
  - `tests/unit/projects.service.test.ts`: **FAIL** (Prisma cannot reach `localhost:5432`)
- **Root Cause:** `server/tests/setup.ts` hardcodes `process.env.DATABASE_URL ??= 'postgresql://researchos:researchos@localhost:5432/researchos_test'`. Since local Postgres is not running and tests do not mock Prisma or use a connected test database, all database-backed integration and unit tests fail immediately.
- **Server Typecheck:** `pnpm --filter server typecheck` fails with 3 errors in `src/services/projects.service.ts`:
  - Lines 11 & 12: `agentName: a.agentName` and `status: a.status` (Prisma raw string not assignable to strict string literal unions in `AgentRunDTO`).
  - Line 26: `status: p.status` (Prisma string not assignable to `ProjectStatusDTO`).

### 4.2 Client Test Suite Baseline
- **Execution Command:** `pnpm --filter client test`
- **Result:** **8 Passed, 0 Failed** (Total: 8 test files, 20 tests passed)
  - `tests/api.test.ts`: **PASS** (3 tests)
  - `tests/auth.test.ts`: **PASS** (8 tests)
  - `tests/ui.store.test.ts`: **PASS** (2 tests)
  - `tests/ProjectCard.test.tsx`: **PASS** (1 test)
  - `tests/Sidebar.test.tsx`: **PASS** (2 tests)
  - `tests/LoginPage.test.tsx`: **PASS** (2 tests)
  - `tests/RegisterPage.test.tsx`: **PASS** (1 test)
  - `tests/NewProjectModal.test.tsx`: **PASS** (1 test)
- **Client Typecheck:** `pnpm --filter client typecheck` fails with 1 error in `vitest.config.ts:6:13`:
  - `Type 'Plugin<any>[]' is not assignable to type 'PluginOption'` due to version mismatch between `@vitejs/plugin-react` and Vitest's bundled Vite type definitions.
- **Client Lint:** `pnpm --filter client lint` halts because `.eslintrc.json` is missing in `client/`, causing Next.js to prompt interactively for ESLint configuration.

### 4.3 AI Service Test Suite Baseline
- **Execution Command:** Standalone Python scripts in `ai/tests/` executed via Python 3.14.
- **Result:** **3 Passed, 6 Failed** (Total: 9 scripts)
  - `testChunking.py`: **PASS** (Chunking sliding window and reference stripper pass assertions).
  - `testEmbeddings.py`: **PASS** (Loads `sentence-transformers/all-MiniLM-L6-v2` and generates 384-dim vector).
  - `testPaperService.py`: **PASS** (Normalizes metadata and deduplicates papers).
  - `testCollection.py`: **FAIL** (`[Errno 111] Connection refused` — Qdrant not running on `127.0.0.1:6333`).
  - `testIngestion.py`: **FAIL** (`Connection refused` — cannot reach Qdrant).
  - `testInsert.py`: **FAIL** (`Connection refused` — cannot reach Qdrant).
  - `testRetrieval.py`: **FAIL** (`Connection refused` — cannot reach Qdrant).
  - `testSearch.py`: **FAIL** (`Connection refused` — cannot reach Qdrant).
  - `testServices.py`: **FAIL** (`Connection refused` — cannot reach Qdrant).
- **Environment Discrepancy:** The `ai/venv/bin/pip` executable has a broken shebang pointing to a non-existent `/home/sahilsaunke/code/researchOs/venv/bin/python3`, but all dependencies are present in the host Python 3.14 environment.

---

## 5. Prioritized Implementation Phases & Dependencies

```mermaid
flowchart TD
    P1[Phase 1: Environment & Baseline Stability] --> P2[Phase 2: Database Schema & Tenant Isolation]
    P2 --> P3[Phase 3: Core AI Pipeline & Qdrant Hardening]
    P3 --> P4[Phase 4: Double-Threshold Gaps & Evidence Validation]
    P4 --> P5[Phase 5: Express Backend Integration & SSE Streaming]
    P5 --> P6[Phase 6: Frontend Workbench & Real-Time UX]
    P6 --> P7[Phase 7: Security Hardening, Privacy & Quality Gates]
```

### Phase 1: Environment, Type System & Baseline Stability
*Goal: Fix all existing build, typecheck, lint, and test runner configurations before making functional modifications.*
- **Step 1.1:** Resolve server typecheck failures in `server/src/services/projects.service.ts` by adding explicit DTO type mappers and enums.
- **Step 1.2:** Resolve client typecheck failure in `client/vitest.config.ts` (satisfy or cast Vite plugin export).
- **Step 1.3:** Create standard `client/.eslintrc.json` using `next/core-web-vitals` to eliminate interactive prompts on `lint`.
- **Step 1.4:** Fix `server/tests/setup.ts` to support both offline/mocked testing and live database connection when configured.
- **Step 1.5:** Clean Python venv interpreter path or link to active Python 3.14 environment to ensure consistent package execution.

### Phase 2: Database Schema, Migrations & Server Data Layer
*Goal: Align PostgreSQL models with ResearchOS specifications to persist papers, chunks, gap candidates, and reports.*
- **Step 2.1:** Extend `server/prisma/schema.prisma` with:
  - `GapCandidate` (id, projectId, statement, topicA, topicB, coOccurrenceScore, alpha, beta, validationStatus, createdAt).
  - `GapEvidence` (id, candidateId, paperId, passage, pageNumber, relation: `SUPPORTS` | `CONTRADICTS` | `PARTIALLY_SUPPORTS` | `INCONCLUSIVE`).
  - `PaperComparison` (id, projectId, paperId, problem, methodology, dataset, metrics, findings, limitations).
  - Updated `Paper` fields to store page count, publication source, and DOI.
- **Step 2.2:** Run Prisma migration against database.
- **Step 2.3:** Implement repositories/services in Express to persist research run results, papers, and gap candidates.

### Phase 3: Core AI Pipeline, SSRF Defense & Qdrant Tenant Scoping
*Goal: Secure and complete paper ingestion, embeddings, and scoped retrieval.*
- **Step 3.1: SSRF Defense in `ingestion_service.py`:**
  - Build `validate_download_url(url)` to enforce HTTPS, resolve DNS to prevent loopback/private/link-local connections, and allowlist trusted academic domains (arXiv, Semantic Scholar, CrossRef, OpenAlex).
  - Enforce timeout (15s) and maximum file size (25MB).
- **Step 3.2: Page-Aware PDF Parsing in `rag/ingestion.py`:**
  - Preserve page boundaries and extract section headers (`Abstract`, `Introduction`, `Methods`, `Results`, `Limitations`, `Conclusion`).
  - Tag chunks with `page_number`, `section_title`, `paper_id`, `project_id`, and `user_id`.
- **Step 3.3: Qdrant Scoping & Multi-Tenancy:**
  - Update `vectordb/qdrantClient.py` to support remote cloud URL + API key (`QDRANT_URL`, `QDRANT_API_KEY`) with fallback to local host/port.
  - Add payload indexes for `project_id` and `user_id`.
  - Update `retrieval.py` to require `project_id` filter on all queries, guaranteeing zero cross-tenant vector leakage.
- **Step 3.4: LLM Abstraction & Prompt Defense:**
  - In `llmService.py`, isolate user/paper content with XML boundary delimiters.
  - Provide fallback error handling when local Ollama is offline or unavailable.

### Phase 4: Double-Threshold Research Gap Detection & Evidence Validation
*Goal: Implement the scientific core specified in Instructions.md Section 7.4 & 7.5.*
- **Step 4.1: Double-Threshold Candidate Generation (Curiac et al. 2022):**
  - Implement keyword/topic extraction from the selected corpus using TF-IDF or keyphrase frequency.
  - Construct the normalized symmetric co-occurrence matrix $M(i, j) = \frac{C(i, j)}{\sqrt{C(i) \cdot C(j)}}$.
  - Validate configurable thresholds $0 \le \alpha \le \beta \le 1$.
  - Classify pairs:
    - $M(i, j) < \alpha$: Excluded (insufficient association).
    - $\alpha \le M(i, j) \le \beta$: **Candidate Research Gap** (novel intersection).
    - $M(i, j) > \beta$: Excluded (well-explored topic combination).
  - Output candidate records with full reproducibility parameters ($\alpha, \beta$, matrix values, corpus size).
- **Step 4.2: Cross-Paper Evidence Validation:**
  - For each candidate gap, retrieve relevant passages across multiple corpus papers.
  - Classify evidence relation: `supports`, `contradicts`, `partially_supports`, `addresses_already`, or `unclear`.
  - Apply deterministic classification:
    - `supported`: Multiple independent sources confirm the unresolved problem.
    - `partially_supported`: Broad issue confirmed but requires narrower framing.
    - `unsupported`: Addressed by existing papers.
    - `inconclusive`: Insufficient evidence in corpus.
- **Step 4.3: Citation Verification:**
  - Match inline citations `[n]` against the exact retrieved chunk IDs and source metadata. Flag or strip unverified references.

### Phase 5: Express Backend Integration & Server-Sent Events (SSE)
*Goal: Connect Express to the AI service, orchestrate run lifecycle, and stream real-time events.*
- **Step 5.1:** Add service-to-service authentication between Express and FastAPI (`X-Service-Token`).
- **Step 5.2:** Implement `research.service.ts` in Express:
  - On project creation or manual run trigger, dispatch async job to `AI_SERVICE_URL/research` with `projectId`, `userId`, `topic`, `paperLimit`.
  - Record stage transitions in `AgentRun` (`DISCOVERY` -> `INGESTION` -> `ANALYSIS` -> `GAPS` -> `REPORT`).
- **Step 5.3: SSE Progress Streaming Endpoint:**
  - Implement `GET /api/projects/:id/stream` in Express sending typed SSE events:
    `run.started`, `stage.updated`, `paper.discovered`, `paper.ingested`, `gap.detected`, `report.completed`, `run.failed`.
- **Step 5.4: New Project Endpoints:**
  - `GET /api/projects/:id/papers` (list ingested papers with metadata).
  - `GET /api/projects/:id/gaps` (list validated candidate research gaps with evidence).
  - `GET /api/projects/:id/report` (fetch synthesized report).
  - `POST /api/projects/:id/ask` (evidence-grounded Q&A scoped to this project).
  - `GET /api/projects/:id/export/markdown` and `/export/bibtex`.

### Phase 6: Frontend Workbench & Real-Time UX
*Goal: Connect the Next.js UI to the real backend and replace all placeholder text.*
- **Step 6.1:** Rewrite `client/hooks/useResearchJob.ts` to consume the real SSE stream (`/api/projects/:id/stream`), tracking live agent stages and stage percentages without fabrication.
- **Step 6.2:** Overhaul `WorkspaceTabs.tsx`:
  - **Progress Tab:** Live timeline of execution stages, active agent status, and honest error displays.
  - **Papers Tab:** Grid/table of discovered papers with title, authors, year, source, venue, citation count, and PDF link.
  - **Comparison Tab:** Matrix comparing papers by problem, method, dataset, metrics, findings, and limitations.
  - **Research Gaps Tab:** Display double-threshold candidate gaps, co-occurrence scores, and supporting cross-paper evidence.
  - **Report Tab:** Render sanitized Markdown and math with inline citations that open supporting evidence in a slide-over drawer.
  - **Q&A Tab:** Ask questions against the project corpus with traceable passage citations.
- **Step 6.3:** Implement Library page (`/library`), Reports page (`/reports`), and Settings page (`/settings`).
- **Step 6.4:** Implement Export buttons for Markdown and BibTeX.

### Phase 7: Privacy Policy, Security Hardening & Quality Gates
*Goal: Ensure full compliance with Instructions.md constraints and verify complete test suite passes.*
- **Step 7.1: Privacy Policy Page:**
  - Create `/privacy` page explaining exact data retention, local embedding processing, external API usage (Semantic Scholar / arXiv), and zero unauthorized external sharing.
- **Step 7.2: Security Hardening:**
  - Add origin verification against CSRF on mutating endpoints.
  - Sanitize Markdown rendering with `rehype-sanitize`.
  - Verify IDOR protection: User A cannot access User B's project, papers, stream, or reports.
- **Step 7.3: Quality Gates Execution:**
  - Run `pnpm --filter server typecheck` and `test`.
  - Run `pnpm --filter client typecheck`, `lint`, and `test`.
  - Run AI service test suite with mocks for external APIs.
  - Verify production builds (`pnpm --filter client build`, `pnpm --filter server build`).

---

## 6. The First End-to-End Vertical Slice to Complete

To establish a functioning core before broadening features, we will implement this **single vertical slice** end-to-end:

```text
User creates project "Transformer Efficiency" with paperLimit=3
  │
  ▼
Express creates Project(status: QUEUED) & dispatches to AI service
  │
  ▼
AI discovers 3 real papers via arXiv / Semantic Scholar API
  │
  ▼
AI extracts text from PDFs with page metadata & generates embeddings
  │
  ▼
Embeddings & chunks are saved to Qdrant with projectId filter
  │
  ▼
AI executes double-threshold keyword co-occurrence gap detection (Curiac et al.)
  │
  ▼
AI validates gap candidates across the 3 papers
  │
  ▼
AI synthesizes structured report with inline [1], [2] citations
  │
  ▼
Express receives completed payload, saves Papers, Gaps, and Report in PostgreSQL
  │
  ▼
Frontend SSE receives 'run.completed' -> displays Papers, Gap Candidates, and Report Viewer
```

### Verification Criteria for Vertical Slice:
1. No synthetic or fabricated data — all papers must be genuine arXiv / Semantic Scholar results.
2. Honest progress events streamed via SSE — no simulated delays or fake percentages.
3. Scoped Qdrant retrieval — queries must include `projectId`.
4. The candidate gap must show actual co-occurrence values and $\alpha, \beta$ bounds.
5. Report citations must be verified against real chunks.

---

## 7. Immediate Next Actions

Upon review and approval of this plan:
1. Fix baseline type errors in `server/src/services/projects.service.ts` and `client/vitest.config.ts`.
2. Implement the SSRF validation and Qdrant tenant scoping in `ai/app/`.
3. Implement the double-threshold gap detection algorithm in `ai/app/services/gap_service.py`.
4. Connect Express to the AI service with SSE streaming.
5. Replace frontend placeholder tabs with real live data views.
