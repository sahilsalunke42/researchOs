from __future__ import annotations

import json
from typing import Any

from ollama import chat

from app.config.settings import OLLAMA_MODEL


def _require_model() -> str:
    if not OLLAMA_MODEL:
        raise RuntimeError("OLLAMA_MODEL is not configured")
    return OLLAMA_MODEL


def ask(prompt: str, *, num_predict: int = 1024) -> str:
    response = chat(
        model=_require_model(),
        messages=[{"role": "user", "content": prompt}],
        options={"num_predict": num_predict, "num_ctx": 8192},
    )
    return response["message"]["content"]


def ask_json(prompt: str, *, num_predict: int = 1800) -> dict[str, Any]:
    response = chat(
        model=_require_model(),
        messages=[{"role": "user", "content": prompt}],
        format="json",
        options={"num_predict": num_predict, "num_ctx": 8192},
    )
    content = response["message"]["content"]
    if isinstance(content, dict):
        return content
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("Ollama returned invalid JSON") from exc
