from pydantic import BaseModel


class ReportRequest(BaseModel):
    topic: str


class ReportResponse(BaseModel):
    report: str
