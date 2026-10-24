Loading older messages…
[Online]. Available: ye mt likho
9. References

[1] F. Bolaños, A. Salatino, F. Osborne, and E. Motta, “Artificial Intelligence for Literature Reviews: Opportunities and Challenges,” Artificial Intelligence Review, vol. 57, art. no. 259, 2024. https://doi.org/10.1007/s10462-024-10902-3

[2] C.-D. Curiac, A. Doboli, and D.-I. Curiac, “Co-Occurrence-Based Double Thresholding Method for Research Topic Identification,” Mathematics, vol. 10, no. 17, art. no. 3115, 2022. https://doi.org/10.3390/math10173115

[3] J.-L. Lieberum et al., “Large Language Models for Conducting Systematic Reviews: On the Rise, but Not Yet Ready for Use: A Scoping Review,” Journal of Clinical Epidemiology, vol. 181, art. no. 111746, 2025. https://doi.org/10.1016/j.jclinepi.2025.111746

[4] “A Systematic Literature Review of Retrieval-Augmented Generation: Techniques, Metrics, and Challenges,” Big Data and Cognitive Computing, vol. 9, no. 12, art. no. 320, 2025. https://doi.org/10.3390/bdcc9120320

[5] B. Han, T. Susnjak, and A. Mathrani, “Automating Systematic Literature Reviews with Retrieval-Augmented Generation: A Comprehensive Overview,” Applied Sciences, vol. 14, no. 19, art. no. 9103, 2024. https://doi.org/10.3390/app14199103

[6] P. Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” Advances in Neural Information Processing Systems, vol. 33, pp. 9459–9474, 2020. https://arxiv.org/abs/2005.11401

[7] N. Reimers and I. Gurevych, “Sentence-BERT: Sentence Embeddings Using Siamese BERT-Networks,” in Proceedings of EMNLP-IJCNLP, pp. 3982–3992, 2019. https://doi.org/10.18653/v1/D19-1410

[8] V. Karpukhin et al., “Dense Passage Retrieval for Open-Domain Question Answering,” in Proceedings of EMNLP, pp. 6769–6781, 2020. https://doi.org/10.18653/v1/2020.emnlp-main.550

[9] M. Arslan, H. Ghanem, S. Munawar, and C. Cruz, “A Survey on RAG with LLMs,” Procedia Computer Science, vol. 246, pp. 3781–3790, 2024. https://doi.org/10.1016/j.procs.2024.09.178

[10] N. F. Liu et al., “Lost in the Middle: How Language Models Use Long Contexts,” Transactions of the Association for Computational Linguistics, vol. 12, pp. 157–173, 2024. https://doi.org/10.1162/tacl_a_00638

[11] J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, “BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding,” in Proceedings of NAACL-HLT, vol. 1, pp. 4171–4186, 2019. https://doi.org/10.18653/v1/N19-1423

[12] A. Vaswani et al., “Attention Is All You Need,” in Advances in Neural Information Processing Systems, vol. 30, 2017. https://arxiv.org/abs/1706.03762

[13] Y. Gao et al., “Retrieval-Augmented Generation for Large Language Models: A Survey,” 2023. https://arxiv.org/abs/2312.10997

[14] F. Petroni et al., “Language Models as Knowledge Bases?” in Proceedings of EMNLP-IJCNLP, pp. 2463–2473, 2019. https://doi.org/10.18653/v1/D19-1250

[15] N. Thakur et al., “BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models,” in Advances in Neural Information Processing Systems, vol. 34, 2021. https://arxiv.org/abs/2104.08663

[16] M. J. Page et al., “The PRISMA 2020 Statement: An Updated Guideline for Reporting Systematic Reviews,” BMJ, vol. 372, n71, 2021. https://doi.org/10.1136/bmj.n71

[17] B. Kitchenham and S. Charters, Guidelines for Performing Systematic Literature Reviews in Software Engineering, EBSE Technical Report, version 2.3, 2007.

[18] C. Okoli, “A Guide to Conducting a Standalone Systematic Literature Review,” Communications of the Association for Information Systems, vol. 37, art. 43, pp. 879–910, 2015. https://doi.org/10.17705/1CAIS.03743

[19] C. Wohlin, “Guidelines for Snowballing in Systematic Literature Studies and a Replication in Software Engineering,” in Proceedings of the 18th International Conference on Evaluation and Assessment in Software Engineering, art. 38, 2014. https://doi.org/10.1145/2601248.2601268

[20] D. G. Grant and A. Booth, “A Typology of Reviews: An Analysis of 14 Review Types and Associated Methodologies,” Health Information & Libraries Journal, vol. 26, no. 2, pp. 91–108, 2009. https://doi.org/10.1111/j.1471-1842.2009.00848.x
Pasted text.txtDocument
okay now make an Instructions.md for my agent and aski it to complete my researchOs. completely define the frontend the backend and ai structure to it. wait let me give you the current architecture.
I have uploaded the current architecture. make sure it writes clean non messy code. Tell it what I want from my project. make sure my platform is secure. privacy policy, security, sql-injection proof, make sure no data in the db is directly visible in the frontend. And you already know what other things I want in my project. go ahead make me proud.

