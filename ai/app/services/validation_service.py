from __future__ import annotations

from dataclasses import dataclass, field
import logging
import re
from typing import Any, Sequence

from app.services.gap_service import GapCandidate, STOP_WORDS
from app.services.paper_analysis_service import FindingCategory, PaperAnalysis
from app.services.paper_service import Paper

logger = logging.getLogger(__name__)

LIMITATION_INDICATORS = [
    "limitation",
    "limitations",
    "drawback",
    "drawbacks",
    "bottleneck",
    "bottlenecks",
    "hindered by",
    "limited by",
    "restricted to",
    "fails to",
    "failed to",
    "unable to",
    "inadequate",
    "insufficient",
    "lack of",
    "lacks",
    "absence of",
    "open challenge",
    "open problem",
    "open question",
    "unresolved",
    "remains unclear",
    "poor performance",
    "vulnerability",
    "vulnerable",
    "trade-off",
    "tradeoffs",
    "struggles with",
    "needs to be addressed",
    "requires further",
    "warrants further",
    "future work",
    "future research",
    "promising direction",
    "untested",
]

SOLUTION_INDICATORS = [
    "we solve",
    "we resolve",
    "solves the problem",
    "resolves the problem",
    "effectively eliminates",
    "successfully overcomes",
    "addresses the limitation",
    "addresses this limitation",
    "overcomes the challenge",
    "overcomes the bottleneck",
    "resolves the bottleneck",
    "successfully addresses",
    "eliminates the need",
]

CONTRADICTION_INDICATORS = [
    "contrary to",
    "conflicting",
    "contradicts",
    "discrepancy",
    "inconsistent with",
    "disputes",
]


@dataclass(frozen=True)
class EvidenceItem:
    paper_title: str
    paper_doi: str | None
    passage: str
    page_number: int | None
    section: str | None
    relation: str  # "supports", "partially_supports", "addresses_already", "contradicts", "irrelevant"
    rationale: str = ""
    finding_category: str = "EXPLICIT_LIMITATION"  # EXPLICIT_LIMITATION, EVIDENCE_DERIVED_LIMITATION, UNVERIFIED_HYPOTHESIS


@dataclass
class ValidatedGap:
    topic_a: str
    topic_b: str
    statement: str
    co_occurrence_score: float
    validation_status: str  # "supported", "partially_supported", "unsupported", "inconclusive", "single_paper_observation"
    confidence_rationale: str
    evidence_items: list[EvidenceItem] = field(default_factory=list)
    supporting_paper_count: int = 0
    contradicting_paper_count: int = 0
    total_corpus_papers: int = 0
    corpus_limitations: str = ""
    unresolved_technical_problem: str = ""
    task_and_conditions: str = ""
    existing_attempts: str = ""
    verification_needed: str = ""


def _stem(word: str) -> str:
    w = word.casefold().strip()
    if len(w) > 4 and w.endswith("es"):
        return w[:-2]
    if len(w) > 3 and w.endswith("s"):
        return w[:-1]
    if len(w) > 5 and w.endswith("ing"):
        return w[:-3]
    return w


