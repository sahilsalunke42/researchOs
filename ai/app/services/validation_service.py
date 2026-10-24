from __future__ import annotations

from dataclasses import dataclass, field
import logging
import re
from typing import Sequence

from app.services.gap_service import GapCandidate, STOP_WORDS
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


@dataclass(frozen=True)
class ValidatedGap:
    topic_a: str
    topic_b: str
    statement: str
    co_occurrence_score: float
    validation_status: str  # "supported", "partially_supported", "unsupported", "inconclusive"
    confidence_rationale: str
    evidence_items: list[EvidenceItem] = field(default_factory=list)
    supporting_paper_count: int = 0
    contradicting_paper_count: int = 0
    total_corpus_papers: int = 0
    corpus_limitations: str = ""


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
    """
    Checks if a topic is present in text using normalized stemmed word matching.
    """
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


def extract_evidence_from_corpus(
    candidate: GapCandidate,
    papers: Sequence[Paper],
) -> list[EvidenceItem]:
    """
    Scans the corpus for passages mentioning candidate topics and classifies their evidential relation.
    Differentiates genuine limitation / future-work statements from pure background descriptive usage.
    """
    items: list[EvidenceItem] = []

    for paper in papers:
        paper_text = f"{paper.title}. {paper.abstract or ''}".casefold()
        paper_has_t1 = _contains_topic(paper_text, candidate.topic_a)
        paper_has_t2 = _contains_topic(paper_text, candidate.topic_b)

        # If the paper does not touch at least one of the topics, it cannot provide evidence
        if not (paper_has_t1 or paper_has_t2):
            continue

        abstract = paper.abstract or ""
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", abstract) if s.strip()]

        for sentence in sentences:
            s_lower = sentence.casefold()

            s_has_t1 = _contains_topic(s_lower, candidate.topic_a)
            s_has_t2 = _contains_topic(s_lower, candidate.topic_b)

            # Check if this sentence directly references candidate topics
            if not (s_has_t1 or s_has_t2):
                continue

            has_limitation = any(ind in s_lower for ind in LIMITATION_INDICATORS)
            has_solution = any(ind in s_lower for ind in SOLUTION_INDICATORS)
            has_contradiction = any(ind in s_lower for ind in CONTRADICTION_INDICATORS)

            # Both topics are either in this sentence or contextualized in this paper
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
                    # Co-occurrence alone without limitation or solution is descriptive background, NOT gap support
                    relation = "irrelevant"
                    rationale = "Descriptive or background co-occurrence without identifying an unresolved limitation."
            else:
                # Only one topic exists in the entire paper
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

            items.append(
                EvidenceItem(
                    paper_title=paper.title,
                    paper_doi=paper.doi,
                    passage=sentence if sentence.endswith((".", "!", "?")) else sentence + ".",
                    page_number=None,
                    section="Abstract",
                    relation=relation,
                    rationale=rationale,
                )
            )

    return items


def validate_candidate_gap(
    candidate: GapCandidate,
    papers: Sequence[Paper],
) -> ValidatedGap:
    """
    Rigorous cross-paper validation of candidate topic combinations:
    1. Evaluates evidence across distinct publications (repeated passages from one paper count as 1 source).
    2. Classifies validation status strictly based on empirical limitation evidence:
       - SUPPORTED: Corroborated by >= 2 distinct publications identifying an unresolved issue, with 0 contradicting papers.
       - PARTIALLY_SUPPORTED: Corroborated by exactly 1 publication, or partial single-topic limitations needing narrowing.
       - UNSUPPORTED: Literature shows the issue has already been addressed, resolved, or contradicted.
       - INCONCLUSIVE: Literature mentions topics only as descriptive background without an open challenge.
    3. Synthesizes an evidence-grounded gap statement quoting the actual literature limitation.
    """
    evidence = extract_evidence_from_corpus(candidate, papers)

    supporting_evidence = [e for e in evidence if e.relation == "supports"]
    partially_supporting_evidence = [e for e in evidence if e.relation == "partially_supports"]
    contradicting_evidence = [e for e in evidence if e.relation in {"addresses_already", "contradicts"}]

    # Deduplicate strictly by distinct paper identity
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

    # Filter out irrelevant background passages from user-facing evidence list
    informative_evidence = [e for e in evidence if e.relation != "irrelevant"]
    if not informative_evidence and evidence:
        # Include up to 2 background passages labeled as irrelevant for transparent diagnostic context
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