Escanor, I've created your ResearchOS Instructions.md, based on the architecture you uploaded and the requirements we've established for the project.
Instructions.md

582 lines · Complete implementation specification

Frontend, backend, AI pipeline, security, privacy, testing, and deployment.

Download Instructions.md
What's included

    Frontend: Research workbench, paper library, live execution graph, document viewer, citations, comparison tables, report generation, and responsive UI.

    Backend: Express.js API, authentication, authorization, PostgreSQL data model, request validation, background jobs, and SSE progress streaming.

    AI service: FastAPI, LangGraph, Qdrant, embeddings, PDF ingestion, RAG, Ollama, paper comparison, and literature review generation.

    Research-gap detection: Double-threshold candidate generation, cross-paper evidence validation, citation verification, and explicit uncertainty handling.

    Security: SQL injection prevention, XSS protection, IDOR prevention, secret management, rate limiting, private document storage, and prompt-injection defenses.

    Privacy: A real privacy policy, data-retention rules, deletion workflows, and transparent disclosure of third-party AI processing.

    Code quality: Modular architecture, typed contracts, migrations, automated tests, error handling, and production-readiness checks.

How to use it

    Place Instructions.md in the root of your ResearchOS repository.

    Open the repository in your coding agent.

    Give it the following prompt.

Read Instructions.md completely and treat it as the implementation specification for ResearchOS.

First inspect the entire existing repository, current architecture, Git status, environment configuration, dependencies, database schema, API routes, AI pipeline, and tests. Identify what is implemented, incomplete, broken, or mocked.

Then create a prioritized implementation checklist and execute it. Complete the project incrementally, preserving working code and existing architecture. Connect the frontend, backend, database, vector store, and AI service into a functional end-to-end workflow.

Prioritize security, data isolation, reliable RAG, double-threshold research-gap generation, cross-paper evidence validation, citation correctness, and a polished user experience.

Do not stop after creating a plan. Implement, test, and fix the actual code. Never expose raw database records or secrets to the frontend. Do not fabricate research results, citations, progress events, or successful test outcomes.

Run the available tests, linting, type checks, and production builds. At the end, report exactly what works, what changed, which security tests passed, what remains incomplete, and how to run the project locally.

Follow Instructions.md while adapting to the actual repository. Do not introduce unnecessary frameworks or rewrite working components without justification.

One important thing: The instructions explicitly tell your agent to inspect the existing code before making changes. That matters because the uploaded architecture describes the intended system, not proof that every component is already implemented. The goal is a working ResearchOS, not a beautiful architecture diagram sitting on top of broken integrations.
Instructions.mdDocument
okay what should I tell my agent now?

Bhai, don't just tell your agent to "complete the project." That's how you get 40 new files, three competing architectures, and a login page that somehow breaks RAG.

You've already given it Instructions.md. Your next instruction should make it audit the existing repository first, then implement the project in controlled phases.

Copy and paste this into your coding agent:

Read Instructions.md completely before doing anything.

You are now the lead engineer responsible for completing ResearchOS. Your job is to make the existing project functional, secure, maintainable, and ready for demonstration as a final-year engineering project.
Phase 1: Audit before coding

    Inspect the entire repository, including the frontend, Express.js backend, Python/FastAPI AI service, LangGraph workflow, PostgreSQL schema, Qdrant integration, environment configuration, and tests.

    Inspect the current Git branch and working tree. Do not overwrite, reset, discard, or commit my existing changes.

    Run the existing tests and available build/type-check commands to establish the baseline.

    Identify which features work, which are partially implemented, which are broken, and which are missing.

    Trace the actual data flow from the frontend through the backend and AI service to PostgreSQL/Qdrant and back.

    Identify security vulnerabilities, exposed secrets, missing authorization checks, mock implementations, duplicated logic, and architectural inconsistencies.

Do not modify code during this audit.

Create IMPLEMENTATION_PLAN.md containing:

    Current architecture and repository structure.

    Implemented, partial, broken, and missing features.

    Security and privacy risks ranked by severity.

    Prioritized implementation phases and dependencies.

    Existing tests and baseline failures.

    The first end-to-end workflow to complete.

After writing the plan, stop and report the findings. Do not start implementation until I review the plan.
Non-negotiable constraints

    Follow Instructions.md and the actual repository architecture.

    Preserve working code and existing APIs wherever practical.

    Reuse the existing Python virtual environment and dependencies.

    Do not replace the stack or introduce unnecessary frameworks.

    Never expose raw database records, credentials, private documents, internal prompts, or other users' data to the frontend.

    Enforce authentication and resource-level authorization on the server.

    Use parameterized database queries and validate all external inputs.

    Treat research papers as untrusted input and protect the AI workflow against prompt injection.

    Never fabricate citations, evidence, paper metadata, progress events, or successful test results.

    Do not claim a candidate research gap is confirmed without cross-paper evidence.

    Do not use mock data as real production results.

    Do not claim security is complete without relevant tests.

    Do not silently send private user data to external AI providers.

