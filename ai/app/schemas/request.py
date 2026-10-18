from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class AskRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    project_id: str | None = Field(default=None)

    @field_validator("prompt")
    @classmethod
    def normalize_prompt(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("prompt must not be empty")
        return normalized
