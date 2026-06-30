from pydantic import BaseModel, Field, field_validator


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


class ResearchResponse(BaseModel):
    topic: str
    papers_processed: int
    total_chunks: int
    report: str
