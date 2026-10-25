from __future__ import annotations

from dataclasses import dataclass, field
import logging
import re
from typing import Any, Sequence

from app.services.gap_service import GapCandidate, STOP_WORDS
from app.services.paper_analysis_service import FindingCategory, PaperAnalysis
from app.services.paper_service import Paper

logger = logging.getLogger(__name__)

# Explicit indicators for open scientific limitations, bottlenecks, and unresolved challenges
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

# Explicit indicators for established solutions, resolved challenges, or state-of-the-art breakthroughs
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

# Explicit indicators for contradictory findings or conflicting evidence
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
    finding_category: str = "EXPLICIT_LIMITATION"


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


def _evaluate_sentence(
    sentence: str,
    paper_title: str,
    paper_doi: str | None,
    candidate: GapCandidate,
    paper_has_t1: bool,
    paper_has_t2: bool,
    section: str = "Abstract",
) -> EvidenceItem | None:
    s_lower = sentence.casefold()
    s_has_t1 = _contains_topic(s_lower, candidate.topic_a)
    s_has_t2 = _contains_topic(s_lower, candidate.topic_b)

    if not (s_has_t1 or s_has_t2):
        return None

    has_limitation = any(ind in s_lower for ind in LIMITATION_INDICATORS)
    has_solution = any(ind in s_lower for ind in SOLUTION_INDICATORS)
    has_contradiction = any(ind in s_lower for ind in CONTRADICTION_INDICATORS)

    both_topics_context = (s_has_t1 and s_has_t2) or (paper_has_t1 and paper_has_t2)

    if both_topics_context:
        if has_solution:
            relation = "addresses_already"
            rationale = "Passage reports a successful solution or effective method addressing this intersection."
        elif has_contradiction:
            relation = "contradicts"
            rationale = "Passage presents contradictory findings or disputes this premise."
        elif has_limitation:
            relation = "supports"
            rationale = "Passage explicitly identifies an open challenge, limitation, or bottleneck connecting both topics."
        else:
            relation = "irrelevant"
            rationale = "Descriptive or background co-occurrence without identifying an unresolved limitation."
    else:
        mentioned_topic = candidate.topic_a if s_has_t1 else candidate.topic_b
        if has_solution:
            relation = "addresses_already"
            rationale = f"Passage reports a solution effectively resolving or eliminating the challenge in '{mentioned_topic}'."
        elif has_limitation:
            relation = "partially_supports"
            rationale = f"Identifies a specific limitation in '{mentioned_topic}', but the broader topic intersection is not established in this paper."
        else:
            relation = "irrelevant"
            rationale = f"Descriptive mention of '{mentioned_topic}' without stating an open problem."

    return EvidenceItem(
        paper_title=paper_title,
        paper_doi=paper_doi,
        passage=sentence if sentence.endswith((".", "!", "?")) else sentence + ".",
        page_number=None,
        section=section,
        relation=relation,
        rationale=rationale,
    )


