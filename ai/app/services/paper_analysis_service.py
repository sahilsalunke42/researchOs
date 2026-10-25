from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import logging
import re
from typing import Any, Sequence

from app.rag.ingestion import PDFPage
from app.services.paper_service import Paper

logger = logging.getLogger(__name__)


class FindingCategory(str, Enum):
    EXPLICIT_LIMITATION = "EXPLICIT_LIMITATION"
    EVIDENCE_DERIVED_LIMITATION = "EVIDENCE_DERIVED_LIMITATION"
    UNVERIFIED_HYPOTHESIS = "UNVERIFIED_HYPOTHESIS"


@dataclass(frozen=True)
class ExtractedFinding:
    problem_statement: str
    category: FindingCategory
    supporting_passage: str
    source_location: str
    why_limitation: str
    confidence: str  # "HIGH", "MEDIUM", "LOW" (Extraction confidence)
    relevant_experiment_or_metric: str | None = None
    missing_verification: str | None = None


@dataclass
class PaperAnalysis:
    paper_title: str
    paper_authors: list[str]
    paper_year: int | None
    paper_doi: str | None
    source: str
    is_abstract_only: bool
    research_objective: str
    proposed_method: str
    dataset_info: str
    experimental_setup: str
    findings: list[ExtractedFinding] = field(default_factory=list)
    future_work: list[str] = field(default_factory=list)
    unverified_claims: list[str] = field(default_factory=list)

    @property
    def explicit_limitations(self) -> list[ExtractedFinding]:
        return [f for f in self.findings if f.category == FindingCategory.EXPLICIT_LIMITATION]

    @property
    def evidence_derived_limitations(self) -> list[ExtractedFinding]:
        return [f for f in self.findings if f.category == FindingCategory.EVIDENCE_DERIVED_LIMITATION]

    @property
    def unverified_hypotheses(self) -> list[ExtractedFinding]:
        return [f for f in self.findings if f.category == FindingCategory.UNVERIFIED_HYPOTHESIS]

    @property
    def limitations_summary(self) -> str:
        parts: list[str] = []
        for f in self.explicit_limitations:
            parts.append(f"[Explicit] {f.problem_statement}")
        for f in self.evidence_derived_limitations:
            parts.append(f"[Evidence-derived] {f.problem_statement}")
        for f in self.unverified_hypotheses:
            parts.append(f"[Hypothesis] {f.problem_statement}")
        return "; ".join(parts) if parts else "No specific technical limitation substantiated in analyzed text."

    @property
    def future_work_summary(self) -> str:
        return "; ".join(self.future_work) if self.future_work else "Not explicitly reported in available text."


# Canonical known academic dataset signatures
KNOWN_DATASETS = {
    "drive": "DRIVE (Digital Retinal Images for Vessel Extraction, 40 images: 20 train / 20 test, public)",
    "stare": "STARE (Structured Analysis of the Retina, 20 images, public)",
    "chase_db1": "CHASE_DB1 (Child Heart and Health Study in England retinal dataset, 28 images, public)",
    "chase db1": "CHASE_DB1 (Child Heart and Health Study in England retinal dataset, 28 images, public)",
    "hrf": "HRF (High-Resolution Fundus dataset, 45 images: 15 normal, 15 DR, 15 glaucoma, public)",
    "messidor": "Messidor (1,200 eye fundus images for diabetic retinopathy grading, public)",
    "eyepacs": "EyePACS (Diabetic retinopathy screening dataset, ~35,000 images, public Kaggle)",
    "idrid": "IDRiD (Indian Diabetic Retinopathy Image Dataset, 516 fundus images, public)",
    "aria": "ARIA (Automated Retinal Image Analysis, 143 images, public)",
    "octa-500": "OCTA-500 (500 subjects 3D OCTA volumes, 6-mm and 3-mm FOV, public)",
    "refuge": "REFUGE (Retinal Fundus Glaucoma Challenge dataset, 1,200 images, public)",
    "imagenet": "ImageNet (Pre-training benchmark, 1.2M natural images)",
    "cifar": "CIFAR benchmark dataset",
}

