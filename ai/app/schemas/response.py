from pydantic import BaseModel


class AskResponse(BaseModel):
    response: str