The priority is a working, secure end-to-end product, not a large collection of disconnected features.

For now, complete only Phase 1, create IMPLEMENTATION_PLAN.md, and report your findings without changing application code.
What happens after the audit?

Once your agent gives you the plan, use this implementation order:

Phase 2: Security and foundations

Authentication, authorization, data isolation, environment configuration, database migrations, and safe API responses.

Phase 3: Complete the AI pipeline

Paper discovery, PDF extraction, chunking, embeddings, Qdrant retrieval, and grounded RAG with citations.

Phase 4: Research intelligence

Double-threshold candidate generation, cross-paper evidence validation, citation verification, and literature synthesis.

Phase 5: Frontend integration

Connect the dashboard, research workbench, live progress, paper library, report viewer, and exports to real APIs.

Phase 6: Verification and release

End-to-end tests, security checks, failure handling, responsive UI, documentation, and deployment readiness.

My strongest recommendation: make the agent complete one vertical slice first: enter a research query → retrieve papers → ingest text → retrieve evidence → generate a cited answer → display it in the frontend. Once that works reliably, expand into research-gap validation and the full report workflow.

That gives you a demonstrable foundation instead of six impressive-looking modules that refuse to speak to each other.
research_report_92832750.mdDocument
researchOs does not give actual gaps. It states something else as you can see

Bhai, I can see the problem in your generated report. ResearchOS is generating keyword associations and presenting them as research gaps, even when the evidence doesn't establish a genuine gap.

For example, in your report:

    “Artificial Intelligence ↔ Retinal Diseases” is labelled SUPPORTED with an 82% validation score, but its supporting evidence merely says AI is transforming ophthalmology. That establishes an existing research area, not an unresolved research gap. 
    research_report_92832750.md

    “Retinal ↔ Neuroevolution” is labelled INCONCLUSIVE, but the cited passages discuss AI in retinal diseases generally. They do not establish a lack of benchmarks connecting retinal research and neuroevolution. 
    research_report_92832750.md

    Several candidates reuse almost identical evidence, and the report assigns numerical validation scores without showing how those percentages were calculated. 
    research_report_92832750.md

The double-threshold method can identify potentially interesting combinations of topics. It cannot, by itself, establish that a scientific problem remains unsolved. Cross-paper validation must do more than retrieve passages that mention the same keywords.
Tell your agent to fix the actual problem

Paste this into your coding agent. It focuses on the research-gap pipeline rather than redesigning your entire platform.
Critical Fix: Research Gap Detection and Cross-Paper Validation

Inspect the current ResearchOS implementation and the generated research report. The current gap-detection pipeline is producing keyword associations and presenting them as research gaps without sufficient supporting evidence.

For example, the report labels “Artificial Intelligence ↔ Retinal Diseases” as a supported research gap, although the cited evidence only establishes that AI is used in retinal disease research. Several other candidates reuse the same generic evidence, and the validation percentages are not transparently derived.

Fix the underlying methodology, not merely the wording of the report.
1. Separate candidate generation from gap validation

The double-threshold method must only generate candidate topic combinations from the corpus's keyword co-occurrence matrix.

    Apply the configured alpha and beta thresholds correctly.

    Preserve the co-occurrence score, thresholds, corpus scope, and method used.

    Label these outputs as candidate topics, not confirmed research gaps.

    Do not infer that a topic is unexplored merely because its keywords have low co-occurrence.

2. Implement genuine cross-paper evidence validation

For each candidate:

    Retrieve relevant passages from multiple distinct papers.

    Extract explicit statements about limitations, unresolved problems, failed approaches, conflicting findings, missing evaluations, and future work.

    Identify the precise unresolved problem being proposed.

    Compare the candidate against existing methods and findings to determine whether the problem has already been addressed.

    Classify each passage as supporting, contradicting, partially supporting, addressing the issue, or irrelevant.

    Require evidence from distinct papers where available. Repeated passages from one paper must not count as independent corroboration.

    Store the paper identity, exact passage, page or section where available, and the relationship between that evidence and the candidate.

    Verify that the cited text actually supports the specific claim. Keyword overlap alone is insufficient.

If the corpus contains only abstracts or insufficient full-text evidence, disclose that limitation.
3. Define meaningful validation outcomes

Use explicit statuses such as:

    SUPPORTED: Multiple relevant sources substantiate the specific unresolved issue, and the available evidence does not show it has already been resolved.

    PARTIALLY SUPPORTED: Evidence supports only part of the proposed problem or the problem needs narrowing.

    CONTRADICTED_OR_ALREADY_ADDRESSED: Relevant literature contradicts the claim or demonstrates that the proposed problem has already been addressed.

    INCONCLUSIVE: Available evidence is insufficient to determine whether the problem remains unresolved.

Do not interpret SUPPORTED as proof that no other publication has solved the problem. Explain the scope of the searched corpus.
4. Fix validation scores