# Canonical known evaluation metrics
METRIC_PATTERNS = [
    (r"\bauc(?:-roc)?\b|\bareas?\s+under\s+(?:the\s+)?(?:roc\s+)?curve\b", "AUC-ROC"),
    (r"\bdice(?:\s+coefficient|\s+score)?\b|\bf1(?:-score)?\b", "Dice / F1-score"),
    (r"\bsensitivity\b|\brecall\b|\btpr\b", "Sensitivity (Recall)"),
    (r"\bspecificity\b|\btnr\b", "Specificity"),
    (r"\baccuracy\b|\bacc\b", "Accuracy"),
    (r"\b(?:mean\s+)?iou\b|\bjaccard\b", "IoU / Jaccard Index"),
    (r"\bprecision\b|\bppv\b", "Precision"),
    (r"\bmae\b|\bmean\s+absolute\s+error\b", "Mean Absolute Error (MAE)"),
    (r"\bmse\b|\brmse\b", "Root Mean Squared Error (RMSE)"),
]

# Canonical architecture keywords
ARCH_KEYWORDS = [
    "u-net", "unet", "attention u-net", "res-unet", "dense-unet", "transunet",
    "transformer", "vision transformer", "vit", "swin", "swin-unetr",
    "convolutional neural network", "cnn", "deep convolutional", "resnet",
    "densenet", "vgg", "mobilenet", "efficientnet", "autoencoder", "diffusion model",
    "generative adversarial network", "gan", "pix2pix", "cyclegan",
    "multi-scale", "pyramid network", "fpn", "graph neural network", "gnn",
    "random forest", "support vector machine", "svm"
]


def _detect_sections(pages: list[PDFPage]) -> dict[str, list[tuple[int, str]]]:
    """
    Parses full-text pages into canonical scientific paper sections with page provenance.
    Returns: {section_name: [(page_number, text_snippet), ...]}
    """
    section_patterns = [
        ("abstract", r"(?i)^\s*(?:abstract|summary)\b"),
        ("introduction", r"(?i)^\s*(?:1\.?\s*)?(?:introduction|background)\b"),
        ("related_work", r"(?i)^\s*(?:2\.?\s*)?(?:related\s+work|prior\s+work|literature\s+review)\b"),
        ("methodology", r"(?i)^\s*(?:[23]\.?\s*)?(?:methodology|methods|proposed\s+method|architecture|materials\s+and\s+methods)\b"),
        ("experiments", r"(?i)^\s*(?:[34]\.?\s*)?(?:experiments|experimental\s+setup|implementation\s+details|datasets)\b"),
        ("results", r"(?i)^\s*(?:[45]\.?\s*)?(?:results|experimental\s+results|evaluation|performance\s+analysis)\b"),
        ("discussion", r"(?i)^\s*(?:[56]\.?\s*)?(?:discussion|error\s+analysis|ablation\s+study|ablation\s+experiments)\b"),
        ("limitations", r"(?i)^\s*(?:[67]\.?\s*)?(?:limitations|threats\s+to\s+validity|drawbacks)\b"),
        ("conclusion", r"(?i)^\s*(?:[678]\.?\s*)?(?:conclusion|concluding\s+remarks|future\s+work|conclusions\s+and\s+future\s+work)\b"),
    ]

    current_section = "introduction"
    sections_map: dict[str, list[tuple[int, str]]] = {
        name: [] for name, _ in section_patterns
    }

    for page in pages:
        lines = page.text.split("\n")
        page_chunks: dict[str, list[str]] = {}

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue

            # Check if this line starts a new section
            matched_sec = None
            for sec_name, pat in section_patterns:
                if re.match(pat, line_clean) and len(line_clean) < 80:
                    matched_sec = sec_name
                    break

            if matched_sec:
                current_section = matched_sec

            page_chunks.setdefault(current_section, []).append(line_clean)

        for sec_name, chunk_lines in page_chunks.items():
            text_block = " ".join(chunk_lines).strip()
            if text_block:
                sections_map.setdefault(sec_name, []).append((page.page_number, text_block))

    return sections_map


def _extract_objective(title: str, text: str) -> str:
    """
    Extracts the core research objective and problem statement.
    """
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    objective_triggers = [
        "aims to", "aim of this", "objective of", "we propose", "this paper proposes",
        "this study presents", "in this work, we", "focuses on", "addresses the problem of",
        "we develop", "we introduce", "designed to", "we investigate"
    ]
    for s in sentences:
        s_lower = s.lower()
        if any(trig in s_lower for trig in objective_triggers):
            return s

    if sentences:
        return sentences[0]
    return f"Investigating automated methodology for {title}."


