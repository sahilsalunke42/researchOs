from __future__ import annotations

import logging
import os
import requests

from app.config.settings import (
    OLLAMA_MODEL,
    OPENAI_API_BASE,
    OPENAI_API_KEY,
    OPENAI_MODEL,
)

logger = logging.getLogger(__name__)


def _require_model() -> str:
    if not OLLAMA_MODEL:
        raise RuntimeError("OLLAMA_MODEL is not configured")
    return OLLAMA_MODEL


def sanitize_prompt_context(text: str) -> str:
    """
    Guards against prompt injection in untrusted research paper passages:
    - Escapes XML context delimiter tags.
    - Strips control characters.
    - Limits passage length per chunk to prevent prompt stuffing.
    """
    cleaned = text.replace("<context>", "&lt;context&gt;").replace("</context>", "&lt;/context&gt;")
    cleaned = cleaned.replace("<system>", "&lt;system&gt;").replace("</system>", "&lt;/system&gt;")
    cleaned = cleaned.replace("<instruction>", "&lt;instruction&gt;").replace("</instruction>", "&lt;/instruction&gt;")
    return cleaned[:10000]


def ask(prompt: str) -> str:
    """
    Sends prompt to the configured LLM provider:
    1. If OPENAI_API_KEY is configured, call OpenAI-compatible API.
    2. Otherwise, call local Ollama instance.
    3. If neither is reachable, raise RuntimeError detailing provider status.
    """
    if OPENAI_API_KEY:
        try:
            logger.info("Calling external OpenAI-compatible API at %s model=%s", OPENAI_API_BASE, OPENAI_MODEL)
            res = requests.post(
                f"{OPENAI_API_BASE.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are ResearchOS AI, an agile scientific research intelligence agent. "
                                "Answer concisely and directly like an agent, not like an academic paper. "
                                "Only answer questions about the provided papers in <context>. "
                                "Politely refuse all generic technical, coding, or unrelated queries."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                },
                timeout=60,
            )
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]
        except Exception as exc:
            logger.warning("OpenAI-compatible LLM call failed: %s", exc)

    # Local Ollama call
    try:
        from ollama import chat
        response = chat(
            model=_require_model(),
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are ResearchOS AI, an agile scientific research intelligence agent. "
                        "Answer concisely and directly like an agent, not like an academic paper. "
                        "Only answer questions about the provided papers in <context>. "
                        "Politely refuse all generic technical, coding, or unrelated queries."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response["message"]["content"]
    except Exception as exc:
        logger.error("Local Ollama call failed (model=%s): %s", OLLAMA_MODEL, exc)
        raise RuntimeError(
            f"LLM provider is currently unavailable. Local Ollama failed ({exc}). "
            "Please ensure Ollama is running ('ollama serve' with model configured) or set OPENAI_API_KEY."
        ) from exc