Audit how the current 50%, 62%, and 82% scores are generated.

    Remove arbitrary or hardcoded percentages.

    Do not treat an LLM's self-reported confidence as empirical validation.

    If a numerical score is retained, define its components, calculation, calibration status, and limitations.

    Keep evidence sufficiency and validation status separate from any ranking score.

    If no defensible scoring method exists, show the validation status and evidence coverage without a percentage.

5. Eliminate generic and duplicate gaps

    Deduplicate semantically equivalent candidates.

    Reject vague combinations such as “Retinal ↔ Detecting” unless they can be converted into a specific, evidence-supported unresolved problem.

    Do not reuse generic passages as support for unrelated claims.

    Require a candidate to state what is unresolved, in which setting, and what existing evidence demonstrates the issue.

    If no defensible research gap can be established, return “No sufficiently supported gap identified in the current corpus” rather than inventing one.

6. Improve the report

For each candidate, show:

    Specific unresolved problem.

    Why the problem appears unresolved.

    Supporting evidence from distinct papers.

    Contradicting or already-addressed evidence.

    Exact citations and page/section references when available.

    Validation status and a transparent explanation.

    Corpus limitations and missing evidence.

Keep paper summaries, general research challenges, and candidate topic combinations separate from validated gap findings.
7. Test the correction

Create tests covering:

    Generic background statements incorrectly classified as gaps.

    Multiple papers mentioning the same topic without identifying an unresolved problem.

    Genuine limitations and future-work statements.

    Contradictory findings across papers.

    A candidate already addressed by existing literature.

    Duplicate candidates and repeated evidence.

    Missing full text, insufficient evidence, and fabricated citations.

    Scores that cannot be reproduced from the documented calculation.

Run the relevant tests and regenerate the example report. Compare the old and new results, explaining which false positives were eliminated and why.

First inspect the current code and trace the exact source of these failures. Then implement the fix within the existing architecture. Do not rewrite unrelated parts of ResearchOS or claim the issue is resolved until the tests and regenerated report demonstrate the improvement.
What success should look like

Instead of reporting:

    Research gap: AI ↔ Retinal Diseases. Validation: 82%.

ResearchOS should produce something like:

    Candidate problem: The general use of AI for retinal disease diagnosis is already well established. The current evidence does not identify a specific unresolved problem at this broad level. More focused analysis of reported limitations, external validation results, and future-work statements is required before a research gap can be supported.

That example is deliberately cautious, not a claim that this is the final research gap.

The key change: ResearchOS must be able to reject its own candidate. If every keyword combination becomes a “gap,” the validation pipeline is just a gap-shaped text generator.
Its still giving the same report and gaps and findings. I also want it to search for as low as 1 paper then 5, 10, 15, 20 for the MVP. Make a complete robust architecture.md and really tell what and how I want the gaps to the agent. Also real time is fucked so bad. remove the ask assistant section for now

I've created the complete Architecture.md specification.
Architecture.md

387 lines · Detailed implementation specification

Research-gap methodology, paper-count controls, AI architecture, real-time reliability, and removal of Ask Assistant.

Download Architecture.md
What this specification tells your agent to do

    Fix the repeated report at its source. Investigate stale reports, hardcoded outputs, caching, fallback responses, and frontend state rather than just changing prompts.

    Support 1, 5, 10, 15, and 20 papers throughout discovery, processing, validation, and reporting.

    Separate double-threshold candidate generation from actual gap validation. Generic keyword associations must not be presented as research gaps.

    Validate across papers: extract limitations and future work, retrieve evidence both for and against candidates, check prior work, and verify citations.

    Remove unjustified validation percentages such as 82% unless there is a defensible, documented calculation.

    Stabilize real-time progress, or temporarily replace it with reliable status polling.

    Remove Ask Assistant from the visible MVP without breaking shared RAG functionality.

Give your agent this instruction first

Read both Instructions.md and Architecture.md completely.

Start by auditing the existing repository and reproducing the current incorrect research report. Do not begin by rewriting the UI or generating more documentation.

Create IMPLEMENTATION_PLAN.md with the root cause of the repeated report, the exact affected files and functions, the current paper-discovery flow, the gap-generation and validation flow, the real-time implementation, and the dependencies involved in removing Ask Assistant.

Then implement the fixes in the order specified in Architecture.md. Preserve my existing work and inspect the actual code before modifying it.

The paper-count selector must support 1, 5, 10, 15, and 20 papers end to end. Research-gap candidates must be challenged against evidence from distinct papers. Generic keyword associations must not be labelled as validated gaps. Remove unsupported percentages, fix stale-result handling, and remove Ask Assistant from the visible MVP.

After implementation, rerun the same retinal-image research query that produced the faulty report. Compare the old and new outputs, run the available tests and builds, and report the actual results. Do not claim completion unless the regenerated report demonstrates that the underlying problem has been addressed.

Do not stop after writing the plan. Audit first, then implement and verify the changes.

One important distinction: your paper-count selector controls how many papers ResearchOS examines, but a larger count does not automatically prove a research gap exists. The quality of the evidence and the system's ability to challenge its own conclusions matter far more than producing 20 papers and a list of impressive-looking percentages.
Architecture.mdDocument
ResearchOS Architecture and Implementation Specification

