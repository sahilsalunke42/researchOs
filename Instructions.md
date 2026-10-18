# ResearchOS Agent Instructions

> **Mission:** Complete ResearchOS into a secure, coherent, maintainable AI research-intelligence platform. Work in the existing repository, preserve working functionality, and implement the project end to end. Do not merely produce a plan, mock UI, or documentation claiming features work when they do not.

## 1. Product vision

ResearchOS helps researchers move from a research question to a traceable understanding of existing literature. It should support:

1. Discovering relevant scientific papers.
2. Ingesting papers and extracting their text and metadata.
3. Searching paper content semantically.
4. Answering questions using retrieved evidence (RAG).
5. Comparing papers across methods, datasets, findings, limitations, and future work.
6. Generating *candidate* research gaps using a double-threshold keyword co-occurrence method.
7. Validating candidate gaps across multiple papers, with evidence and citations.
8. Producing structured literature-review and research-analysis reports.
9. Showing execution progress and errors clearly.
10. Exporting useful results and keeping each user's data private.

**Core principle:** ResearchOS must distinguish a plausible AI-generated claim from a claim supported by the indexed literature. Gap candidates are not confirmed gaps. The UI and reports must communicate uncertainty and corpus limitations.

## 2. Start by inspecting the existing repository

Before editing anything:

- Inspect the complete repository tree, README files, package manifests, lockfiles, environment examples, migrations, API routes, tests, and current Git status.
- Read the existing architecture and follow it unless there is a concrete technical reason to change it.
- Identify what is already implemented, partially implemented, broken, duplicated, or only mocked.
- Trace at least one real end-to-end path from UI → backend → AI service → database/vector store → UI.
- Run existing tests and record the baseline failures before changes.
- Reuse the existing Python virtual environment and installed dependencies if present. Do not recreate environments or replace dependency managers unnecessarily.
- Keep current technologies where practical: Next.js 14 frontend, Express.js application backend, PostgreSQL for relational data, FastAPI/Python AI service, LangGraph orchestration where already used, Qdrant for vector search, and Ollama/local models where configured. The repository is the source of truth if actual configuration differs.
- Do not introduce every technology mentioned in a conceptual architecture. Redis, Celery, Temporal, S3, WebSockets, extra agents, or a new framework are optional, not requirements unless the current project needs them.
- Do not replace the current stack wholesale, delete working code, change API contracts casually, or rewrite files just for stylistic preference.
- Create a short implementation checklist in the project notes or report your checklist before making broad changes. Then execute the work; do not stop after analysis.

## 3. Definition of done

A feature is complete only when it has a real backend path, validation, error handling, tests where feasible, and a working UI integration. A button that does nothing, hardcoded sample results presented as live data, fake progress, placeholder charts, or fabricated citations do not count as implementation.

At completion:

- The main workflow works end to end with real services or clearly reported provider limitations.
- No secrets are committed or exposed to the browser.
- Authentication and authorization are enforced server-side.
- Database access is parameterized/ORM-based and scoped to the authenticated user.
- The UI is responsive, accessible, consistent, and not cluttered.
- Long-running work exposes honest progress and failure states.
- Research claims link to source evidence whenever possible.
- Automated tests, lint, type checks, and builds pass, or remaining failures are explicitly listed.
- Documentation accurately describes implemented behavior, configuration, security, and limitations.

## 4. Frontend specification

### 4.1 Stack and engineering rules

- Use the repository's current Next.js App Router setup and TypeScript conventions.
- Use the existing Tailwind CSS and established component system. If shadcn/ui or Radix is already installed, use it consistently; do not add a second component system.
- Use TanStack Query or the project's existing data-fetching pattern for server state. Use Zustand/Context only where local cross-component state actually requires it.
- Keep components small and focused. Separate page composition, reusable UI, API clients, schema validation, and domain logic.
- Avoid giant components, duplicated fetch logic, deeply nested ternaries, `any`, unexplained magic constants, and global mutable state.
- Use strict TypeScript and shared typed API contracts. Validate runtime responses instead of trusting casts.
- Never put API secrets, database credentials, internal service URLs, or privileged tokens in `NEXT_PUBLIC_*` variables.
- Do not render raw HTML from model output. Sanitize rendered Markdown and disallow unsafe HTML. Use safe Markdown/LaTeX renderers and sanitize link protocols.