def _extract_method(text: str) -> str:
    """
    Extracts the proposed method, architecture, and design choices.
    """
    text_lower = text.lower()
    detected_archs: list[str] = []
    for arch in ARCH_KEYWORDS:
        if re.search(r"\b" + re.escape(arch) + r"\b", text_lower):
            detected_archs.append(arch.upper() if len(arch) <= 5 else arch.title())

    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    method_sentences = [
        s for s in sentences
        if any(k in s.lower() for k in ["propose", "architecture", "network consists", "encoder", "decoder", "loss function", "framework"])
    ]

    arch_summary = ", ".join(list(dict.fromkeys(detected_archs))[:4]) if detected_archs else "Deep neural network / Algorithmic pipeline"
    key_sentence = method_sentences[0] if method_sentences else "Methodological design evaluated on domain data."
    return f"{arch_summary}: {key_sentence}"


def _extract_datasets(text: str) -> str:
    """
    Extracts reported datasets, sizes, and availability.
    """
    text_lower = text.lower()
    found_datasets: list[str] = []

    for key, desc in KNOWN_DATASETS.items():
        if re.search(r"\b" + re.escape(key) + r"\b", text_lower):
            found_datasets.append(desc)

    # Check for private or institutional datasets
    if any(term in text_lower for term in ["private dataset", "hospital cohort", "clinical cohort", "in-house dataset", "institutional dataset", "local dataset"]):
        found_datasets.append("Private/Institutional Clinical Cohort (Non-public)")

    # Look for image counts
    img_count_match = re.search(r"\b(\d{1,3}(?:,\d{3})*|\d+)\s*(?:retinal\s+images?|fundus\s+images?|scans?|patients?|subjects?|samples?)\b", text_lower)
    size_info = f" (Reported sample size: {img_count_match.group(0)})" if img_count_match else ""

    if found_datasets:
        return "; ".join(found_datasets) + size_info
    return "Dataset details not explicitly specified in available text."


def _extract_metrics_and_results(text: str) -> str:
    """
    Extracts evaluation metrics, baselines, and reported quantitative results.
    """
    text_lower = text.lower()
    found_metrics: list[str] = []
    for pat, name in METRIC_PATTERNS:
        if re.search(pat, text_lower):
            found_metrics.append(name)

    # Look for explicit numerical scores (e.g. AUC = 0.98, accuracy of 95.4%)
    scores = re.findall(r"\b(?:auc|dice|accuracy|acc|sensitivity|sens|specificity|spec|f1)\s*(?:of|=|:)?\s*(?:0\.\d{2,4}|\d{1,2}(?:\.\d{1,2})?%)\b", text_lower)
    score_summary = f" Reported numerical scores: {', '.join(scores[:5])}." if scores else ""

    metrics_str = ", ".join(list(dict.fromkeys(found_metrics))[:5]) if found_metrics else "Empirical evaluation"
    return f"Evaluation metrics: {metrics_str}.{score_summary}"