Purpose: This is the authoritative product and engineering
specification for ResearchOS. Read it alongside Instructions.md.
Inspect the current repository before changing code; do not assume the
architecture diagram reflects working implementation.
1. Product goal

ResearchOS discovers academic papers, organizes their evidence, compares
studies, and helps researchers investigate potential research gaps. Its
value is not merely generating summaries or connecting keywords. It must
show what is known, what remains unresolved, what evidence supports
that interpretation, and how strong that evidence is.

Core rule: A topic combination is not a research gap. Keyword
co-occurrence, generic background statements, and plausible LLM output
do not prove that a problem remains unresolved. It is acceptable to
report that the available corpus is insufficient. Do not invent a gap to
make the report look complete.
2. Immediate failures observed

The current report demonstrates these problems:

    "Artificial Intelligence ↔ Retinal Diseases" is labelled as a gap
    even though the cited text only says AI is used in retinal research.
    "Retinal ↔ Neuroevolution" is supported by generic retinal-AI
    passages that do not establish a missing connection.
    The same generic evidence is reused for many unrelated candidates.
    Scores such as 50%, 62%, and 82% are shown without a reproducible
    calculation.
    The report claims cross-paper validation without evidence that
    directly addresses the alleged unresolved problem.
    After prior instructions to fix gap validation, the same report
    still appears. The cause may be hardcoded output, stale persisted
    reports, bad cache keys, fallback templates, mock data, an unchanged
    code path, or frontend state not refreshing. Trace it instead of
    guessing.

3. Audit before implementation

Inspect the repository and trace the full path from user query to report
display. Locate:

    Research-run API, selected paper count, academic source clients,
    pagination and deduplication.
    Full-text/PDF retrieval, extraction, chunking, embeddings, Qdrant
    retrieval and metadata.
    Keyword extraction, co-occurrence matrix, alpha/beta thresholding
    and candidate ranking.
    Cross-paper evidence retrieval, validation prompts, LangGraph
    nodes/state and conditional edges.
    Citation verification, report synthesis, persistence, report
    retrieval, frontend rendering and cache.
    Mock/sample data, fallback templates, hardcoded report sections, old
    report records and cache keys.
    Real-time implementation (SSE, WebSockets, polling, timers) and all
    "Ask Assistant" UI/routes.
    Tests, configuration, Git status and current uncommitted work.

Reproduce the same retinal-image query that generated the incorrect
report. Use a run ID to trace every stage. Determine whether the exact
old content comes from generation, persistence, cache, fallback or UI.
Do not overwrite user changes, reset Git, or replace working code.

Create IMPLEMENTATION_PLAN.md with the root-cause findings, affected
modules, security risks, prioritized fixes and baseline test results.
Preserve the existing stack unless inspection shows a concrete reason to
change it.
4. Main workflow

    User enters a topic/research question.
    User chooses a paper target: 1, 5, 10, 15, or 20.
    Search configured academic sources and report unique papers actually
    found.
    Show metadata and whether each source has full text, abstract only,
    or unavailable content.
    Ingest available content, preserving paper/page/section provenance.
    Extract methods, datasets, findings, limitations, conflicting
    results and future-work statements.
    Apply double-threshold analysis to generate candidate topic
    combinations.
    Retrieve evidence both supporting and challenging each candidate.
    Compare evidence across distinct papers and check whether existing
    work already addresses the issue.
    Verify each citation against the actual source passage.
    Generate a report separating paper findings, candidate topics,
    validation results, evidence and limitations.

5. Paper-count MVP: 1, 5, 10, 15, 20
UI and API

Provide a clear selector with exactly these values: 1, 5, 10,
15, 20. A default of 5 is acceptable unless current product behavior
specifies another default.

Pass a validated integer field such as paper_limit through the
frontend, backend, discovery service, processing workflow and report.
Accept only those five values. Persist both the requested limit and
actual unique paper count.

The selected number means the maximum number of unique, relevant
papers, not raw search results and not a promise that every paper has
downloadable full text.
Discovery behavior

    Use the existing supported academic APIs and respect their terms,
    quotas and rate limits.
    Deduplicate using DOI, arXiv ID and reliable normalized
    title/author/year matching.
    Paginate until the requested unique count is reached, the bounded
    search budget is exhausted, or providers cannot return more results.
    Do not pad with irrelevant papers.
    Do not loop indefinitely or retry rate-limited APIs without bounds.
    For a provider 429/error, preserve valid partial results and report
    a provider-limited result. Do not claim "no papers found" if the
    provider failed.
    Distinguish metadata-only, abstract-only, full-text available,
    extraction failed and ingestion complete.
    With one paper, allow individual paper analysis, but mark
    cross-paper validation single_paper_observation or inconclusive.
    One paper cannot independently establish cross-paper corroboration.
    If fewer than the requested count are found, report the actual count
    and reason.

Run identity and stale results

Each run needs a unique ID and persisted configuration: normalized
query, filters, paper limit, sources, actual paper IDs, model/provider,
prompt/workflow version, threshold configuration and timestamps.

