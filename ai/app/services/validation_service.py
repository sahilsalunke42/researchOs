from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import Any, Sequence

from app.services.gap_service import GapCandidate
from app.services.paper_service import Paper

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EvidenceItem:
    paper_title: str
    paper_doi: str | None
    passage: str
    page_number: int | None
    section: str | None
    relation: str  # "supports", "contradicts", "partially_supports", "addresses_already", "unclear"


@dataclass(frozen=True)
class ValidatedGap:
    topic_a: str
    topic_b: str
    statement: str
    co_occurrence_score: float
    validation_status: str  # "supported", "partially_supported", "unsupported", "inconclusive"
    confidence_rationale: str
    evidence_items: list[EvidenceItem] = field(default_factory=list)


def extract_evidence_from_corpus(
    candidate: GapCandidate,
    papers: Sequence[Paper],
) -> list[EvidenceItem]:
    """
    Scans the corpus for passages mentioning candidate topics and assesses relation.
    """
    t1 = candidate.topic_a.casefold()
    t2 = candidate.topic_b.casefold()
    items: list[EvidenceItem] = []

    limitation_indicators = ["limitation", "future work", "open problem", "challenge", "unresolved", "lack of", "bottleneck"]
    solution_indicators = ["solve", "we achieve", "we propose", "effectively eliminates", "addresses", "successful"]

    for paper in papers:
        abstract = (paper.abstract or "").casefold()
        if not abstract:
            continue

        has_t1 = t1 in abstract
        has_t2 = t2 in abstract

        if not (has_t1 or has_t2):
            continue

        # Extract sentences containing the topics
        sentences = [s.strip() for s in paper.abstract.split(".") if s.strip()]
        for sentence in sentences:
            s_lower = sentence.casefold()
            if (t1 in s_lower) or (t2 in s_lower):
                # Assess evidence relation heuristically & deterministically
                is_limitation = any(ind in s_lower for ind in limitation_indicators)
                is_solution = any(ind in s_lower for ind in solution_indicators)

                if has_t1 and has_t2 and is_limitation:
                    relation = "supports"
                elif has_t1 and has_t2 and is_solution:
                    relation = "addresses_already"
                elif has_t1 and has_t2:
                    relation = "partially_supports"
                elif is_limitation:
                    relation = "supports"
                else:
                    relation = "unclear"

                items.append(
                    EvidenceItem(
                        paper_title=paper.title,
                        paper_doi=paper.doi,
                        passage=sentence + ".",
                        page_number=None,
                        section="Abstract",
                        relation=relation,
                    )
                )

    return items


def validate_candidate_gap(
    candidate: GapCandidate,
    papers: Sequence[Paper],
) -> ValidatedGap:
    """
    Validates candidate claims against retrieved evidence and classifies results:
    - supported: multiple relevant sources support the unresolved issue and no retrieved evidence invalidates it.
    - partially_supported: the broad issue is established but evidence is partial or one-sided.
    - unsupported: available evidence shows work has already addressed it.
    - inconclusive: corpus coverage or evidence is insufficient.
    """
    evidence = extract_evidence_from_corpus(candidate, papers)

    supporting = [e for e in evidence if e.relation in {"supports", "partially_supports"}]
    contradicting = [e for e in evidence if e.relation == "addresses_already"]

    # Deduplicate by paper
    supporting_papers = {e.paper_title for e in supporting}
    contradicting_papers = {e.paper_title for e in contradicting}

    if len(contradicting_papers) >= 2:
        status = "unsupported"
        rationale = (
            f"Evidence from {len(contradicting_papers)} papers indicates that this topic intersection "
            f"has already been substantially addressed in existing work."
        )
    elif len(supporting_papers) >= 2 and not contradicting_papers:
        status = "supported"
        rationale = (
            f"Cross-paper evidence from {len(supporting_papers)} independent publications supports "
            f"that the intersection between '{candidate.topic_a}' and '{candidate.topic_b}' remains an open challenge."
        )
    elif len(supporting_papers) >= 1:
        status = "partially_supported"
        rationale = (
            f"Preliminary evidence from {len(supporting_papers)} paper(s) identifies relevant limitations, "
            f"but broader cross-paper validation is needed across a larger corpus."
        )
    else:
        status = "inconclusive"
        rationale = (
            f"Corpus coverage was insufficient to conclusively validate or refute the candidate gap. "
            f"Neither widespread limitations nor definitive solutions were confirmed in the indexed papers."
        )

    statement = candidate.statement
    if supporting:
        top_passage = supporting[0].passage.strip()
        if top_passage.endswith("."):
            top_passage = top_passage[:-1]
        statement = (
            f"Unresolved research gap connecting '{candidate.topic_a.title()}' and '{candidate.topic_b.title()}': "
            f"Evidence indicates an open challenge in literature, noting: \"{top_passage}.\""
        )

    return ValidatedGap(
        topic_a=candidate.topic_a,
        topic_b=candidate.topic_b,
        statement=statement,
        co_occurrence_score=candidate.co_occurrence_score,
        validation_status=status,
        confidence_rationale=rationale,
        evidence_items=evidence[:10],
    )
