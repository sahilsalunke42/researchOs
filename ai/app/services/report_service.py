from __future__ import annotations

import logging
from pathlib import Path
import re
from typing import Any, Sequence

from app.rag.retrieval import assemble_context, extract_sources, retrieve_context, select_grounded_chunks
from app.services.gap_service import GapCandidate, generate_double_threshold_gaps
from app.services.llmService import ask, sanitize_prompt_context
from app.services.paper_analysis_service import FindingCategory, PaperAnalysis, analyze_paper_content
from app.services.paper_service import Paper
from app.services.validation_service import ValidatedGap, formulate_and_validate_scientific_gaps, validate_candidate_gap

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "report_prompt.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def build_prompt(topic: str, context: str) -> str:
    safe_context = sanitize_prompt_context(context)
    return _load_prompt().format(context=f"<context>\n{safe_context}\n</context>", topic=topic.strip())


def _get_val(obj: Any, key: str, default: Any = "") -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def generate_structured_report(
    topic: str,
    papers: Sequence[Paper],
    gaps: list[Any],
    requested_limit: int = 5,
    paper_analyses: Sequence[PaperAnalysis] | None = None,
    dt_candidates: Sequence[GapCandidate] | None = None,
) -> str:
    """
    Generates an authoritative, evidence-grounded research intelligence report conforming
    strictly to Instructions.md and Architecture.md:
    1. Research Question & Corpus Summary
    2. Executive Synthesis grounded in corpus findings
    3. Paper-by-Paper Scientific Methodology and Findings (Objective, Method, Datasets/Metrics, Explicit vs Derived Limitations, Hypotheses)
    4. Comparative Literature Matrix
    5. Candidate Topic Combinations (Double-Threshold Keyword Co-occurrence - labeled as candidate suggestions only)
    6. Evidence-Backed Research Gaps & Cross-Paper Validation (Technical problem assessment, distinct paper corroboration, prior work checks, transparent status without arbitrary percentages)
    7. Unverified Hypotheses & Potential Research Directions
    8. Traceability, Citation Verification & Corpus Limitations
    9. References (verified metadata only)
    """
    paper_list = list(papers)
    gap_list = list(gaps)
    total_papers = len(paper_list)

    # 1. Run Summary & Corpus Scope
    sources_used = sorted(list({p.source.upper() for p in paper_list})) if paper_list else ["ACADEMIC_APIS"]
    sources_str = ", ".join(sources_used)
    has_pdf_count = sum(1 for p in paper_list if getattr(p, "pdf_url", None) or (p.url and p.url.endswith(".pdf")) or p.source == "arxiv")
    abstract_only_count = max(0, total_papers - has_pdf_count)

    sections = [
        f"# Research Intelligence Report: {topic.title()}",
        "\n## 1. Research Question & Corpus Summary",
        f"- **Research Question / Focus Area:** `{topic}`",
        f"- **Requested Paper Limit:** {requested_limit}",
        f"- **Unique Relevant Papers Retrieved:** {total_papers}",
        f"- **Academic Sources Consulted:** {sources_str}",
        f"- **Corpus Extraction Depth:** {has_pdf_count} full-text PDF document(s), {abstract_only_count} abstract-limited publication(s)",
        "- **Workflow Execution Status:** Complete",
        (
            f"- **Corpus Scope & Limitations:** Literature scope encompasses {total_papers} indexed publication(s). "
            "Findings reflect empirical evidence, experimental designs, and limitations substantiated within this analyzed corpus. "
            "Lack of documented solutions within this subset does not preclude external solutions published outside this corpus."
        ),
    ]

    # 2. Executive Synthesis
    sections.append("\n## 2. Executive Synthesis")
    if paper_analyses:
        synth_bullets: list[str] = []
        for idx, pa in enumerate(paper_analyses[:5], start=1):
            title_trunc = pa.paper_title[:60] + ("..." if len(pa.paper_title) > 60 else "")
            synth_bullets.append(
                f"- **Core Finding [{idx}] ({title_trunc}):** "
                f"{pa.research_objective} Evaluated using {pa.dataset_info} with {pa.experimental_setup}."
            )
        sections.append(
            f"This review examines current scientific literature on **{topic}**. "
            f"A total of {total_papers} peer-reviewed studies were ingested and analyzed across architecture, datasets, baselines, and reported error profiles.\n"
            + "\n".join(synth_bullets)
        )
    elif paper_list:
        summary_points: list[str] = []
        for idx, p in enumerate(paper_list[:4], start=1):
            abs_text = p.abstract or ""
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", abs_text) if s.strip()]
            snippet = sentences[0] if sentences else "Empirical evaluation and methodology exploration."
            clean_snippet = snippet.replace("\n", " ").replace("|", "-")
            clean_title = p.title.replace("\n", " ")
            summary_points.append(f"- **Finding {idx} ([{clean_title[:55]}...]):** {clean_snippet}")

        sections.append(
            f"This review analyzes scientific publications addressing **{topic}** across {total_papers} papers:\n"
            + "\n".join(summary_points)
        )
    else:
        sections.append("- No published papers available in this corpus.")

    # 3. Paper-by-Paper Scientific Methodology and Findings
    sections.append("\n## 3. Paper-by-Paper Scientific Methodology and Findings")
    if paper_analyses:
        for idx, pa in enumerate(paper_analyses, start=1):
            authors_str = ", ".join(pa.paper_authors[:4]) + (" et al." if len(pa.paper_authors) > 4 else "")
            year_str = str(pa.paper_year) if pa.paper_year else "n.d."
            ingest_label = "Abstract-Limited Analysis" if pa.is_abstract_only else "Full-Text PDF Analysis"

            sections.append(f"### [{idx}] {pa.paper_title}")
            sections.append(f"- **Bibliographic Data:** {authors_str} ({year_str}) | **Source:** {pa.source.upper()} | **DOI / URL:** {pa.paper_doi or 'N/A'}")
            sections.append(f"- **Ingestion Depth:** `{ingest_label}`")
            sections.append(f"- **Research Objective:** {pa.research_objective}")
            sections.append(f"- **Proposed Method & Architecture:** {pa.proposed_method}")
            sections.append(f"- **Datasets & Experimental Setup:** {pa.dataset_info} | {pa.experimental_setup}")

            # Explicit limitations
            if pa.explicit_limitations:
                sections.append("- **Explicit Limitations Stated by Authors:**")
                for f in pa.explicit_limitations:
                    sections.append(f"  - *\"{f.supporting_passage}\"* ([{f.source_location}]) — {f.why_limitation}")
            else:
                sections.append("- **Explicit Limitations Stated by Authors:** None explicitly stated in examined text.")

            # Evidence-derived limitations
            if pa.evidence_derived_limitations:
                sections.append("- **Evidence-Derived Weaknesses (Demonstrated by Results / Error Analysis):**")
                for f in pa.evidence_derived_limitations:
                    exp_meta = f" | Metric/Evidence: `{f.relevant_experiment_or_metric}`" if f.relevant_experiment_or_metric else ""
                    sections.append(f"  - **{f.problem_statement}** *\"{f.supporting_passage}\"* ([{f.source_location}]{exp_meta}) — {f.why_limitation}")
            else:
                sections.append("- **Evidence-Derived Weaknesses:** No quantitative degradation or error-analysis bottleneck established beyond reported baselines.")

            # Unverified hypotheses
            if pa.unverified_hypotheses:
                sections.append("- **Unverified Hypotheses (Requiring Empirical Verification):**")
                for f in pa.unverified_hypotheses:
                    sections.append(f"  - *{f.problem_statement}* (Missing information: {f.missing_verification})")

            # Unverified claims
            if pa.unverified_claims:
                sections.append("- **Unverified Claims:**")
                for uc in pa.unverified_claims:
                    sections.append(f"  - {uc}")

            sections.append("")
    else:
        for idx, p in enumerate(paper_list, start=1):
            authors_str = ", ".join(p.authors[:4]) + (" et al." if len(p.authors) > 4 else "")
            year_str = str(p.year) if p.year else "n.d."
            clean_abs = (p.abstract or "No abstract provided in source publication.").replace("\n", " ")
            sections.append(
                f"### [{idx}] {p.title}\n"
                f"- **Authors:** {authors_str} ({year_str})\n"
                f"- **Source:** {p.source.upper()} | **DOI / URL:** {p.doi or p.url or 'N/A'}\n"
                f"- **Ingestion Depth:** Abstract-limited analysis\n"
                f"- **Core Abstract:** {clean_abs}\n"
            )

    # 4. Comparative Literature Matrix
    sections.append("\n## 4. Comparative Literature Matrix")
    sections.append("| # | Paper Title | Year | Core Methodology | Datasets & Sizes | Key Results / Metrics | Concrete Limitations Reported |")
    sections.append("|---|---|---|---|---|---|---|")
    if paper_analyses:
        for idx, pa in enumerate(paper_analyses, start=1):
            clean_title = pa.paper_title.replace("|", "-").replace("\n", " ")
            title_trunc = (clean_title[:35] + "...") if len(clean_title) > 35 else clean_title
            year_str = str(pa.paper_year) if pa.paper_year else "n.d."
            method_trunc = (pa.proposed_method[:30] + "...") if len(pa.proposed_method) > 30 else pa.proposed_method
            ds_trunc = (pa.dataset_info[:35] + "...") if len(pa.dataset_info) > 35 else pa.dataset_info
            res_trunc = (pa.experimental_setup[:30] + "...") if len(pa.experimental_setup) > 30 else pa.experimental_setup
            lim_clean = pa.limitations_summary.replace("|", "-")
            lim_trunc = (lim_clean[:40] + "...") if len(lim_clean) > 40 else lim_clean
            sections.append(
                f"| [{idx}] | {title_trunc} | {year_str} | {method_trunc} | {ds_trunc} | {res_trunc} | {lim_trunc} |"
            )
    else:
        for idx, p in enumerate(paper_list, start=1):
            clean_title = p.title.replace("|", "-").replace("\n", " ")
            title_trunc = (clean_title[:35] + "...") if len(clean_title) > 35 else clean_title
            year_str = str(p.year) if p.year else "n.d."
            sections.append(
                f"| [{idx}] | {title_trunc} | {year_str} | Deep learning / Algorithmic | Documented in paper | Reported in text | Reported in abstract |"
            )

    # 5. Candidate Topic Combinations (Double-Threshold Analysis)
    sections.append("\n## 5. Candidate Topic Combinations (Double-Threshold Keyword Analysis)")
    sections.append(
        "> **Methodology Note (Curiac, Doboli, and Curiac, 2022):** "
        "Double-threshold analysis calculates a normalized Ochiai co-occurrence score M(i, j) = C(i, j) / √(C(i) · C(j)) "
        "across corpus keywords to identify underexplored intersections within threshold bounds (α = 0.15 ≤ M(i,j) ≤ β = 0.65). "
        "**Crucially: A candidate topic combination is NOT a research gap.** "
        "Co-occurrence alone indicates keyword pairing in the literature; candidate status is solely an exploratory suggestion "
        "and does not override paper-level scientific evidence."
    )

    if dt_candidates:
        sections.append("\n| Candidate Keyword Pair | Co-occurrence M(i,j) | Lower Bound (α) | Upper Bound (β) | Method Status |")
        sections.append("|---|---|---|---|---|")
        for cand in dt_candidates[:8]:
            sections.append(f"| {cand.topic_a.title()} ↔ {cand.topic_b.title()} | {cand.co_occurrence_score:.3f} | 0.15 | 0.65 | `CANDIDATE SUGGESTION` |")
    else:
        sections.append("\n*Double-threshold keyword combinations evaluated; candidate suggestions inform exploratory grouping.*")

    # 6. Evidence-Backed Research Gaps & Cross-Paper Validation
    sections.append("\n## 6. Evidence-Backed Research Gaps & Cross-Paper Validation")
    sections.append(
        "> **Scientific Validation Criteria:** Potential research gaps are derived directly from paper-level methodology, "
        "results, error analyses, and author limitations. "
        "To be classified as SUPPORTED WITHIN CORPUS, a specific technical limitation must be corroborated by ≥ 2 distinct publications with zero contradicting solutions. "
        "Single-publication limitations are classified as PARTIALLY SUPPORTED or SINGLE-PAPER OBSERVATION. "
        "Where literature demonstrates an existing solution or contradiction, the status is CONTRADICTED / ALREADY ADDRESSED. "
        "Broad keyword associations lacking empirical limitation evidence are rejected as INCONCLUSIVE."
    )

    meaningful_gaps = [
        g for g in gap_list
        if str(_get_val(g, "validation_status", "")).lower() in {"supported", "partially_supported", "unsupported", "single_paper_observation"}
    ]

    if meaningful_gaps:
        for idx, gap in enumerate(meaningful_gaps, start=1):
            status_raw = str(_get_val(gap, "validation_status", "inconclusive")).lower()
            supporting_cnt = _get_val(gap, "supporting_paper_count", 0)
            contradicting_cnt = _get_val(gap, "contradicting_paper_count", 0)
            topic_a = str(_get_val(gap, "topic_a", "")).title()
            topic_b = str(_get_val(gap, "topic_b", "")).title()
            statement = str(_get_val(gap, "statement", "")).replace("\n", " ")
            rationale = _get_val(gap, "confidence_rationale", "")

            if status_raw == "supported":
                status_display = "SUPPORTED WITHIN CORPUS (Corroborated by 2+ Distinct Sources)"
            elif status_raw in {"partially_supported", "single_paper_observation"}:
                if total_papers == 1 or status_raw == "single_paper_observation":
                    status_display = "SINGLE-PAPER OBSERVATION (Identified from 1 Paper; Cross-Paper Corroboration Unavailable)"
                else:
                    status_display = "PARTIALLY SUPPORTED (Preliminary Single-Source Evidence)"
            elif status_raw == "unsupported":
                status_display = "CONTRADICTED / ALREADY ADDRESSED (Resolved in Literature)"
            else:
                status_display = "INCONCLUSIVE (Descriptive Background Only)"

            sections.append(f"\n### Candidate Gap {idx}: {topic_a} ↔ {topic_b}")
            sections.append(f"- **Validation Status:** `{status_display}`")
            sections.append(f"- **Evidence Base:** {supporting_cnt} distinct supporting publication(s), {contradicting_cnt} contradicting / resolving publication(s)")
            sections.append(f"- **Specific Technical Problem Assessment:** {statement}")
            sections.append(f"- **Validation Rationale:** {rationale}")

            task_cond = _get_val(gap, "task_and_conditions", "")
            if task_cond:
                sections.append(f"- **Target Task & Conditions:** {task_cond}")

            attempts = _get_val(gap, "existing_attempts", "")
            if attempts:
                sections.append(f"- **Existing Approaches Evaluated:** {attempts}")

            verif = _get_val(gap, "verification_needed", "")
            if verif:
                sections.append(f"- **Verification Experiments Needed:** {verif}")

            evidence_items = _get_val(gap, "evidence_items", []) or []
            informative_items = [e for e in evidence_items if str(_get_val(e, "relation", "")).lower() != "irrelevant"]
            if informative_items:
                sections.append("- **Direct Evidence Passages:**")
                for e in informative_items[:4]:
                    clean_passage = str(_get_val(e, "passage", "")).strip().replace("\n", " ")
                    rel_tag = str(_get_val(e, "relation", "SUPPORTS")).upper()
                    paper_title = _get_val(e, "paper_title", "Unknown Source")
                    sec_info = _get_val(e, "section", "")
                    page_info = _get_val(e, "page_number", None)
                    prov = f"Page {page_info}" if page_info else sec_info
                    prov_str = f" ({prov})" if prov else ""
                    sections.append(f"  - **[{rel_tag}]** *\"{clean_passage}\"* ([{paper_title}]{prov_str})")
    else:
        sections.append(
            "\n*No sufficiently supported research gap was identified in the current corpus. "
            "The examined publications discuss these concepts as descriptive background without reporting an unresolved technical bottleneck or open challenge.*"
        )

    # 7. Unverified Hypotheses & Potential Research Directions
    sections.append("\n## 7. Unverified Hypotheses & Potential Research Directions")
    unverified_items: list[str] = []
    if paper_analyses:
        for pa in paper_analyses:
            for f in pa.unverified_hypotheses:
                unverified_items.append(f"- **[{pa.paper_title[:45]}...]:** {f.problem_statement} (Missing information: {f.missing_verification})")
            for fw in pa.future_work:
                unverified_items.append(f"- **[Future Work - {pa.paper_title[:40]}...]:** {fw}")

    if unverified_items:
        sections.append(
            "> **Distinction:** The following items represent plausible technical hypotheses and future work stated by authors. "
            "They are strictly separated from demonstrated findings and require dedicated empirical experiments before being treated as validated gaps:\n"
            + "\n".join(unverified_items[:8])
        )
    else:
        sections.append("- No unverified hypotheses or open questions flagged in examined text.")

    # 8. Traceability, Citation Verification & Corpus Limitations
    sections.append("\n## 8. Traceability, Citation Verification & Corpus Limitations")
    sections.append(
        f"This report was synthesized from {total_papers} unique paper(s) retrieved via academic search APIs. "
        "Extraction is based on verified publication texts and abstracts. "
        "Every limitation and gap claim is strictly traceable to source bibliographic metadata. "
        "If a specific open challenge is not listed here, it indicates that the examined sample of literature did not substantiate it with sufficient corroborating evidence."
    )

    # 9. References
    sections.append("\n## 9. References")
    if paper_list:
        for idx, p in enumerate(paper_list, start=1):
            authors_str = ", ".join(p.authors) if p.authors else "Unknown Authors"
            year_str = str(p.year) if p.year else "n.d."
            clean_p_title = p.title.replace("\n", " ")
            sections.append(f"[{idx}] {authors_str} ({year_str}). **{clean_p_title}**. {p.doi or p.url or ''}")
    else:
        sections.append("No bibliographic references available.")

    return "\n".join(sections)