Cache keys must include all result-affecting settings. A new run must
not silently return an old report. History should open previous runs
explicitly, separate from starting a new one. Invalidate or version
stale cached reports after pipeline changes. Do not disguise failures as
successful fallback output.
6. What a research gap means

A research gap is a specific, evidence-supported unresolved research
problem or limitation in the examined literature. It is not a broad
topic, a missing keyword pair, or a generic statement that more work is
needed.

A defensible candidate should state:

    Unresolved issue: What exact question, capability, limitation,
    or conflict remains unresolved?
    Context: Which task, disease, population, data modality,
    setting, model class or evaluation condition?
    Existing evidence: Which studies establish that this is a real
    issue?
    Evidence of incompleteness: What is explicitly missing, limited,
    untested, inconsistent or left for future work?
    Prior-work check: Does another paper already address it?
    Scope boundary: What was searched and what cannot be concluded
    from this corpus?

Invalid examples

These are not gaps on their own:

    "AI ↔ Retinal Diseases."
    "Retinal ↔ Detecting."
    "Lack of unified empirical benchmarks" when no cited evidence or
    comparison supports the claim.
    "No research exists on X" based only on a small/incomplete search.
    A background statement about the importance of early diagnosis.
    A future-work statement copied from one old paper without checking
    later work.

A narrower statement such as "External validation across independent
clinical sites and imaging devices remains limited for the specific task
examined in these studies" is better only if the actual evidence
supports it. It is an illustration, not a finding about the current
retinal corpus.
Evidence hierarchy

Prioritize: 1. Explicit limitations, future work and unresolved
questions. 2. Discussion/results describing failures, inconsistent
findings or restricted evaluation. 3. Methods/evaluation demonstrating a
concrete coverage limitation. 4. Abstract-only evidence, clearly
labelled as limited. 5. Introduction/background statements, which
provide context but cannot independently establish a gap.

Never invent what authors "admit" or "conclude."
7. Double-threshold method

Use double thresholding as a candidate-generation baseline only, not
as gap confirmation.

For normalized co-occurrence M(i,j) and configured thresholds alpha
and beta:

    M(i,j) < alpha: association too weak under the method; exclude
    from candidate set.
    alpha <= M(i,j) <= beta: retain as a potential topic-combination
    candidate.
    M(i,j) > beta: frequent association under the method; deprioritize
    as a novelty candidate.

Document term extraction/normalization, corpus scope, co-occurrence
denominator, threshold values, candidate ranking and any simplification
of the published method. Do not hardcode example thresholds as universal
constants. Handle synonyms and spelling variants carefully. Keep the
matrix and scores for auditability. State that novelty is
corpus-relative, not proof of global novelty. The UI must call these
candidate topic combinations until validation finishes.
8. Required cross-paper validation pipeline
A. Normalize the candidate

Convert the topic pair into a narrow, testable unresolved-issue
statement. Preserve the original topic pair separately. Reject vague
candidates if making them specific would require invented assumptions.
B. Retrieve evidence for and against

Search distinct papers for the same task/context, explicit limitations,
future work, conflicting results, relevant evaluation conditions, and
work that may already solve the issue. Use lexical and semantic
retrieval as available. Reranking is optional and should be added only
if useful. Deduplicate chunks and preserve source metadata.
C. Extract structured evidence

For every evidence item store: - Paper ID and verified bibliographic
metadata. - Exact passage, page and section if available. - Evidence
type: limitation, future work, result, method, contradiction, prior
solution or background. - Relation: supports, partially_supports,
contradicts, already_addressed, irrelevant. - Brief
passage-grounded rationale and verification status.

Never invent quotations or page numbers. If page information is absent,
say so.
D. Compare across papers

Check whether distinct studies establish the same specific issue,
whether their contexts are comparable, whether a later paper addresses
an earlier limitation, and whether contradictory results change the
interpretation. Do not count mentions as votes. Three papers
mentioning AI in retinal imaging do not establish a gap about
neuroevolution.

Evidence from one paper may be presented as a single-paper observation
but cannot be called cross-paper validated. Repeated passages or
duplicate records from one study are not independent corroboration.
E. Challenge the candidate

Actively search for evidence that would disprove the proposed gap. If
existing work addresses it, mark already_addressed_or_contradicted, or
narrow the claim only if the evidence supports a narrower remaining
issue. If the corpus is incomplete, qualify the conclusion.
F. Verify citations

Check that the paper belongs to this run, the passage belongs to that
paper, and the passage actually supports the associated claim. Remove or
flag unsupported citations. Do not silently substitute a different
source.
G. Outcome statuses

Use: - supported_within_corpus: multiple distinct relevant sources
support a specific unresolved issue, with no retrieved evidence directly
showing it is resolved. - partially_supported: only a narrower claim
is supported. - already_addressed_or_contradicted: evidence shows
prior work addresses the issue or contradicts the claim. -
inconclusive: evidence is weak, generic, unavailable or conflicting. -
single_paper_observation: potentially useful issue found in one paper,
without cross-paper corroboration.