### 4.2 Main product areas

Build on existing routes and design rather than duplicating them. The intended UX should include:

1. **Research dashboard**
   - Clear entry point to start a research run.
   - Recent runs, run status, and saved reports for the current user only.
   - Useful empty, loading, error, and retry states.

2. **Research workbench**
   - Research topic/question input.
   - Optional scope controls: date range, source selection, desired depth, paper limit, and relevant filters, if supported by the backend.
   - Validate inputs and explain limits. Do not display controls that are not connected to real behavior.
   - Prevent accidental duplicate submissions and show clear run state.

3. **Live execution / progress**
   - Show actual state transitions from the backend, such as planning, discovery, ingestion, retrieval, analysis, verification, and report generation.
   - Prefer Server-Sent Events (SSE) for one-way progress updates if supported by the backend. Use WebSockets only if bidirectional communication is genuinely needed.
   - Reconnect safely, handle disconnects, and support fetching current status after reconnect.
   - Never fabricate agent events, percentages, or completion.

4. **Paper library and paper detail**
   - Display title, authors, year, venue/source, DOI/arXiv ID, abstract, URL, ingestion status, and available citation metadata.
   - Show processing errors and permit retry where appropriate.
   - Avoid exposing local filesystem paths, internal database IDs unnecessarily, or internal stack traces.

5. **Research report / document viewer**
   - Render structured Markdown and math safely.
   - Display citations inline and make them open the source paper or the supporting passage.
   - Where available, show page number, section, source title, DOI/URL, and exact evidence passage.
   - Distinguish retrieved evidence, model-generated interpretation, and unsupported/inconclusive conclusions.
   - Provide paper comparison tables, research-gap candidates, methodology summaries, and literature-review sections.
   - Add export options only when the corresponding export path works (Markdown, PDF, DOCX, BibTeX as feasible).

6. **Workspaces and history**
   - Users can organize runs/reports if this is supported by the existing data model.
   - Users can access only workspaces, papers, runs, and artifacts they own or have been explicitly granted access to.
   - Add deletion and confirmation flows where applicable.

7. **Settings and privacy**
   - Show account and relevant application settings without revealing secrets.
   - Provide a clear privacy policy page and links to privacy/security information.
   - If account deletion or data deletion is offered, make it actually delete or schedule deletion of associated data according to documented retention rules.

### 4.3 Visual quality

- Maintain a professional, research-oriented interface: calm dark/light palette, strong typographic hierarchy, clear spacing, restrained accent colors.
- Prioritize readable tables, long-form report content, citations, and evidence panels.
- Use a consistent spacing scale and responsive layouts. Avoid cramped cards and oversized empty areas.
- Include keyboard navigation, visible focus states, semantic landmarks, labels, and accessible dialogs.
- Add loading skeletons only when useful, and avoid layout shifts.
- Handle mobile, tablet, and desktop widths.
- Keep console clean; no debug logs or sensitive values in client logs.

## 5. Backend specification

### 5.1 Architecture

- Preserve the current Express.js backend as the main application API if that is what the repository uses.
- Keep the Python/FastAPI AI service responsible for document processing, retrieval, embeddings, RAG, and AI orchestration where it already exists.
- Keep responsibilities explicit:
  - **Frontend:** presentation and user interactions.
  - **Application backend:** authentication, authorization, user/workspace data, run lifecycle, request validation, rate limits, and access to persistence.
  - **AI service:** ingestion, retrieval, analysis, LangGraph execution, and structured AI outputs.
  - **PostgreSQL:** durable relational records.
  - **Qdrant:** embeddings and vector-search payloads.
  - **Object storage/local private storage:** files and generated artifacts, when used.
