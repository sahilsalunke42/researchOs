from ollama import chat
from app.config.settings import OLLAMA_MODEL

def ask(prompt: str):
    response = chat(
        model=OLLAMA_MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response["message"]["content"]