Never imply global proof. Say "supported within the examined corpus,"
not "confirmed gap in all research."
H. Scores

Remove arbitrary validation percentages such as 50%, 62% or 82%.
Retrieval similarity is not gap validity, and an LLM's self-reported
confidence is not empirical validation. If a numerical score is
retained, document a deterministic formula, components, interpretation
and limitations. Otherwise show status, distinct relevant paper count,
evidence coverage, counterevidence and limitations without a percentage.
I. No forced gaps

Do not generate a fixed number of gaps to fill the report. Return zero,
one or several candidates depending on evidence. If no candidate is
defensible, state: "No sufficiently supported research gap was
identified in the current corpus." That is a valid result.
9. Report structure

    Run summary: query, requested limit, actual unique papers, sources,
    full-text coverage, run status and limitations.
    Executive synthesis grounded in this run.
    Paper-by-paper summaries with verified metadata.
    Comparison matrix: task, methods, datasets, metrics, findings,
    limitations and future work; use "not reported" instead of guessing.
    Double-threshold candidate combinations, scores and thresholds,
    clearly labelled candidates.
    Cross-paper validation: specific issue, distinct-paper evidence,
    counterevidence/prior work, status and rationale.
    Evidence traceability: exact passage, paper, page/section where
    available.
    Corpus/search limitations, source failures, and missing full-text
    details.
    References generated from verified metadata only.

Do not reuse the same generic evidence across unrelated candidates. A
report may legitimately contain zero validated gaps.
10. Target AI architecture

Adapt this to the existing codebase; do not create duplicate modules
just to match names.
ai/app/
  main.py
  api/routes/
    discovery.py
    ingestion.py
    research_runs.py
    reports.py
    evidence.py
  config/settings.py
  schemas/
    requests.py
    responses.py
    run_state.py
    evidence.py
    gap_candidate.py
  services/
    discovery_service.py
    metadata_service.py
    ingestion_service.py
    retrieval_service.py
    paper_analysis_service.py
    cooccurrence_service.py
    gap_candidate_service.py
    cross_paper_validation_service.py
    citation_verification_service.py
    report_service.py
  rag/
    chunking.py
    embeddings.py
    retrieval.py
    prompts.py
  graph/
    state.py
    workflow.py
    nodes/
      validate_request.py
      discover_papers.py
      deduplicate_papers.py
      ingest_papers.py
      extract_evidence.py
      build_cooccurrence_matrix.py
      generate_candidates.py
      retrieve_cross_paper_evidence.py
      challenge_candidate.py
      classify_candidate.py
      verify_citations.py
      synthesize_report.py
  vectordb/
    qdrant_client.py
    repositories.py
  integrations/
    arxiv_client.py
    semantic_scholar_client.py
    openalex_client.py
    ollama_client.py
  tests/

This is a responsibility map, not a requirement to duplicate existing
files. Keep FastAPI as the internal AI service and Express.js as the
browser-facing application API if that matches the repository.
PostgreSQL stores relational data; Qdrant stores embeddings and scoped
chunk metadata. The browser must never connect directly to PostgreSQL,
Qdrant, Ollama or private AI endpoints.

Workflow:
Validate query + paper limit
 -> Discover papers
 -> Normalize and deduplicate
 -> Retrieve full text/abstracts
 -> Ingest, chunk and index
 -> Extract per-paper evidence
 -> Build co-occurrence matrix
 -> Generate candidate combinations
 -> Retrieve evidence for and against candidates
 -> Challenge candidate against prior work
 -> Verify citations
 -> Classify outcome
 -> Synthesize report and limitations
 -> Persist run/report

Use typed state, bounded iterations, timeouts, retries with limits and
explicit failure edges. Avoid a multi-agent swarm unless tests show a
clear benefit. Keep LLM calls scoped and outputs schema-validated.
11. Real-time: stabilize or simplify

Real-time progress is currently unreliable. Inspect whether the project
uses SSE, WebSockets, polling, timers or multiple mechanisms. Trace
failures before modifying it.

MVP requirements: - Persist run states: queued, running,
completed, partial, failed, cancelled. - Derive progress from
actual backend/graph transitions, never frontend timers or fabricated
percentages. - Scope every event to a run and authorized user. - Persist
terminal state even if the browser disconnects. - On refresh/reconnect,
fetch the authoritative current run state. - Prevent duplicate runs from
double clicks, retries and re-renders. - Show partial results and
provider failures truthfully. - Use bounded timeouts and cancellation
where practical.

Prefer the simplest reliable option. If SSE already fits one-way
updates, fix it rather than layering WebSockets on top. If streaming
cannot be stabilized for the MVP, temporarily replace it with a status
endpoint and bounded polling. Do not ship a broken real-time experience
for the sake of the label.

If using SSE, verify correct headers/proxy buffering, heartbeats,
disconnect cleanup, reconnection or state re-fetch, event IDs where
needed, no leaked timers/listeners, authorization before streaming,
small typed payloads and recovery after backend restart.
12. Remove "Ask Assistant" from the MVP

