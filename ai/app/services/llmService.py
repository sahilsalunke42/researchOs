from ollama import chat
from app.config.settings import OLLAMA_MODEL

async def ask(prompt: str):
    response = await chat(
        model=OLLAMA_MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response["message"]["content"]