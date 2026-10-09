from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class EvidenceItem(BaseModel):
    claim: str
    evidence: str
    paper: str
    page: int | None = None
    source_url: str | None = None
    evidence_type: str = "supporting"


class ResearchGap(BaseModel):
    gap: str
    description: str
    evidence: list[str] = Field(default_factory=list)
    source_papers: list[str] = Field(default_factory=list)
    confidence: float | None = None


class ContradictionItem(BaseModel):
    claim_a: str
    claim_b: str
    paper_a: str | None = None
    paper_b: str | None = None
    evidence_a: str
    evidence_b: str
    possible_reason: str | None = None
    confidence: float | None = None
    status: str = "potential"


class PaperAnalysis(BaseModel):
    paper: str
    objective: str
    method: str
    dataset: str
    findings: str
    limitations: str


class ResearchResponse(BaseModel):
    topic: str
    papers_processed: int
    total_chunks: int
    report: str
    paper_analysis: list[PaperAnalysis] = Field(default_factory=list)
    research_gaps: list[ResearchGap] = Field(default_factory=list)
    contradictions: list[ContradictionItem] = Field(default_factory=list)
    supporting_evidence: list[EvidenceItem] = Field(default_factory=list)
    contrasting_evidence: list[EvidenceItem] = Field(default_factory=list)
    sources: list[dict[str, object | None]] = Field(default_factory=list)


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    paper_limit: int = Field(default=3, ge=1, le=10)

    @field_validator("topic")
    @classmethod
    def normalize_topic(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("topic must not be empty")
        return normalized