def analyze_paper_content(
    paper: Paper,
    pages: list[PDFPage] | None = None,
) -> PaperAnalysis:
    """
    Performs rigorous scientific paper analysis conforming to Instructions.md and Architecture.md:
    1. Extracts research objective, method, architecture, datasets, baselines, metrics, and results.
    2. Separates 3 kinds of findings:
       A. Explicit limitation (stated directly by authors)
       B. Evidence-derived limitation (demonstrated by results, error analysis, or design)
       C. Unverified hypothesis (plausible concern, but evidence insufficient)
    3. Handles full text when available (with page and section provenance); labels abstract-limited otherwise.
    4. Guardrail against false claims: e.g. thin-vessel weakness is NOT claimed without empirical evidence.
    """
    is_abstract_only = not bool(pages)
    findings: list[ExtractedFinding] = []
    future_work: list[str] = []
    unverified_claims: list[str] = []

    if is_abstract_only:
        # Abstract-limited mode
        abstract_text = paper.abstract or ""
        if not abstract_text.strip():
            research_obj = f"Investigation addressing {paper.title}."
            proposed_meth = "Methodological approach documented in publication title and metadata."
            dataset_inf = "Dataset details not accessible from bibliographic metadata."
            exp_setup = "Quantitative evaluation metrics not accessible from bibliographic metadata."
            findings.append(
                ExtractedFinding(
                    problem_statement=f"Empirical methodology, datasets, and quantitative results unavailable for '{paper.title}' due to missing abstract in bibliographic source.",
                    category=FindingCategory.UNVERIFIED_HYPOTHESIS,
                    supporting_passage=paper.title,
                    source_location="Bibliographic Metadata",
                    why_limitation="Academic indexing API returned title and metadata only without full abstract or PDF text.",
                    confidence="MEDIUM",
                    relevant_experiment_or_metric=None,
                    missing_verification="Access to publication abstract or full PDF text.",
                )
            )
            return PaperAnalysis(
                paper_title=paper.title,
                paper_authors=list(paper.authors),
                paper_year=paper.year,
                paper_doi=paper.doi,
                source=paper.source,
                is_abstract_only=True,
                research_objective=research_obj,
                proposed_method=proposed_meth,
                dataset_info=dataset_inf,
                experimental_setup=exp_setup,
                findings=findings,
                future_work=future_work,
                unverified_claims=unverified_claims,
            )

        research_obj = _extract_objective(paper.title, abstract_text)
        proposed_meth = _extract_method(abstract_text)
        dataset_inf = _extract_datasets(abstract_text)
        exp_setup = _extract_metrics_and_results(abstract_text)

        EXPLICIT_LIMITATION_TERMS = [
            "limitation", "limitations", "limited", "still limited", "remains limited", "is limited", "are limited",
            "bottleneck", "bottlenecks", "drawback", "drawbacks", "restricted to", "fails to", "fail to",
            "failure to", "lack of", "lacks", "inadequate", "struggle", "struggles with", "difficulty in",
            "difficult to", "hard to", "suffer from", "suffers from", "poor performance", "lower sensitivity",
            "drops significantly", "drop in", "degrades", "vulnerable to", "absence of", "open challenge",
            "open problem", "open question", "unresolved", "trade-off", "computational cost", "latency",
            "untested", "cannot generalize", "poor generalization", "challenging to", "remains challenging",
            "challenging problem", "few-shot", "scarcity of", "imbalance"
        ]

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", abstract_text) if s.strip()]

        # 1. Category A: Explicit limitations in abstract
        for s in sentences:
            s_lower = s.lower()
            if any(term in s_lower for term in EXPLICIT_LIMITATION_TERMS):
                findings.append(
                    ExtractedFinding(
                        problem_statement=s,
                        category=FindingCategory.EXPLICIT_LIMITATION,
                        supporting_passage=s,
                        source_location="Abstract (Abstract-limited)",
                        why_limitation="Authors explicitly state this limitation or challenge in publication abstract.",
                        confidence="HIGH",
                        missing_verification="Full-text experimental sections and detailed error analysis unavailable in abstract-limited corpus.",
                    )
                )

        # 2. Future work statements in abstract
        for s in sentences:
            s_lower = s.lower()
            if any(fw in s_lower for fw in ["future work", "future research", "future developments", "future directions", "remains for future", "plan to explore"]):
                future_work.append(f"[Abstract] {s}")

        # 3. Category B: Evidence-derived limitations in abstract
        # 3a. Single benchmark / external validation
        datasets_tested = [k for k in KNOWN_DATASETS.keys() if re.search(r"\b" + re.escape(k) + r"\b", abstract_text.lower())]
        if len(datasets_tested) == 1:
            single_ds_name = datasets_tested[0].upper()
            findings.append(
                ExtractedFinding(
                    problem_statement=f"Evaluation restricted to single benchmark ({single_ds_name}) without independent external cross-dataset or cross-device validation.",
                    category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                    supporting_passage=f"Abstract reports evaluation solely on {single_ds_name} without multi-center external test cohort.",
                    source_location="Abstract (Experimental Scope)",
                    why_limitation="Lack of independent external validation limits verification of clinical generalization across imaging devices and patient demographics.",
                    confidence="HIGH",
                    relevant_experiment_or_metric=f"Single-dataset evaluation on {single_ds_name}",
                    missing_verification="Cross-dataset evaluation on independent cohorts (e.g., STARE, CHASE_DB1, or multi-site data).",
                )
            )

        # 3b. Fine structure / thin vessel sensitivity drops
        for s in sentences:
            s_lower = s.lower()
            if any(term in s_lower for term in ["thin vessel", "tiny vessel", "small vessel", "microvascular", "fine capillary", "thin structure"]) and any(
                drop in s_lower for drop in ["limited", "drops", "drop", "lower", "degrade", "poor", "missed", "disconnected", "challenging", "difficulty", "difficult", "struggle"]
            ):
                findings.append(
                    ExtractedFinding(
                        problem_statement="Effectiveness in segmenting fine microvascular / tiny structures remains limited compared to overall vessel segmentation.",
                        category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                        supporting_passage=s,
                        source_location="Abstract (Results / Methodology)",
                        why_limitation="Abstract reports quantitative or qualitative performance limitation on fine / tiny structures.",
                        confidence="HIGH",
                        relevant_experiment_or_metric="Fine-vessel sensitivity / diameter-stratified evaluation",
                        missing_verification="Detailed per-pixel vessel diameter calibration curve on full test set.",
                    )
                )

        # 3c. Computational complexity and latency in abstract
        for s in sentences:
            s_lower = s.lower()
            if any(comp in s_lower for comp in ["high computational cost", "computational complexity", "inference time", "latency", "memory intensive", "gpu requirement"]):
                findings.append(
                    ExtractedFinding(
                        problem_statement="High computational complexity or latency reported as a bottleneck for edge / real-time deployment.",
                        category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                        supporting_passage=s,
                        source_location="Abstract (System Complexity)",
                        why_limitation="Model complexity hinders execution on low-resource clinical or mobile screening devices.",
                        confidence="HIGH",
                        relevant_experiment_or_metric="Inference latency / parameter profiling",
                        missing_verification="Quantization, pruning, or mobile hardware benchmarking.",
                    )
                )

        # 4. Category C: Unverified Hypotheses in abstract mode
        # Guardrail: If paper addresses vessel segmentation but does not report width-specific error analysis
        if any(term in (paper.title + " " + abstract_text).lower() for term in ["vessel", "segmentation", "detection"]):
            has_explicit_thin_finding = any("thin" in f.problem_statement.lower() or "tiny" in f.problem_statement.lower() for f in findings)
            if not has_explicit_thin_finding:
                findings.append(
                    ExtractedFinding(
                        problem_statement="Fine/thin vessel segmentation performance is unverified in available abstract results.",
                        category=FindingCategory.UNVERIFIED_HYPOTHESIS,
                        supporting_passage=paper.title,
                        source_location="Abstract (Omitted Detail)",
                        why_limitation="Paper reports overall accuracy/metrics but does not report diameter-stratified error breakdown.",
                        confidence="MEDIUM",
                        relevant_experiment_or_metric="None reported for thin vessel width brackets",
                        missing_verification="Empirical evaluation on vessel-width-specific ground truth masks.",
                    )
                )

        # 5. Check for unverified broad claims in abstract
        for s in sentences:
            s_lower = s.lower()
            if any(claim in s_lower for claim in ["clinical application", "ready for deployment", "all retinal diseases", "universal"]):
                unverified_claims.append(f"Abstract states '{s}', but empirical clinical validation cannot be verified from abstract alone.")

        return PaperAnalysis(
            paper_title=paper.title,
            paper_authors=list(paper.authors),
            paper_year=paper.year,
            paper_doi=paper.doi,
            source=paper.source,
            is_abstract_only=True,
            research_objective=research_obj,
            proposed_method=proposed_meth,
            dataset_info=dataset_inf,
            experimental_setup=exp_setup,
            findings=findings,
            future_work=future_work,
            unverified_claims=unverified_claims,
        )

    # Full-text PDF mode
    assert pages is not None
    sections_map = _detect_sections(pages)

    # 1. Research objective
    intro_snippets = [t for _, t in sections_map.get("introduction", [])]
    abstract_snippets = [t for _, t in sections_map.get("abstract", [])]
    obj_corpus = " ".join(abstract_snippets + intro_snippets[:2]) or paper.abstract or paper.title
    research_obj = _extract_objective(paper.title, obj_corpus)

    # 2. Proposed method & architecture
    method_snippets = [t for _, t in sections_map.get("methodology", [])]
    method_corpus = " ".join(method_snippets[:3]) or obj_corpus
    proposed_meth = _extract_method(method_corpus)

    # 3. Datasets & experimental setup
    exp_snippets = [t for _, t in sections_map.get("experiments", [])]
    results_snippets = [t for _, t in sections_map.get("results", [])]
    exp_corpus = " ".join(exp_snippets + results_snippets[:2]) or obj_corpus
    dataset_inf = _extract_datasets(exp_corpus)
    exp_setup = _extract_metrics_and_results(exp_corpus)

    # 4. Extract Category A: Explicit limitations (Authors directly state)
    lim_sections = sections_map.get("limitations", []) + sections_map.get("discussion", []) + sections_map.get("conclusion", [])
    if not lim_sections:
        lim_sections = [(p.page_number, p.text) for p in pages]

    for page_num, text_block in lim_sections:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text_block) if s.strip()]
        for s in sentences:
            s_lower = s.lower()
            if any(ind in s_lower for ind in [
                "limitation of our", "our method is limited", "our model is limited",
                "a key limitation", "main limitation", "one limitation", "drawback of our",
                "fails to detect", "fails to segment", "fails on", "unable to recover",
                "struggles with", "restricted to", "does not account for", "bottleneck"
            ]):
                findings.append(
                    ExtractedFinding(
                        problem_statement=s,
                        category=FindingCategory.EXPLICIT_LIMITATION,
                        supporting_passage=s,
                        source_location=f"Discussion / Limitations (Page {page_num})",
                        why_limitation="Author-stated explicit limitation identified in paper text.",
                        confidence="HIGH",
                        missing_verification=None,
                    )
                )
            elif any(fw in s_lower for fw in ["future work", "future research", "in future work we plan", "remains for future work", "remains an open question"]):
                future_work.append(f"[Page {page_num}] {s}")

    # 5. Extract Category B: Evidence-derived limitations (Results or design support a concrete limitation)
    res_blocks = sections_map.get("results", []) + sections_map.get("discussion", [])
    if not res_blocks:
        res_blocks = [(p.page_number, p.text) for p in pages]

    # 5a. Thin vessel / small object recovery
    has_thin_vessel_evidence = False
    for page_num, text_block in res_blocks:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text_block) if s.strip()]
        for s in sentences:
            s_lower = s.lower()
            # Must have vessel-width specific metric or qualitative error analysis
            if any(term in s_lower for term in ["thin vessel", "thin structure", "small vessel", "microvascular", "capillary"]) and any(
                metric_drop in s_lower for metric_drop in ["lower sensitivity", "drop", "drops", "degrade", "poorly segmented", "missed", "lower dice", "disconnected", "false negative", "challenging to trace"]
            ):
                has_thin_vessel_evidence = True
                findings.append(
                    ExtractedFinding(
                        problem_statement="Thin-vessel segmentation performance is significantly degraded compared to major vessels.",
                        category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                        supporting_passage=s,
                        source_location=f"Results / Error Analysis (Page {page_num})",
                        why_limitation="Results text / error analysis quantitatively demonstrates reduced sensitivity on thin microvascular structures.",
                        confidence="HIGH",
                        relevant_experiment_or_metric="Fine-vessel sensitivity / qualitative vessel continuity evaluation",
                        missing_verification="Detailed per-pixel vessel diameter calibration curve",
                    )
                )

    # 5b. Dataset diversity and external validation
    # If the paper only evaluates on 1 public benchmark (e.g. DRIVE) without independent multi-center validation
    eval_text = " ".join([t for _, t in sections_map.get("experiments", []) + sections_map.get("results", [])]).lower()
    if not eval_text:
        eval_text = " ".join([p.text for p in pages]).lower()
    eval_text += " " + (paper.abstract or "").lower()

    datasets_tested = [k for k in KNOWN_DATASETS.keys() if re.search(r"\b" + re.escape(k) + r"\b", eval_text)]
    if len(datasets_tested) == 1:
        single_ds_name = datasets_tested[0].upper()
        first_exp_page = sections_map["experiments"][0][0] if sections_map.get("experiments") else (pages[0].page_number if pages else 1)
        findings.append(
            ExtractedFinding(
                problem_statement=f"Evaluation restricted to single benchmark ({single_ds_name}) without independent external cross-dataset or cross-device validation.",
                category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                supporting_passage=f"Experiments report evaluation solely on {single_ds_name} without multi-center external test cohort.",
                source_location=f"Experimental Setup (Page {first_exp_page})",
                why_limitation="Lack of independent external validation limits verification of clinical generalization across imaging devices and patient demographics.",
                confidence="HIGH",
                relevant_experiment_or_metric=f"Single-dataset evaluation on {single_ds_name}",
                missing_verification="Evaluation on independent external datasets (e.g. STARE, CHASE_DB1, or diverse clinical cohorts).",
            )
        )

    # 5c. Minority class / rare pathology performance
    for page_num, text_block in res_blocks:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text_block) if s.strip()]
        for s in sentences:
            s_lower = s.lower()
            if any(cls_term in s_lower for cls_term in ["minority class", "imbalance", "rare class", "severe dr", "proliferative", "microaneurysm"]) and any(
                weakness in s_lower for weakness in ["lower recall", "poor performance", "struggles with", "lower accuracy", "fewer samples", "underrepresented"]
            ):
                findings.append(
                    ExtractedFinding(
                        problem_statement="Performance significantly lower on minority pathology classes / difficult samples.",
                        category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                        supporting_passage=s,
                        source_location=f"Results (Page {page_num})",
                        why_limitation="Class imbalance leads to reduced predictive power on critical minority pathological grades.",
                        confidence="HIGH",
                        relevant_experiment_or_metric="Class-wise Recall / Precision metrics",
                        missing_verification="Cost-sensitive loss ablation or re-sampling evaluation",
                    )
                )

    # 5d. Computational complexity and latency
    for page_num, text_block in res_blocks:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text_block) if s.strip()]
        for s in sentences:
            s_lower = s.lower()
            if any(comp in s_lower for comp in ["high computational cost", "large parameter", "inference time", "memory intensive", "gpu requirement"]) and any(
                bottleneck in s_lower for bottleneck in ["hinders", "limits deployment", "slow", "expensive", "not suitable for real-time"]
            ):
                findings.append(
                    ExtractedFinding(
                        problem_statement="High computational complexity and inference latency hinder real-time clinical or edge deployment.",
                        category=FindingCategory.EVIDENCE_DERIVED_LIMITATION,
                        supporting_passage=s,
                        source_location=f"Discussion / Performance (Page {page_num})",
                        why_limitation="Resource footprint exceeds embedded point-of-care screening devices.",
                        confidence="HIGH",
                        relevant_experiment_or_metric="FLOPs / Parameter count / Inference latency",
                        missing_verification="Model compression / pruning / quantization experiments",
                    )
                )

    # 6. Extract Category C: Unverified Hypotheses
    # If the paper is a retinal vessel segmentation paper, but did NOT report thin-vessel specific metrics:
    is_vessel_paper = any(k in paper.title.lower() or k in (paper.abstract or "").lower() for k in ["vessel", "segmentation", "vasculature", "artery", "vein"])
    if is_vessel_paper and not has_thin_vessel_evidence:
        # Crucial acceptance criteria: Thin-vessel detection must NOT be claimed as a limitation without supporting evidence!
        findings.append(
            ExtractedFinding(
                problem_statement="Thin-vessel segmentation performance is unverified in available results.",
                category=FindingCategory.UNVERIFIED_HYPOTHESIS,
                supporting_passage="Paper reports aggregate segmentation metrics (overall Dice/Accuracy) without diameter-stratified thin-vessel evaluation.",
                source_location="Results (Full text evaluation)",
                why_limitation="Aggregate metrics may conceal poor sensitivity on fine capillaries. Because paper lacks diameter-stratified evaluation, this cannot be claimed as an established limitation.",
                confidence="MEDIUM",
                relevant_experiment_or_metric="Vessel-width-specific ROC / sensitivity breakdown not provided",
                missing_verification="Empirical evaluation on vessel-width-specific ground truth masks.",
            )
        )

    return PaperAnalysis(
        paper_title=paper.title,
        paper_authors=list(paper.authors),
        paper_year=paper.year,
        paper_doi=paper.doi,
        source=paper.source,
        is_abstract_only=False,
        research_objective=research_obj,
        proposed_method=proposed_meth,
        dataset_info=dataset_inf,
        experimental_setup=exp_setup,
        findings=findings,
        future_work=future_work,
        unverified_claims=unverified_claims,
    )
