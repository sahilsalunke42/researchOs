from pydantic import BaseModel

class AskRequest(BaseModel):
    prompt: str