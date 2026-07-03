from pydantic import BaseModel, Field, field_validator


class PaperSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=5, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("query must not be empty")
        return normalized


class PaperItem(BaseModel):
    title: str
    authors: list[str]
    year: int | None = None
    doi: str | None = None
    source: str
    url: str | None = None
    abstract: str | None = None
    external_id: str | None = None
    relevance_score: float | None = None


class PaperSearchResponse(BaseModel):
    papers: list[PaperItem]
    count: int
