from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field, field_validator

from app.schemas.papers import PaperItem


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    paper_limit: int = Field(default=3, ge=1, le=20)
    project_id: str | None = Field(default=None)
    user_id: str | None = Field(default=None)
    alpha: float = Field(default=0.15, ge=0.0, le=1.0)
    beta: float = Field(default=0.65, ge=0.0, le=1.0)

    @field_validator("topic")
    @classmethod
    def normalize_topic(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("topic must not be empty")
        return normalized

    @field_validator("beta")
    @classmethod
    def validate_thresholds(cls, beta: float, info: Any) -> float:
        alpha = info.data.get("alpha", 0.15)
        if alpha > beta:
            raise ValueError("alpha cannot be greater than beta")
        return beta


class ResearchResponse(BaseModel):
    topic: str
    project_id: str | None = None
    papers_processed: int
    total_chunks: int
    papers: list[PaperItem] = Field(default_factory=list)
    gap_candidates: list[dict[str, Any]] = Field(default_factory=list)
    report: str