def extract_evidence_from_corpus(
    candidate: GapCandidate,
    papers: Sequence[Paper],
    project_id: str | None = None,
) -> list[EvidenceItem]:
    items: list[EvidenceItem] = []
    seen_passages: set[str] = set()

    for paper in papers:
        paper_text = f"{paper.title}. {paper.abstract or ''}".casefold()
        paper_has_t1 = _contains_topic(paper_text, candidate.topic_a)
        paper_has_t2 = _contains_topic(paper_text, candidate.topic_b)

        if not (paper_has_t1 or paper_has_t2):
            continue

        abstract = paper.abstract or ""
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", abstract) if s.strip()]

        for sentence in sentences:
            item = _evaluate_sentence(
                sentence=sentence,
                paper_title=paper.title,
                paper_doi=paper.doi,
                candidate=candidate,
                paper_has_t1=paper_has_t1,
                paper_has_t2=paper_has_t2,
                section="Abstract",
            )
            if item and item.passage not in seen_passages:
                seen_passages.add(item.passage)
                items.append(item)

    if project_id:
        try:
            from app.rag.retrieval import retrieve_context
            query = f"{candidate.topic_a} {candidate.topic_b} limitation challenge drawback bottleneck"
            chunks = retrieve_context(query=query, limit=12, project_id=project_id)
            for chunk in chunks:
                chunk_paper_title = str(chunk.payload.get("title", ""))
                chunk_doi = chunk.payload.get("doi")
                chunk_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk.text) if s.strip()]
                for sentence in chunk_sentences:
                    item = _evaluate_sentence(
                        sentence=sentence,
                        paper_title=chunk_paper_title,
                        paper_doi=chunk_doi,
                        candidate=candidate,
                        paper_has_t1=True,
                        paper_has_t2=True,
                        section="Full-text PDF",
                    )
                    if item and item.relation != "irrelevant" and item.passage not in seen_passages:
                        seen_passages.add(item.passage)
                        items.append(item)
        except Exception as exc:
            logger.debug("Vector store full-text evidence retrieval skipped: %s", exc)

    return items


def validate_candidate_gap(
    candidate: GapCandidate,
    papers: Sequence[Paper],
    project_id: str | None = None,
) -> ValidatedGap:
    evidence = extract_evidence_from_corpus(candidate, papers, project_id=project_id)

    supporting_evidence = [e for e in evidence if e.relation == "supports"]
    partially_supporting_evidence = [e for e in evidence if e.relation == "partially_supports"]
    contradicting_evidence = [e for e in evidence if e.relation in {"addresses_already", "contradicts"}]

    supporting_papers = {e.paper_title for e in supporting_evidence}
    partially_supporting_papers = {e.paper_title for e in partially_supporting_evidence} - supporting_papers
    contradicting_papers = {e.paper_title for e in contradicting_evidence}

    corpus_limitations = (
        f"Evaluated across {len(papers)} indexed publications. "
        "Evidence evaluated from available publication text/abstracts. "
        "Findings reflect challenges within this analyzed subset and do not preclude solutions published outside this corpus."
    )

    if contradicting_papers:
        status = "unsupported"
        rationale = (
            f"Literature indicates that this topic intersection or problem has already been addressed or resolved "
            f"in {len(contradicting_papers)} paper(s) in the analyzed corpus."
        )
        top_passage = contradicting_evidence[0].passage.strip()
        if top_passage.endswith("."):
            top_passage = top_passage[:-1]
        statement = (
            f"Topic intersection '{candidate.topic_a.title()}' ↔ '{candidate.topic_b.title()}' has already been "
            f"addressed in existing literature: \"{top_passage}.\""
        )
    elif len(supporting_papers) >= 2:
        status = "supported"
        rationale = (
            f"Cross-paper evidence from {len(supporting_papers)} independent publications corroborates that this specific "
            f"issue remains an unresolved challenge in the analyzed corpus."
        )
        top_passage = supporting_evidence[0].passage.strip()
        if top_passage.endswith("."):
            top_passage = top_passage[:-1]
        statement = (
            f"Unresolved research gap connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': "
            f"Multiple independent publications identify this open challenge, noting: \"{top_passage}.\""
        )
    elif len(supporting_papers) == 1:
        status = "partially_supported"
        top_passage = supporting_evidence[0].passage.strip()
        if top_passage.endswith("."):
            top_passage = top_passage[:-1]
        if len(papers) == 1:
            rationale = (
                "Single-paper observation: Identified from 1 paper in corpus. Cross-paper corroboration cannot "
                "be established with a single-paper target."
            )
            statement = (
                f"Single-paper observation connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': "
                f"Individual source notes: \"{top_passage}.\" Cross-paper corroboration requires multiple independent publications."
            )
        else:
            rationale = (
                f"Evidence from 1 publication identifies a relevant limitation, but independent corroboration across multiple "
                f"distinct papers is required to substantiate a robust gap."
            )
            statement = (
                f"Preliminary literature gap connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': "
                f"Single-source evidence indicates: \"{top_passage}.\" Broader cross-paper validation across a larger corpus is needed."
            )
    elif len(partially_supporting_papers) >= 1:
        status = "partially_supported"
        rationale = (
            f"Partial evidence from {len(partially_supporting_papers)} publication(s) identifies component limitations, "
            f"but no publication explicitly connects both topics in a unified gap statement."
        )
        top_passage = partially_supporting_evidence[0].passage.strip()
        if top_passage.endswith("."):
            top_passage = top_passage[:-1]
        statement = (
            f"Component limitation touching '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': "
            f"Literature notes: \"{top_passage}.\" The problem requires narrowing and multi-paper corroboration."
        )
    else:
        status = "inconclusive"
        rationale = (
            f"The analyzed corpus mentions these concepts as descriptive background without substantiating an open "
            f"limitation or unresolved challenge. Co-occurrence alone does not establish a research gap."
        )
        statement = (
            f"No sufficiently supported gap identified in the current corpus for '{candidate.topic_a.title()}' ↔ "
            f"'{candidate.topic_b.title()}'. Literature mentions the concepts without reporting an unresolved limitation."
        )

    informative_evidence = [e for e in evidence if e.relation != "irrelevant"]
    if not informative_evidence and evidence:
        informative_evidence = evidence[:2]

    return ValidatedGap(
        topic_a=candidate.topic_a,
        topic_b=candidate.topic_b,
        statement=statement,
        co_occurrence_score=candidate.co_occurrence_score,
        validation_status=status,
        confidence_rationale=rationale,
        evidence_items=informative_evidence[:10],
        supporting_paper_count=len(supporting_papers),
        contradicting_paper_count=len(contradicting_papers),
        total_corpus_papers=len(papers),
        corpus_limitations=corpus_limitations,
    )