Remove the visible Ask Assistant feature from navigation, sidebar,
dashboard, workspace tabs, report pages, mobile menus, buttons, chat
panels and related empty/loading/error states.

Remove exclusive frontend state and client calls if safe. Do not
delete shared RAG/retrieval code used by the research workflow.
Inspect dependencies before removing backend routes, database tables or
migrations. If the backend feature shares infrastructure, hide the entry
point and document the retained dependency. Ensure no dead route, menu
item or blank layout remains. Add a UI test proving the feature is not
exposed.
13. Frontend behavior

Use the existing Next.js 14/TypeScript/Tailwind architecture where
present. Main pages: - Dashboard with new research, recent runs and
reports. - New research page with query and paper-count selector. - Run
detail with real stage, actual paper count, errors and retry where
supported. - Paper library with metadata and content-availability
state. - Report viewer with readable summaries, comparisons, candidate
topics, validation evidence, citations and limitations. - History for
explicitly opening old runs. - Truthful privacy/settings pages where
applicable.

No fake outputs, fake progress, dead buttons or successful states for
failed runs. Clearly distinguish "no results," "provider unavailable,"
"abstract only," "PDF extraction failed," and "insufficient evidence."
Render Markdown safely, sanitize unsafe HTML/links, and keep the layout
responsive, accessible and spacious.
14. Security and privacy

    Validate all inputs; use parameterized SQL or safe ORM methods.
    Enforce authentication and resource ownership on every read, write,
    export and stream.
    Never return raw database records; use explicit response DTOs.
    Do not expose tokens, password hashes, provider keys, internal
    prompts, filesystem paths, stack traces or other users' data.
    Treat paper content as untrusted input and defend against prompt
    injection.
    Validate model output against schemas; never execute generated
    SQL/code.
    Keep private files and Qdrant payloads private and filter retrieval
    by authorized user/workspace.
    Disclose external AI processing and do not silently send private
    papers to external providers.
    Document retention and deletion. Deletion should account for
    database records, vectors, files and derived reports where
    supported.
    Do not claim absolute security; demonstrate controls with tests.

15. Acceptance tests
Paper counts

    Limit 1 works and does not claim cross-paper validation.
    Limits 5/10/15/20 flow through UI, API, discovery, processing and
    report.
    Duplicates do not count; fewer results are reported honestly.
    Invalid counts are rejected.
    Provider 429 is not represented as a successful empty search.

Gap quality

    Generic background passages cannot independently validate a gap.
    Co-occurrence only creates candidates.
    Vague candidates are rejected or inconclusive.
    Duplicate chunks/papers do not count as independent evidence.
    Unrelated candidates do not reuse generic support passages.
    Prior work changes the classification.
    Weak or missing evidence results in inconclusive status.
    No arbitrary percentages appear.
    Citations map to real passages from the correct paper.
    Zero validated gaps is accepted.

Real-time and stale data

    Progress matches real backend transitions.
    Refresh/reconnect returns the same run's authoritative state.
    Duplicate submissions are prevented or idempotent.
    Failures reach terminal states.
    A different query, paper limit or pipeline version cannot return
    stale output as a new run.
    Cross-user run/stream access is denied.

Ask Assistant

    No visible entry, CTA or page remains.
    Shared RAG/report features still work.

Also test SQL injection, XSS/safe Markdown, cross-user IDOR, prompt
injection, malformed model output, citation integrity, provider failure,
Qdrant/Ollama unavailable, lint, type-check and production build. Run
actual commands and report their outputs. Separate pre-existing failures
from regressions.
16. Implementation order

    Reproduce the stale/incorrect report and trace its actual source.
    Fix run identity, persistence, cache keys, hardcoded/fallback output
    and frontend refresh as applicable.
    Implement the 1/5/10/15/20 paper limit end to end.
    Separate double-threshold candidate generation from validation.
    Implement evidence retrieval for and against, prior-work challenge
    and citation verification.
    Remove unjustified percentages.
    Stabilize real-time or replace it temporarily with reliable polling.
    Remove Ask Assistant from the visible MVP without breaking shared
    RAG.
    Update report rendering and truthful error/coverage states.
    Run tests, security checks and regenerate the same retinal query
    report for before/after comparison.

17. Required final report from the coding agent

Report: - Root cause of the repeated old report. - Files changed and
why. - Proof that 1/5/10/15/20 limits work end to end. - How candidate
generation differs from evidence validation. - How supporting and
contradicting evidence is retrieved and checked. - What happened to
validation scores. - Which real-time mechanism remains and why. -
Confirmation that Ask Assistant is absent from the visible MVP. - Exact
test/build commands and results. - Remaining limitations, including
corpus scope and full-text availability.

Do not declare success because the code compiles. Regenerate the same
retinal-image report that previously produced generic false gaps and
compare the output. If the evidence does not justify a gap, the correct
result is inconclusive or no sufficiently supported gap, not a
fabricated conclusion.


⋮⋮
⋮⋮
⋮⋮
⋮⋮
⋮⋮
⋮⋮
⋮⋮
⋮⋮