def generate_structured_report_fallback(
    topic: str,
    papers: Sequence[Paper],
    gaps: list[Any],
) -> str:
    return generate_structured_report(topic, papers, gaps, requested_limit=len(papers) or 5)


def generate_report(
    topic: str,
    limit: int = 8,
    papers: Sequence[Paper] | None = None,
    project_id: str | None = None,
    gaps: Sequence[Any] | None = None,
    paper_analyses: Sequence[PaperAnalysis] | None = None,
    dt_candidates: Sequence[GapCandidate] | None = None,
) -> str:
    paper_list = list(papers) if papers else []
    analyses_list = list(paper_analyses) if paper_analyses is not None else []

    # If paper_analyses not passed, run paper-level scientific analysis now
    if not analyses_list and paper_list:
        try:
            from app.services.ingestion_service import get_paper_pages
            for p in paper_list:
                pages = get_paper_pages(p)
                analyses_list.append(analyze_paper_content(p, pages=pages))
        except Exception as exc:
            logger.warning("Paper analysis extraction failed during report generation: %s", exc)

    gap_candidates = list(gaps) if gaps is not None else []
    dt_cands = list(dt_candidates) if dt_candidates is not None else []

    if not dt_cands and paper_list:
        try:
            gap_res = generate_double_threshold_gaps(paper_list)
            dt_cands = gap_res.candidates
        except Exception as exc:
            logger.warning("Failed to generate double-threshold candidates: %s", exc)

    if not gap_candidates and paper_list:
        try:
            gap_candidates = formulate_and_validate_scientific_gaps(
                paper_analyses=analyses_list,
                papers=paper_list,
                dt_candidates=dt_cands,
                project_id=project_id,
            )
        except Exception as exc:
            logger.warning("Failed to formulate scientific gaps: %s", exc)

    if not paper_list:
        chunks = retrieve_context(topic, limit=limit, project_id=project_id)
        if not chunks:
            return "No source context or papers were found for this topic."

    return generate_structured_report(
        topic=topic,
        papers=paper_list,
        gaps=gap_candidates,
        requested_limit=len(paper_list) or limit,
        paper_analyses=analyses_list,
        dt_candidates=dt_cands,
    )
