from pydantic import BaseModel, Field, field_validator


class IngestRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=3, ge=1, le=10)

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("query must not be empty")
        return normalized


class IngestResultItem(BaseModel):
    paper_key: str
    chunk_count: int
    source_url: str | None = None


class IngestResponse(BaseModel):
    query: str
    papers_processed: int
    total_chunks: int
    results: list[IngestResultItem]


class SelectedPaper(BaseModel):
    title: str = Field(..., min_length=1, max_length=1000)
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    doi: str | None = None
    source: str = Field(default="manual", min_length=1, max_length=100)
    url: str | None = None
    abstract: str | None = None
    external_id: str | None = None
    pdf_url: str | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("title must not be empty")
        return normalized


class IngestSelectedRequest(BaseModel):
    papers: list[SelectedPaper] = Field(..., min_length=1, max_length=50)