def _parse_source_location(loc: str) -> tuple[int | None, str | None]:
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
    total_papers = len(papers)
    if not paper_analyses or total_papers == 0:
        return []

    THEMES = [
        {
            "id": "generalization_multi_center",
            "topic_a": "Cross-Dataset Validation",
            "topic_b": "External Generalization",
            "title": "Weak External Generalization and Lack of Independent Multi-Center Validation",
            "keywords": ["single benchmark", "cross-dataset", "external validation", "multi-center", "generalization", "independent test cohort", "site-specific", "domain shift", "out-of-distribution", "different dataset", "cross-device"],
            "task_and_conditions": "Evaluation across diverse sensor modalities, acquisition sites, and independent patient cohorts.",
            "existing_attempts": "Deep neural networks trained and validated primarily on isolated public benchmarks (e.g. DRIVE, STARE, single-center datasets).",
            "unresolved_technical_problem": "Severe performance degradation and domain shifts when evaluated across different imaging devices, optical sensors, and diverse patient demographics.",
            "verification_needed": "Zero-shot cross-dataset evaluation across independent cohorts and clinical multi-site test sets.",
        },
        {
            "id": "thin_vessel_recovery",
            "topic_a": "Retinal Vessel Segmentation",
            "topic_b": "Thin Vessel Recovery",
            "title": "Reduced Sensitivity and Fragmentation in Fine Retinal Microvasculature Segmentation",
            "keywords": ["thin vessel", "tiny vessel", "small vessel", "microvascular", "fine capillary", "microaneurysm", "small object", "thin structure", "boundary", "fine detail", "low contrast"],
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
            "keywords": ["minority class", "class imbalance", "rare pathology", "severe dr", "proliferative", "unbalanced", "rare disease", "imbalanced data"],
            "task_and_conditions": "Automated multi-grade disease classification under acute class distribution skew.",
            "existing_attempts": "Standard cross-entropy loss, weighted loss functions, and heuristic data oversampling.",
            "unresolved_technical_problem": "Predictive sensitivity drops drastically on critical high-risk minority pathological grades and subtle lesions.",
            "verification_needed": "Cost-sensitive evaluation, stratified sensitivity/specificity curves, and external class-balanced test sets.",
        },
        {
            "id": "computational_complexity",
            "topic_a": "Deep Model Architecture",
            "topic_b": "Clinical Real-Time Deployment",
            "title": "High Computational Complexity Impeding Real-Time Edge and Mobile Clinical Screening",
            "keywords": ["computational complexity", "high computational cost", "inference time", "memory intensive", "latency", "real-time", "high parameter", "gpu requirement"],
            "task_and_conditions": "Point-of-care clinical screening in resource-constrained outpatient clinics and mobile devices.",
            "existing_attempts": "Ensemble architectures, multi-stage cascading networks, and heavy vision transformers.",
            "unresolved_technical_problem": "High parameter volume, memory footprint, and slow inference prevent deployment on low-power handheld devices.",
            "verification_needed": "Rigorous hardware profiling, FLOPs/latency benchmarks, and model quantization/pruning studies.",
        },
        {
            "id": "annotation_scarcity",
            "topic_a": "Supervised Learning",
            "topic_b": "Annotation Scarcity",
            "title": "Heavy Dependency on Dense Pixel Annotations and Scarcity of Expert Ground Truth",
            "keywords": ["annotation", "annotated data", "scarcity", "expensive annotation", "labeling", "unsupervised", "semi-supervised", "few-shot", "scarcity of"],
            "task_and_conditions": "Model training in clinical domains where expert manual segmentation is prohibitively labor-intensive.",
            "existing_attempts": "Fully supervised deep networks requiring dense pixel-level ground truth masks.",
            "unresolved_technical_problem": "Inability to scale to new imaging modalities or rare clinical indications without expensive expert manual annotation.",
            "verification_needed": "Benchmarking few-shot, self-supervised, and weak-label learning paradigms against fully supervised baselines.",
        },
    ]

    validated_gaps: list[ValidatedGap] = []
    seen_gap_keys: set[str] = set()

    # 1. Process Core Cross-Paper Thematic Candidates
    for theme in THEMES:
        theme_keywords = theme["keywords"]
        supporting_findings: list[tuple[PaperAnalysis, Any]] = []

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

        distinct_supporting_titles = {pa.paper_title for pa, _ in supporting_findings}
        supporting_count = len(distinct_supporting_titles)

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

        co_score = 0.0
        for cand in dt_candidates:
            if (
                _contains_topic(cand.topic_a, theme["topic_a"])
                or _contains_topic(cand.topic_b, theme["topic_b"])
                or any(k in cand.topic_a.lower() or k in cand.topic_b.lower() for k in theme_keywords)
            ):
                co_score = cand.co_occurrence_score
                break

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

        gap_key = f"{theme['topic_a'].lower()}|{theme['topic_b'].lower()}"
        seen_gap_keys.add(gap_key)

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

    # 2. Process and Validate Double-Threshold Topic Candidates
    for dt_cand in dt_candidates:
        dt_key = f"{dt_cand.topic_a.lower()}|{dt_cand.topic_b.lower()}"
        dt_rev_key = f"{dt_cand.topic_b.lower()}|{dt_cand.topic_a.lower()}"
        if dt_key in seen_gap_keys or dt_rev_key in seen_gap_keys:
            continue
        seen_gap_keys.add(dt_key)

        validated_dt = validate_candidate_gap(dt_cand, papers, project_id=project_id)

        # Build 6-question context for the double-threshold candidate
        cand_task = f"Investigation of {dt_cand.topic_a.title()} in conjunction with {dt_cand.topic_b.title()}."
        cand_attempts = f"Techniques explored in {validated_dt.supporting_paper_count + validated_dt.contradicting_paper_count} publication(s) in corpus."
        cand_problem = (
            f"Open limitation connecting '{dt_cand.topic_a.title()}' and '{dt_cand.topic_b.title()}'"
            if validated_dt.validation_status in {"supported", "partially_supported"}
            else f"Topic intersection '{dt_cand.topic_a.title()}' ↔ '{dt_cand.topic_b.title()}' without substantiated open bottleneck."
        )
        cand_verification = f"Independent ablation studies and cross-dataset evaluations for {dt_cand.topic_a.title()} ↔ {dt_cand.topic_b.title()}."

        validated_gaps.append(
            ValidatedGap(
                topic_a=validated_dt.topic_a,
                topic_b=validated_dt.topic_b,
                statement=validated_dt.statement,
                co_occurrence_score=validated_dt.co_occurrence_score,
                validation_status=validated_dt.validation_status,
                confidence_rationale=validated_dt.confidence_rationale,
                evidence_items=validated_dt.evidence_items,
                supporting_paper_count=validated_dt.supporting_paper_count,
                contradicting_paper_count=validated_dt.contradicting_paper_count,
                total_corpus_papers=validated_dt.total_corpus_papers,
                corpus_limitations=validated_dt.corpus_limitations,
                unresolved_technical_problem=cand_problem,
                task_and_conditions=cand_task,
                existing_attempts=cand_attempts,
                verification_needed=cand_verification,
            )
        )

    # 3. Process Domain-Specific Explicit Author Limitations from Individual Papers
    for pa in paper_analyses:
        for f in pa.explicit_limitations:
            # Check if this explicit limitation is already represented
            f_lower = f.problem_statement.lower()
            if any(k in f_lower for theme in THEMES for k in theme["keywords"]):
                continue  # already covered under themes

            topic_pair_key = f"{pa.paper_title[:20].lower()}|explicit_limit"
            if topic_pair_key in seen_gap_keys:
                continue
            seen_gap_keys.add(topic_pair_key)

            page_num, sec_name = _parse_source_location(f.source_location)
            ev_item = EvidenceItem(
                paper_title=pa.paper_title,
                paper_doi=pa.paper_doi,
                passage=f.supporting_passage,
                page_number=page_num,
                section=sec_name or ("Abstract" if pa.is_abstract_only else "Discussion"),
                relation="supports",
                rationale=f.why_limitation,
                finding_category="EXPLICIT_LIMITATION",
            )

            status_exp = "partially_supported" if total_papers > 1 else "single_paper_observation"
            rat_exp = f"Author-stated explicit limitation identified in {pa.paper_title}. Cross-paper corroboration requires broader multi-study evaluation."

            validated_gaps.append(
                ValidatedGap(
                    topic_a="Methodology",
                    topic_b=f.problem_statement[:35].title(),
                    statement=f"Author-Stated Research Limitation in '{pa.paper_title}': \"{f.supporting_passage}\".",
                    co_occurrence_score=0.25,
                    validation_status=status_exp,
                    confidence_rationale=rat_exp,
                    evidence_items=[ev_item],
                    supporting_paper_count=1,
                    contradicting_paper_count=0,
                    total_corpus_papers=total_papers,
                    corpus_limitations=f"Single-source author limitation from {pa.paper_title}.",
                    unresolved_technical_problem=f.problem_statement,
                    task_and_conditions=pa.research_objective,
                    existing_attempts=pa.proposed_method,
                    verification_needed=f.missing_verification or "Independent experimental verification on external datasets.",
                )
            )

    status_order = {"supported": 0, "partially_supported": 1, "single_paper_observation": 1, "unsupported": 2, "inconclusive": 3}
    validated_gaps.sort(key=lambda g: (status_order.get(g.validation_status.lower(), 4), -g.supporting_paper_count, -g.co_occurrence_score))

    return validated_gaps