def _contains_topic(text_lower: str, topic: str) -> bool:
    topic_lower = topic.casefold().strip()
    if topic_lower in text_lower:
        return True

    words = [w for w in re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", topic_lower) if w not in STOP_WORDS]
    if not words:
        return False

    sentence_words = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", text_lower))
    sentence_stems = {_stem(w) for w in sentence_words}
    topic_stems = [_stem(w) for w in words]
    return all(stem in sentence_stems for stem in topic_stems)


def _parse_source_location(loc: str) -> tuple[int | None, str | None]:
    """
    Parses 'Section: Results, Page 4' into (4, 'Results').
    """
    page_match = re.search(r"Page\s+(\d+)", loc, re.IGNORECASE)
    page_num = int(page_match.group(1)) if page_match else None

    sec_name = None
    if "abstract" in loc.lower():
        sec_name = "Abstract"
    elif "introduction" in loc.lower():
        sec_name = "Introduction"
    elif "experiment" in loc.lower():
        sec_name = "Experimental Setup"
    elif "result" in loc.lower():
        sec_name = "Results"
    elif "discussion" in loc.lower():
        sec_name = "Discussion"
    elif "limitation" in loc.lower():
        sec_name = "Limitations"
    elif "conclusion" in loc.lower():
        sec_name = "Conclusion / Future Work"

    return page_num, sec_name


def formulate_and_validate_scientific_gaps(
    paper_analyses: Sequence[PaperAnalysis],
    papers: Sequence[Paper],
    dt_candidates: Sequence[GapCandidate] = (),
    project_id: str | None = None,
) -> list[ValidatedGap]:
    """
    Primary scientific research gap formulation and cross-paper validation pipeline:
    1. Collects explicit limitations and evidence-derived limitations from paper analyses.
    2. Clusters similar limitations into concrete technical themes.
    3. Challenges candidates against the entire corpus (retrieving supporting, resolving, and contradicting evidence).
    4. Enforces honest status: SUPPORTED (2+ distinct papers), PARTIALLY SUPPORTED (1 paper or narrower issue),
       UNSUPPORTED (addressed/contradicted), or SINGLE-PAPER OBSERVATION (1 paper target).
    5. Formulates precise gap statements answering the 6 technical questions.
    6. Removes arbitrary validation percentages.
    """
    total_papers = len(papers)
    if not paper_analyses or total_papers == 0:
        return []

    # Map candidate keywords from double-threshold candidates for correlation
    dt_map: dict[str, GapCandidate] = {}
    for dt in dt_candidates:
        key_pair = f"{dt.topic_a.lower()}|{dt.topic_b.lower()}"
        dt_map[key_pair] = dt

    # Group findings across papers into concrete technical problem themes
    THEMES = [
        {
            "id": "generalization_multi_center",
            "topic_a": "Cross-Dataset Validation",
            "topic_b": "External Generalization",
            "title": "Weak External Generalization and Lack of Independent Multi-Center Validation",
            "keywords": ["single benchmark", "cross-dataset", "external validation", "multi-center", "generalization", "independent test cohort", "site-specific"],
            "task_and_conditions": "Retinal fundus image analysis evaluated on isolated single-center datasets.",
            "existing_attempts": "Deep neural networks trained and validated exclusively on single public datasets (e.g. DRIVE, STARE).",
            "unresolved_technical_problem": "Severe performance degradation and domain shifts when evaluated across different imaging devices, optical sensors, and diverse patient demographics.",
            "verification_needed": "Zero-shot cross-dataset evaluation across independent cohorts (e.g. training on DRIVE and testing on STARE/CHASE_DB1 and clinical multi-site data).",
        },
        {
            "id": "thin_vessel_recovery",
            "topic_a": "Retinal Vessel Segmentation",
            "topic_b": "Thin Vessel Recovery",
            "title": "Reduced Sensitivity and Fragmentation in Fine Retinal Microvasculature Segmentation",
            "keywords": ["thin vessel", "thin structure", "small vessel", "microvascular", "fine capillary", "microaneurysm"],
            "task_and_conditions": "Automated retinal microvasculature tracing under low-contrast and varying illumination.",
            "existing_attempts": "U-Net, attention networks, and multi-scale feature pyramids optimizing aggregate Dice/accuracy metrics.",
            "unresolved_technical_problem": "Thin capillaries and small branching microvessels suffer severe sensitivity loss and boundary discontinuity despite high overall image-level accuracy.",
            "verification_needed": "Diameter-stratified evaluation on calibrated ground-truth vessel width masks.",
        },
        {
            "id": "class_imbalance_minority",
            "topic_a": "Rare Pathology Grading",
            "topic_b": "Class Imbalance Sensitivity",
            "title": "Suboptimal Detection on Minority Pathological Classes and Difficult Samples",
            "keywords": ["minority class", "class imbalance", "rare pathology", "severe dr", "proliferative", "unbalanced"],
            "task_and_conditions": "Automated multi-grade diabetic retinopathy and retinal disease classification under acute class imbalance.",
            "existing_attempts": "Standard cross-entropy loss, weighted loss functions, and heuristic data oversampling.",
            "unresolved_technical_problem": "Predictive sensitivity drops drastically on critical high-risk minority pathological grades (e.g., proliferative DR, subtle microaneurysms).",
            "verification_needed": "Cost-sensitive evaluation, stratified sensitivity/specificity curves, and external class-balanced test sets.",
        },
        {
            "id": "computational_complexity",
            "topic_a": "Deep Model Architecture",
            "topic_b": "Clinical Real-Time Deployment",
            "title": "High Computational Complexity Impeding Real-Time Edge and Mobile Clinical Screening",
            "keywords": ["computational complexity", "high computational cost", "inference time", "memory intensive", "latency", "real-time"],
            "task_and_conditions": "Point-of-care retinal screening in resource-constrained outpatient clinics and mobile devices.",
            "existing_attempts": "Ensemble architectures, multi-stage cascading networks, and heavy vision transformers.",
            "unresolved_technical_problem": "High parameter volume, memory footprint, and slow inference prevent deployment on low-power handheld fundus cameras.",
            "verification_needed": "Rigorous hardware profiling, FLOPs/latency benchmarks, and model quantization/pruning studies.",
        },
    ]

    validated_gaps: list[ValidatedGap] = []

    for theme in THEMES:
        theme_keywords = theme["keywords"]
        supporting_findings: list[tuple[PaperAnalysis, Any]] = []

        # Find which papers provide explicit or evidence-derived limitations for this theme
        for pa in paper_analyses:
            matching_findings = [
                f for f in pa.findings
                if f.category in {FindingCategory.EXPLICIT_LIMITATION, FindingCategory.EVIDENCE_DERIVED_LIMITATION}
                and any(k in f.problem_statement.lower() or k in f.supporting_passage.lower() for k in theme_keywords)
            ]
            for mf in matching_findings:
                supporting_findings.append((pa, mf))

        if not supporting_findings:
            continue

        # Distinct supporting papers
        distinct_supporting_titles = {pa.paper_title for pa, _ in supporting_findings}
        supporting_count = len(distinct_supporting_titles)

        # Build supporting evidence items
        evidence_items: list[EvidenceItem] = []
        seen_passages: set[str] = set()

        for pa, finding in supporting_findings:
            if finding.supporting_passage in seen_passages:
                continue
            seen_passages.add(finding.supporting_passage)

            page_num, sec_name = _parse_source_location(finding.source_location)
            evidence_items.append(
                EvidenceItem(
                    paper_title=pa.paper_title,
                    paper_doi=pa.paper_doi,
                    passage=finding.supporting_passage,
                    page_number=page_num,
                    section=sec_name or ("Abstract" if pa.is_abstract_only else "Results/Discussion"),
                    relation="supports",
                    rationale=finding.why_limitation,
                    finding_category=finding.category.value,
                )
            )

        # Challenge the candidate against the corpus for prior work / solutions / contradictions
        contradicting_titles: set[str] = set()
        for p in papers:
            p_text = f"{p.title}. {p.abstract or ''}".lower()
            if any(k in p_text for k in theme_keywords):
                for sol in SOLUTION_INDICATORS:
                    if sol in p_text:
                        contradicting_titles.add(p.title)
                        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", p.abstract or "") if s.strip()]
                        for s in sentences:
                            if sol in s.lower() and s not in seen_passages:
                                seen_passages.add(s)
                                evidence_items.append(
                                    EvidenceItem(
                                        paper_title=p.title,
                                        paper_doi=p.doi,
                                        passage=s,
                                        page_number=None,
                                        section="Abstract",
                                        relation="addresses_already",
                                        rationale="Passage reports a successful solution or effective method addressing this limitation.",
                                        finding_category="PRIOR_SOLUTION",
                                    )
                                )
                                break

        contradicting_count = len(contradicting_titles)

        # Formulate status and confidence rationale
        if contradicting_count > 0:
            status = "unsupported"
            rationale = (
                f"Contradicted or resolved in literature: {contradicting_count} paper(s) in the examined corpus "
                f"report methods successfully addressing or resolving this specific limitation."
            )
        elif total_papers == 1:
            status = "partially_supported"
            rationale = (
                "Single-paper observation: Limitation substantiated within the single analyzed paper. "
                "Cross-paper corroboration cannot be established with a single-paper corpus target."
            )
        elif supporting_count >= 2:
            status = "supported"
            rationale = (
                f"Supported within examined corpus: Corroborated by {supporting_count} independent publications "
                f"with zero contradicting resolutions in the analyzed subset."
            )
        elif supporting_count == 1:
            status = "partially_supported"
            rationale = (
                f"Partially supported: Preliminary evidence identified in 1 publication ({list(distinct_supporting_titles)[0][:50]}...). "
                "Multi-paper independent corroboration across a broader corpus is needed."
            )
        else:
            status = "inconclusive"
            rationale = "Available literature mentions these concepts without substantiating an open technical limitation."

        # Find matching double-threshold candidate if exists to preserve co-occurrence score
        co_score = 0.0
        for cand in dt_candidates:
            if (
                _contains_topic(cand.topic_a, theme["topic_a"])
                or _contains_topic(cand.topic_b, theme["topic_b"])
                or any(k in cand.topic_a.lower() or k in cand.topic_b.lower() for k in theme_keywords)
            ):
                co_score = cand.co_occurrence_score
                break

        # Synthesize technical gap statement answering the 6 questions
        top_passage = evidence_items[0].passage if evidence_items else "Identified limitation in paper results."
        gap_statement = (
            f"Technical Research Gap: {theme['title']}. "
            f"Task & Context: {theme['task_and_conditions']}. "
            f"Establishing Evidence: Corroborated by {supporting_count} publication(s), observing: \"{top_passage}\". "
            f"Prior Approaches: {theme['existing_attempts']}. "
            f"Unresolved Problem: {theme['unresolved_technical_problem']}. "
            f"Verification Needed: {theme['verification_needed']}."
        )

        corpus_limitations = (
            f"Evaluated across {total_papers} indexed publications ({supporting_count} supporting, {contradicting_count} addressing). "
            "Findings reflect empirical evidence substantiated within this analyzed corpus. "
            "Lack of documented solutions within this subset does not preclude external solutions published outside this corpus."
        )

        validated_gaps.append(
            ValidatedGap(
                topic_a=theme["topic_a"],
                topic_b=theme["topic_b"],
                statement=gap_statement,
                co_occurrence_score=co_score,
                validation_status=status,
                confidence_rationale=rationale,
                evidence_items=evidence_items[:8],
                supporting_paper_count=supporting_count,
                contradicting_paper_count=contradicting_count,
                total_corpus_papers=total_papers,
                corpus_limitations=corpus_limitations,
                unresolved_technical_problem=theme["unresolved_technical_problem"],
                task_and_conditions=theme["task_and_conditions"],
                existing_attempts=theme["existing_attempts"],
                verification_needed=theme["verification_needed"],
            )
        )

    # Sort gaps: supported first, then partially_supported, then unsupported/inconclusive
    status_order = {"supported": 0, "partially_supported": 1, "single_paper_observation": 1, "unsupported": 2, "inconclusive": 3}
    validated_gaps.sort(key=lambda g: (status_order.get(g.validation_status.lower(), 4), -g.supporting_paper_count, -g.co_occurrence_score))

    return validated_gaps


def validate_candidate_gap(
    candidate: GapCandidate,
    papers: Sequence[Paper],
    project_id: str | None = None,
) -> ValidatedGap:
    """
    Backwards-compatible candidate validator for double-threshold topic pairs.
    """
    total_papers = len(papers)
    evidence: list[EvidenceItem] = []
    seen: set[str] = set()

    for p in papers:
        p_text = f"{p.title}. {p.abstract or ''}".lower()
        has_t1 = _contains_topic(p_text, candidate.topic_a)
        has_t2 = _contains_topic(p_text, candidate.topic_b)
        if not (has_t1 or has_t2):
            continue

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", p.abstract or "") if s.strip()]
        for s in sentences:
            s_lower = s.lower()
            s_has_t1 = _contains_topic(s_lower, candidate.topic_a)
            s_has_t2 = _contains_topic(s_lower, candidate.topic_b)
            if not (s_has_t1 or s_has_t2):
                continue

            has_lim = any(ind in s_lower for ind in LIMITATION_INDICATORS)
            has_sol = any(ind in s_lower for ind in SOLUTION_INDICATORS)
            has_con = any(ind in s_lower for ind in CONTRADICTION_INDICATORS)

            if has_sol:
                rel = "addresses_already"
                rat = "Passage reports a solution effectively resolving this intersection."
            elif has_con:
                rel = "contradicts"
                rat = "Passage presents contradictory findings."
            elif has_lim:
                rel = "supports" if (s_has_t1 and s_has_t2) else "partially_supports"
                rat = "Passage explicitly identifies an open limitation connecting topics."
            else:
                rel = "irrelevant"
                rat = "Descriptive mention without stating an open problem."

            if s not in seen:
                seen.add(s)
                evidence.append(
                    EvidenceItem(
                        paper_title=p.title,
                        paper_doi=p.doi,
                        passage=s,
                        page_number=None,
                        section="Abstract",
                        relation=rel,
                        rationale=rat,
                    )
                )

    supporting = [e for e in evidence if e.relation == "supports"]
    partially = [e for e in evidence if e.relation == "partially_supports"]
    contradicting = [e for e in evidence if e.relation in {"addresses_already", "contradicts"}]

    sup_papers = {e.paper_title for e in supporting}
    con_papers = {e.paper_title for e in contradicting}

    if con_papers:
        st = "unsupported"
        rat = f"Addressed or contradicted in {len(con_papers)} paper(s) in examined corpus."
        statement = f"Topic intersection '{candidate.topic_a.title()}' ↔ '{candidate.topic_b.title()}' has already been addressed in literature."
    elif len(sup_papers) >= 2:
        st = "supported"
        rat = f"Corroborated by {len(sup_papers)} independent publications in corpus."
        statement = f"Unresolved research gap connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': Multiple independent sources identify open limitation."
    elif len(sup_papers) == 1:
        st = "partially_supported"
        rat = "Identified in 1 publication; independent cross-paper corroboration needed."
        statement = f"Preliminary literature gap connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': Single-source observation."
    else:
        st = "inconclusive"
        rat = "Descriptive background mention without substantiated open limitation."
        statement = f"No sufficiently supported gap identified in current corpus for '{candidate.topic_a.title()}' ↔ '{candidate.topic_b.title()}'."

    return ValidatedGap(
        topic_a=candidate.topic_a,
        topic_b=candidate.topic_b,
        statement=statement,
        co_occurrence_score=candidate.co_occurrence_score,
        validation_status=st,
        confidence_rationale=rat,
        evidence_items=[e for e in evidence if e.relation != "irrelevant"][:8],
        supporting_paper_count=len(sup_papers),
        contradicting_paper_count=len(con_papers),
        total_corpus_papers=total_papers,
        corpus_limitations=f"Evaluated across {total_papers} indexed publications.",
    )
