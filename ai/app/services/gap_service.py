from __future__ import annotations

from dataclasses import dataclass, field
import itertools
import logging
import math
import re
from typing import Any, Sequence

from app.services.paper_service import Paper

logger = logging.getLogger(__name__)

# Standard stop words for academic NLP keyword filtering
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt",
    "doing", "dont", "down", "during", "each", "few", "for", "from", "further", "had", "hadnt",
    "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
    "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im",
    "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most",
    "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed",
    "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the",
    "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd",
    "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when",
    "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with",
    "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours",
    "yourself", "yourselves", "paper", "study", "studies", "research", "method", "methods",
    "approach", "approaches", "result", "results", "analysis", "system", "systems", "using",
    "based", "proposed", "model", "models", "data", "performance", "evaluation", "presents",
    "demonstrates", "investigates", "provides", "show", "shows", "shown", "work", "works",
}


@dataclass(frozen=True)
class GapCandidate:
    topic_a: str
    topic_b: str
    co_occurrence_score: float
    alpha: float
    beta: float
    statement: str
    supporting_papers: tuple[str, ...] = field(default_factory=tuple)
    validation_status: str = "CANDIDATE"


@dataclass(frozen=True)
class DoubleThresholdResult:
    candidates: list[GapCandidate]
    co_occurrence_matrix: dict[str, dict[str, float]]
    vocabulary: list[str]
    corpus_size: int
    alpha: float
    beta: float


def extract_keywords_from_paper(paper: Paper, top_k: int = 12) -> list[str]:
    """
    Extracts representative key terms from paper title and abstract.
    Tokenizes, strips stopwords and non-alphanumeric chars, and filters by frequency.
    """
    text = f"{paper.title} {paper.abstract or ''}".lower()
    # Extract unigrams and bigrams
    words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9_\-]{2,}\b", text)
    filtered = [w for w in words if w not in STOP_WORDS and len(w) > 2]

    # Term frequency
    freqs: dict[str, int] = {}
    for w in filtered:
        freqs[w] = freqs.get(w, 0) + 1

    # Extract common bigrams
    for i in range(len(filtered) - 1):
        w1, w2 = filtered[i], filtered[i + 1]
        bigram = f"{w1} {w2}"
        freqs[bigram] = freqs.get(bigram, 0) + 1

    # Sort by frequency and length
    ranked = sorted(freqs.keys(), key=lambda k: (freqs[k], len(k)), reverse=True)
    return ranked[:top_k]


def build_co_occurrence_matrix(
    papers: Sequence[Paper],
    top_vocab_size: int = 25,
) -> tuple[list[str], dict[str, dict[str, float]], dict[str, set[int]]]:
    """
    Constructs normalized Salton/Ochiai cosine co-occurrence matrix M(i, j):
    M(i, j) = C(i, j) / sqrt(C(i) * C(j))
    Where C(i) is the number of papers containing keyword i, and C(i, j) is the
    number of papers where both keywords appear.
    """
    paper_keywords: list[set[str]] = []
    global_freq: dict[str, int] = {}
    paper_indices: dict[str, set[int]] = {}

    for idx, paper in enumerate(papers):
        kws = set(extract_keywords_from_paper(paper, top_k=15))
        paper_keywords.append(kws)
        for kw in kws:
            global_freq[kw] = global_freq.get(kw, 0) + 1
            paper_indices.setdefault(kw, set()).add(idx)

    # Select top vocabulary items appearing in at least 1 paper
    sorted_vocab = sorted(
        [k for k, v in global_freq.items() if v >= 1],
        key=lambda k: global_freq[k],
        reverse=True,
    )[:top_vocab_size]

    matrix: dict[str, dict[str, float]] = {k: {} for k in sorted_vocab}

    for k1, k2 in itertools.combinations(sorted_vocab, 2):
        c1 = global_freq[k1]
        c2 = global_freq[k2]
        # Count papers containing both k1 and k2
        joint_docs = paper_indices[k1].intersection(paper_indices[k2])
        c12 = len(joint_docs)

        score = c12 / math.sqrt(c1 * c2) if (c1 * c2) > 0 else 0.0
        matrix[k1][k2] = round(score, 4)
        matrix[k2][k1] = round(score, 4)

    return sorted_vocab, matrix, paper_indices


def generate_double_threshold_gaps(
    papers: Sequence[Paper],
    alpha: float = 0.15,
    beta: float = 0.65,
    max_candidates: int = 10,
) -> DoubleThresholdResult:
    """
    Implements Curiac, Doboli, and Curiac (2022) double-threshold method:
    - M(i, j) < alpha: Insufficient association (unrelated topics).
    - alpha <= M(i, j) <= beta: Candidate Research Gap (novel, underexplored topic intersection).
    - M(i, j) > beta: Well-explored / saturated co-occurrence.
    """
    if not (0.0 <= alpha <= beta <= 1.0):
        raise ValueError(f"Invalid thresholds: expected 0 <= alpha <= beta <= 1, got alpha={alpha}, beta={beta}")

    if not papers:
        return DoubleThresholdResult([], {}, [], 0, alpha, beta)

    vocab, matrix, paper_indices = build_co_occurrence_matrix(papers)
    candidates: list[GapCandidate] = []

    seen_pairs: set[tuple[str, str]] = set()

    for k1 in vocab:
        for k2, score in matrix[k1].items():
            pair = tuple(sorted([k1, k2]))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            if alpha <= score <= beta:
                # Find supporting papers mentioning either or both
                common_papers = [
                    papers[idx].title for idx in paper_indices[k1].union(paper_indices[k2])
                ]
                statement = (
                    f"Candidate intersection between '{k1}' and '{k2}' shows moderate association "
                    f"(co-occurrence score = {score:.3f}, alpha = {alpha}, beta = {beta}), indicating an "
                    f"emerging but underexplored research synergy in the analyzed corpus."
                )
                candidates.append(
                    GapCandidate(
                        topic_a=k1,
                        topic_b=k2,
                        co_occurrence_score=score,
                        alpha=alpha,
                        beta=beta,
                        statement=statement,
                        supporting_papers=tuple(common_papers[:5]),
                        validation_status="CANDIDATE",
                    )
                )

    # Sort candidates by relevance score (closer to middle of range or highest novelty)
    candidates.sort(key=lambda c: c.co_occurrence_score, reverse=True)

    return DoubleThresholdResult(
        candidates=candidates[:max_candidates],
        co_occurrence_matrix=matrix,
        vocabulary=vocab,
        corpus_size=len(papers),
        alpha=alpha,
        beta=beta,
    )