- Do not let the frontend talk directly to PostgreSQL, Qdrant, Ollama, or private AI-service endpoints.
- Do not expose an unauthenticated internal AI service publicly. Use private networking or service authentication.
- Avoid circular dependencies and business logic in route handlers. Separate routes/controllers, services/use cases, repositories/data access, schemas, and integrations.

### 5.2 API design

- Use versioned or consistently named REST routes following existing conventions.
- Validate every request body, query parameter, path parameter, and external provider response with schemas (Zod or the repository's existing validator in Node; Pydantic in Python).
- Use consistent response envelopes and appropriate HTTP status codes.
- Add pagination, sorting, and maximum page sizes to list endpoints.
- Return safe error codes/messages to clients; log diagnostic details only on the server.
- Support idempotency or duplicate-run prevention where repeated submissions could create expensive jobs.
- Suggested capabilities, adapting to the current API rather than blindly adding duplicate routes:
  - Start a research run.
  - Read a run's status and progress stream.
  - Fetch a completed report.
  - List/fetch papers in a user's scope.
  - Ask a question against an authorized run or workspace.
  - Compare papers.
  - Inspect candidate gaps and supporting evidence.
  - Export a report or bibliography.
  - Retry a failed ingestion/run.
  - Manage workspace and user data.
- Use SSE for progress if suitable. Send typed events such as `run.started`, `stage.updated`, `paper.discovered`, `paper.ingested`, `evidence.retrieved`, `report.partial`, `run.completed`, and `run.failed`. Do not stream secrets, raw database rows, private provider errors, or unfiltered internal prompts.
- Implement cancellation and timeouts where practical. Record terminal status even when a worker fails.
- Handle academic API throttling, transient failures, retries with exponential backoff and jitter, and provider-specific rate limits. Avoid retrying non-retryable errors forever.
- External services may return partial data or HTTP 429; show this accurately rather than claiming the search succeeded.

### 5.3 Data model

Inspect existing schema first. Extend rather than replace it. A normalized model may include:

- `users` / authentication identity mapping
- `workspaces` and workspace memberships, if collaboration is supported
- `research_runs` (owner, query, configuration, status, timestamps, error code)
- `papers` (normalized metadata and source identifiers)
- `paper_files` / document artifacts (private storage key, checksum, MIME type, status)
- `paper_chunks` (chunk identifiers, text reference, page/section metadata)
- `run_papers` (many-to-many relation between runs and papers)
- `retrieval_evidence` (run, paper, chunk, page/section, evidence text or safe reference, relevance score)
- `gap_candidates` (candidate statement, co-occurrence evidence, thresholds, validation status)
- `gap_evidence` (candidate-to-paper/passages relationship and support/contradiction/uncertain classification)
- `reports` / `report_sections` (owner, run, content, status, version)
- `citations` and `exports` as needed
- audit/security events only where appropriate and privacy-preserving

Use migrations, foreign keys, unique constraints, appropriate indexes, transactions for multi-step writes, and explicit ownership relationships. Do not store redundant copies of large text everywhere without a reason. Avoid storing secrets or unnecessary personal data.

### 5.4 Database access and frontend privacy

**Critical requirement: raw database data must never be exposed directly to the frontend.**

- The browser must only receive explicit, validated DTOs/API responses containing fields required for that screen.
- Never return raw ORM/database objects or `SELECT *` results directly.
- Never expose password hashes, session tokens, reset tokens, internal prompts, environment values, private file paths, internal service credentials, raw logs, other users' records, or internal database structure.
- Use allowlisted response schemas and explicit serialization/mapping.
- Scope every private query by the authenticated user's ID or verified workspace membership, not merely by an object ID supplied by the client.
- Test for insecure direct object reference (IDOR): user A must not fetch, modify, stream, export, or delete user B's records by guessing IDs.
- Keep Qdrant payloads and object storage private. Verify ownership before vector retrieval, file access, and export.
- Do not expose Qdrant, PostgreSQL, Ollama, or object-storage admin endpoints to the browser.
- Use private object URLs or authenticated download handlers with short expiry when signed URLs are necessary.
- Do not assume an opaque ID is authorization. Every read and write still requires permission checks.

## 6. Security requirements

Security must be implemented in code and verified with tests. Do not describe the platform as “100% secure” or “SQL-injection proof”; the goal is defense in depth and tested resistance to known attack classes.

### 6.1 Authentication and authorization

- Inspect the existing auth system and harden it rather than inventing a second one.
- Hash passwords using a modern password-hashing algorithm (Argon2id or bcrypt with appropriate cost) if passwords are managed locally.
- Use secure, HTTP-only, SameSite cookies for browser sessions where appropriate; set `Secure` in HTTPS production.
- If JWT is used, validate signature, issuer/audience where applicable, expiry, and allowed algorithms. Do not store long-lived privileged tokens in localStorage.
- Implement login/session expiry, logout invalidation where supported, and safe password reset flows with single-use, expiring tokens.
- Add authorization checks on every private route and every resource operation.
- Use least privilege for database users, service credentials, and storage permissions.
- Add CSRF protection when cookie-based authentication and cross-site requests make it relevant.

### 6.2 SQL injection and data validation

- Use parameterized queries or the ORM's safe query API for all database operations.
- Never build SQL by concatenating user input. Do not use unsafe raw SQL unless parameters are bound and the use is justified.
- Validate types, lengths, ranges, allowed enum values, sorting fields, pagination, and filters at the API boundary.
- Allowlist dynamic column/order identifiers; SQL parameters cannot safely substitute arbitrary identifiers.
- Add tests with common SQL-injection payloads to ensure input is treated as data.
- Use database constraints and transactions in addition to application validation.

### 6.3 API and browser security

- Configure CORS for explicit trusted origins, not wildcard origins with credentials.
- Add rate limiting to authentication, research-run creation, search, export, and expensive AI endpoints.
- Set request-body and upload-size limits, request timeouts, and concurrency limits.
- Use security headers (CSP where compatible, HSTS in HTTPS, `X-Content-Type-Options`, appropriate frame/referrer policies).
- Protect against XSS: sanitize Markdown/HTML, avoid unsafe rendering, validate URLs, and do not execute model-generated code.
- Prevent SSRF: validate external URLs, allow only expected schemes/hosts where applicable, block loopback/private/link-local addresses for user-supplied fetch URLs, and revalidate redirects. Prefer known provider APIs over arbitrary URL fetching.
- Treat uploaded PDFs and external paper metadata as untrusted input. Validate MIME/type and size, use safe parsers, avoid shell interpolation, and isolate risky processing if feasible.
- Avoid path traversal in filenames and storage keys. Never trust client-provided filesystem paths.
- Do not expose stack traces, SQL errors, prompts, provider keys, or environment details in production responses.
- Do not use wildcard file access or public buckets for private papers/reports by default.

### 6.4 Secrets, logging, and privacy

- Read secrets from environment variables or a secret manager. Provide `.env.example` with names and safe placeholders only.
- Ensure `.env`, tokens, private keys, downloaded private PDFs, and local databases are ignored by Git where appropriate.
- Scan tracked files and diffs for secrets before finalizing.
- Never log passwords, auth headers, cookies, API keys, full private documents, or full prompts containing sensitive user data.
- Use structured logs with run/request IDs and redaction.
- Minimize personal data collection. Define retention and deletion behavior for uploaded documents, generated reports, logs, and embeddings.
- Add a Privacy Policy page that accurately explains what is collected, why, where it is stored, third-party services used, retention/deletion practices, and contact/rights process as applicable. Do not claim legal compliance or privacy guarantees that have not been implemented.
- Add Terms/acceptable-use or security documentation if appropriate, but do not let placeholder legal copy misrepresent real practices.
- Document local-model versus third-party-provider data flows clearly. Never silently send private user documents to an external LLM provider.
- If external providers are configured, make that behavior explicit and configurable. Redact sensitive metadata when possible.
- Support deletion of a user's data and derived records according to a documented policy; deletion must account for relational rows, object files, vector points, and generated artifacts.
- Do not send raw database contents or secrets to an LLM.

### 6.5 AI-specific security and reliability

- Treat paper text, PDF content, retrieved passages, and metadata as untrusted data, not instructions. Defend against prompt injection inside documents.
- Separate system instructions from retrieved text. Do not allow papers to override tools, permissions, prompts, or application policy.
- Give agents only the tools and permissions needed for their task. Require explicit server-side authorization before file access or mutations.
- Validate model output against typed schemas. If JSON is malformed, use bounded repair/retry or return a safe failure.
- Never execute generated shell commands, SQL, or code.
- Do not trust model-produced URLs, DOIs, page numbers, citations, or metadata without checking against stored source metadata and source passages.
- Citation verification must check that the referenced paper/passage exists and actually supports the associated claim. If it cannot be verified, label it as unverified or omit the citation.
- Use bounded agent iterations, token/context limits, execution timeouts, cancellation, and per-run budgets.
- Keep tool results and agent state scoped to the current run and authorized user.
- Do not allow an agent to access another user's papers or retrieve globally indexed private chunks without access checks.
- Add adversarial tests for prompt injection, fake citations, irrelevant retrieval, malformed model output, and provider failure.

## 7. AI intelligence tier and research workflow

Keep the AI service modular and consistent with the existing FastAPI/Python code. Do not create one enormous `main.py` or a monolithic agent class.

A reasonable structure, adapted to the existing tree, is:

```text
ai/
  app/
    main.py
    api/
      routes/
        health.py
        ingestion.py
        research.py
        retrieval.py
        reports.py
      dependencies.py
    config/
      settings.py
    schemas/
      requests.py
      responses.py
      events.py
      research.py
    services/
      discovery_service.py
      ingestion_service.py
      retrieval_service.py
      analysis_service.py
      gap_service.py
      validation_service.py
      report_service.py
      citation_service.py
    rag/
      chunking.py
      embeddings.py
      retrieval.py
      reranking.py          # only if actually used
      prompts.py
    graph/
      state.py
      workflow.py
      nodes/
        plan_research.py
        discover_papers.py
        ingest_papers.py
        retrieve_evidence.py
        analyze_papers.py
        generate_gap_candidates.py
        validate_gap_candidates.py
        verify_citations.py
        synthesize_report.py
    vectordb/
      qdrant_client.py
      repositories.py
    integrations/
      arxiv_client.py
      semantic_scholar_client.py
      crossref_client.py    # optional
      pubmed_client.py      # optional
      ollama_client.py
    security/
      service_auth.py
      document_safety.py
    tests/
  requirements.txt or existing dependency file
  .env.example
```

This is a target organization, not permission to duplicate existing modules. Map current files to these responsibilities and refactor incrementally.

### 7.1 Discovery and ingestion

- Normalize metadata and deduplicate papers using DOI, arXiv ID, normalized title, and other reliable identifiers.
- Respect provider terms, API quotas, and rate limits. Prefer official APIs.
- Handle abstracts-only papers separately from papers with full text/PDFs.
- Record provenance: provider, canonical URL, DOI/arXiv ID, retrieval time, and document checksum where useful.
- Extract text with page boundaries preserved. Keep page and section metadata on chunks where possible.
- Chunk by sensible text boundaries with overlap only where useful. Avoid mixing unrelated sections or dropping references and tables silently.
- Make ingestion idempotent and track states such as `pending`, `processing`, `completed`, `partial`, and `failed`.
- Never fabricate extracted content when a PDF cannot be parsed.

### 7.2 Embeddings and Qdrant

- Use the embedding model configured by the repository. Keep the model ID and embedding dimensions in configuration.
- Ensure query and document embeddings use compatible models and dimensions.
- Store only necessary metadata in vector payloads; include paper/chunk identifiers, source, page/section, owner/workspace scope, and access labels as needed.
- Enforce access filters on retrieval. Do not rely solely on the client to filter results.
- Handle collection creation, schema changes, Qdrant unavailable, and model changes explicitly.
- Use batch operations where appropriate and avoid duplicate points on repeated ingestion.
- Add tests for retrieval quality and user/workspace isolation.

### 7.3 RAG pipeline

1. Validate the question and determine the authorized run/workspace scope.
2. Rewrite or decompose the question only where beneficial and bounded.
3. Embed the query using the compatible configured model.
4. Retrieve relevant chunks from Qdrant using server-side access filters.
5. Optionally rerank results if a suitable implementation already exists or evaluation justifies it.
6. Construct a context containing source IDs, paper metadata, page/section, and text.
7. Prompt the model to answer only from evidence for claims about the indexed corpus, cite sources, state uncertainty, and distinguish inference from explicit author statements.
8. Validate the structured output and citations.
9. Return answer, evidence, citations, limitations, and run metadata through a safe response DTO.
10. Store permitted results and stream progress without leaking internal prompts or secrets.

If evidence is insufficient, say so and suggest more retrieval or broader paper discovery rather than inventing an answer.

### 7.4 Double-threshold research-gap candidate generation

Implement the method described in Curiac, Doboli, and Curiac (2022) as a candidate-generation baseline, not as proof of a genuine gap.

- Extract or identify meaningful keywords/topics from the selected corpus.
- Build a normalized co-occurrence matrix `M(i, j)` with a documented definition and corpus scope.
- Make thresholds `alpha` and `beta` configurable and validate `0 <= alpha <= beta <= 1` if the score is normalized to `[0, 1]`.
- Apply the paper's interpretation:
  - `M(i, j) < alpha`: insufficient association; exclude as a candidate.
  - `alpha <= M(i, j) <= beta`: retain as a candidate combination.
  - `M(i, j) > beta`: potentially well explored; exclude from the novel-candidate set.
- Preserve threshold values, corpus size, source set, keyword extraction method, and co-occurrence score for reproducibility.
- Do not hardcode the illustrative threshold values from examples as universal constants.
- Consider topic combinations/subgraphs and rank them using an explicit, documented rule consistent with the source method. If the full method is simplified, label and document the simplification.
- Show users that the output is a **candidate research gap** pending evidence validation.
- Avoid claims of novelty unless the corpus/search coverage is sufficiently described and the claim is verified against retrieved literature.

### 7.5 Cross-paper evidence validation

For each candidate, retrieve relevant passages from multiple papers and build a structured evidence set:

- Paper identity and bibliographic metadata.
- Exact supporting passage and page/section if available.
- Method, dataset, findings, limitations, and future work when present.
- Evidence relation: `supports`, `contradicts`, `partially_supports`, `addresses_already`, or `unclear`.
- Source provenance and verification status.

Compare candidate claims against the evidence and classify the result using explicit, documented rules, for example:

- `supported`: multiple relevant sources support the unresolved issue and no retrieved evidence clearly invalidates it.
- `partially_supported`: the broad issue is established but must be narrowed.
- `unsupported`: available evidence does not justify the claim or relevant work appears to have already addressed it.
- `inconclusive`: corpus coverage or evidence is insufficient.

Do not make “no paper found” equivalent to “no paper exists.” Use cautious language and expose corpus/search limitations. Do not use an LLM confidence score as the sole validation mechanism.

### 7.6 Paper comparison and literature review generation

- Compare papers using consistent fields: research question, approach, model/algorithm, dataset, metrics, findings, limitations, and future work.
- Do not fill absent fields with guesses; mark them `not reported` or `not extracted`.
- Literature-review sections should synthesize evidence across sources rather than concatenate isolated summaries.
- Every factual claim about a paper should be linked to that paper or a supporting passage.
- Generate citations from validated metadata. Do not invent author names, titles, DOIs, page numbers, or publication years.
- Export BibTeX only from normalized/validated metadata. Mark incomplete fields instead of inventing them.
- Provide a report methodology section explaining search sources, dates, filters, corpus size, exclusions, and limitations when the information is available.

## 8. LangGraph orchestration

If LangGraph is already used, preserve it and make the state and transitions explicit.

A practical workflow may be:

```text
START
  -> validate_request_and_scope
  -> plan_research
  -> discover_papers
  -> normalize_and_deduplicate
  -> ingest_available_documents
  -> retrieve_evidence
  -> analyze_papers
  -> generate_double_threshold_candidates
  -> validate_candidates_across_papers
  -> verify_citations
  -> synthesize_report
  -> persist_results
  -> END
```

- Keep state typed and minimal; avoid carrying huge full-text documents in every graph node.
- Store artifact references and relevant evidence IDs in state where possible.
- Add bounded retries and explicit error edges.
- Persist enough status to resume or inspect a failed run where feasible.
- Ensure retries do not duplicate database records, vector points, or exports.
- Emit progress events from real node transitions.
- Do not introduce an elaborate multi-agent swarm unless it demonstrably improves the workflow. Prefer deterministic, testable nodes and use LLM calls for tasks that need them.
- Make external side effects explicit and idempotent.

## 9. Privacy policy and data lifecycle

Create or update a privacy policy page and developer documentation that match the implementation. Address:

- Data collected: account identity, research prompts, uploaded or fetched papers, reports, run history, diagnostics, and optional settings.
- Purposes: authentication, research processing, storage, troubleshooting, and requested exports.
- Processing locations and providers: local Ollama, application servers, academic APIs, and any external AI provider actually enabled.
- Retention: how long documents, embeddings, runs, reports, and logs are retained.
- Deletion: what is deleted immediately, asynchronously, or retained for a defined legal/security reason.
- Security measures and their limits.
- User contact/privacy request mechanism where applicable.
- Whether content is sent to third parties and how users can configure this, if applicable.

Do not claim “we never share data,” “end-to-end encrypted,” “GDPR compliant,” or similar unless the architecture and policies support the claim. Make the privacy page visible from the application. Keep terms and policy text truthful and reviewed before public deployment.

## 10. Testing and quality gates

Add or improve tests in the project's existing testing framework.

### Required tests

- Unit tests for validation, chunking, metadata normalization, threshold classification, citation mapping, and response serializers.
- API tests for authentication, authorization, validation, pagination, errors, and rate limits.
- Cross-user isolation tests for reports, papers, files, streams, exports, Qdrant retrieval, and workspace access.
- SQL-injection tests verifying malicious strings are treated as data.
- XSS/Markdown sanitization and unsafe-link tests.
- Prompt-injection tests using malicious instructions inside a paper.
- RAG tests where evidence is missing, irrelevant, contradictory, or sufficient.
- Citation tests for valid, nonexistent, mismatched, and unsupported citations.
- Failure tests for unavailable Ollama/Qdrant, API 429, malformed model output, timeouts, and partial ingestion.
- Frontend tests for loading, empty, error, retry, unauthorized, and success states.
- End-to-end test of a research query through report rendering using mocked external providers where deterministic testing is needed.

### Quality gates

Run the actual available commands for:
- frontend lint, type-check, tests, and production build;
- backend lint/type-check/tests;
- AI service tests and import/startup checks;
- migrations against a disposable test database where possible;
- secret scan and dependency audit where tooling is available.

Fix new regressions. Clearly list pre-existing failures and anything that could not be tested. Do not claim tests pass without running them.

## 11. Performance, resilience, and maintainability

- Add timeouts to every network call and model request.
- Use bounded concurrency and provider-aware rate limiting.
- Cache public paper metadata where appropriate, with expiry and provenance.
- Avoid re-embedding unchanged documents; use checksums and model-version metadata.
- Paginate large lists and avoid loading full documents into dashboard responses.
- Add indexes based on actual query patterns.
- Use transactions for related database updates.
- Keep long-running jobs out of request handlers.
- Avoid N+1 queries, unbounded `Promise.all`, unlimited graph recursion, and unbounded model context.
- Use typed configuration with startup validation and safe defaults.
- Make startup health checks meaningful but do not expose internal diagnostics publicly.
- Keep code comments focused on non-obvious reasoning, not restating each line.
- Do not add abstractions that only wrap one trivial call unless they clarify a boundary or are needed for testing.
- Avoid duplicate helpers, multiple sources of truth, dead code, unused dependencies, and abandoned feature flags.
- Keep naming consistent, modules cohesive, and functions small enough to test.

## 12. Error handling and user-facing truthfulness

- Every long-running research run must reach a clear terminal state: completed, partial, failed, or cancelled.
- If a provider rate-limits or fails, show a safe, actionable message and preserve any valid partial results.
- Distinguish “no papers found,” “provider unavailable,” “PDF unavailable,” “text extraction failed,” and “no supporting evidence found.”
- Never silently convert errors into empty successful results.
- Do not present generated sample data as a user's real research data.
- Record safe internal error details with a correlation/run ID for debugging.
- Keep secrets, private paper contents, and stack traces out of client-visible errors.

## 13. Environment and deployment

- Provide `.env.example` files for each service with descriptions and placeholders, never real secrets.
- Validate required environment variables at startup and fail with safe, useful messages.
- Keep development, test, and production settings separate.
- Use pinned or bounded dependencies consistent with existing lockfiles.
- Add or update Dockerfiles/compose only if they fit the current deployment setup. Containers should run as non-root where feasible, use health checks, and avoid embedding secrets.
- Do not expose PostgreSQL, Qdrant, Ollama, Redis, or private AI-service ports publicly unless a documented secure design requires it.
- Document local setup, migrations, tests, model configuration, Qdrant setup, and production deployment.
- Make clear which features require external API keys and which can run with local models.

## 14. Implementation order

Work incrementally in this order, adapting to what is already functional:

1. Audit repository, architecture, environment, and tests.
2. Fix startup/configuration issues and establish a repeatable local run.
3. Map and secure database models, auth, authorization, and API response DTOs.
4. Complete paper discovery, ingestion, parsing, chunking, and metadata normalization.
5. Complete embedding generation and access-controlled Qdrant retrieval.
6. Complete the RAG question-answering path with citations.
7. Implement double-threshold candidate generation with reproducible scores and configuration.
8. Implement cross-paper evidence validation and citation verification.
9. Complete LangGraph run state, progress events, persistence, cancellation, and failure handling.
10. Connect the frontend to real API behavior; remove fake data and dead controls.
11. Complete paper comparison, literature-review report, and exports that are in scope.
12. Add privacy policy, retention/deletion behavior, and security hardening.
13. Add tests, fix quality gates, and update documentation.
14. Perform an end-to-end security and functionality review.

Do not start by redesigning the whole UI while the underlying data path is broken. Build and test a thin vertical slice first, then expand.

## 15. Required deliverables

When work is complete, provide:

1. A concise summary of features completed.
2. A list of files/modules created or changed.
3. A clear architecture/data-flow description matching the actual implementation.
4. Database migrations and model changes.
5. API endpoints and request/response contracts.
6. Security controls implemented and tests demonstrating them.
7. Test/lint/type-check/build results with exact commands and failures.
8. Environment setup instructions with no secrets.
9. Known limitations, external API constraints, and incomplete items.
10. Any manual steps required to run or deploy the platform.

Do not report a feature as complete if it is only partially wired. Mark it `implemented`, `partial`, `blocked`, or `not implemented` honestly.

## 16. Non-negotiable rules

- Do not destroy or overwrite working code without understanding it.
- Do not expose database rows, secrets, user documents, logs, or internal services to the frontend.
- Do not claim security guarantees that cannot be demonstrated.
- Do not fabricate papers, citations, DOIs, source passages, metrics, or test results.
- Do not make research-gap candidates appear confirmed without cross-paper evidence.
- Do not ship buttons that do nothing, fake loading/progress, or hardcoded mock output as production behavior.
- Do not add unnecessary frameworks or services just because they appear in this document.
- Do not silently send private user data to third-party AI services.
- Do not leave obvious TODOs in the primary user workflow.
- Prefer a smaller, tested, secure implementation over a large, fragile “agent swarm.”

**Final goal:** deliver a clean, secure, maintainable ResearchOS that researchers can genuinely use to discover papers, retrieve evidence, compare studies, generate candidate research gaps, validate those candidates across papers, and produce traceable literature-review reports.
