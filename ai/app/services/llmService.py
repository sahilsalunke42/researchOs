from __future__ import annotations

from ollama import chat

from app.config.settings import OLLAMA_MODEL


def _require_model() -> str:
    if not OLLAMA_MODEL:
        raise RuntimeError("OLLAMA_MODEL is not configured")
    return OLLAMA_MODEL


def ask(prompt: str) -> str:
    response = chat(
        model=_require_model(),
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"]