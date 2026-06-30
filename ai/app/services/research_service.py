from __future__ import annotations

import logging

from app.schemas.ingest import IngestResponse, IngestResultItem
from app.schemas.papers import PaperItem, PaperSearchResponse
from app.schemas.research import ResearchResponse
from app.services.ingestion_service import ingest_papers
from app.services.paper_service import Paper, fetch_papers
from app.services.report_service import generate_report

logger = logging.getLogger(__name__)


def _paper_to_item(paper: Paper) -> PaperItem:
    return PaperItem(
        title=paper.title,
        authors=list(paper.authors),
        year=paper.year,
        doi=paper.doi,
        source=paper.source,
        url=paper.url,
        abstract=paper.abstract,
    )


def search_papers(query: str, limit: int = 5) -> PaperSearchResponse:
    logger.info("Searching papers for query=%r limit=%d", query, limit)
    papers = fetch_papers(query, limit=limit)
    items = [_paper_to_item(paper) for paper in papers]
    return PaperSearchResponse(papers=items, count=len(items))


def ingest_query(query: str, limit: int = 3) -> IngestResponse:
    logger.info("Ingesting papers for query=%r limit=%d", query, limit)
    papers = fetch_papers(query, limit=limit)
    results = ingest_papers(papers)
    items = [
        IngestResultItem(
            paper_key=result.paper_key,
            chunk_count=result.chunk_count,
            source_url=result.source_url,
        )
        for result in results
    ]
    total_chunks = sum(item.chunk_count for item in items)
    return IngestResponse(
        query=query,
        papers_processed=len(items),
        total_chunks=total_chunks,
        results=items,
    )


def run_research(topic: str, paper_limit: int = 3) -> ResearchResponse:
    logger.info("Running research workflow topic=%r paper_limit=%d", topic, paper_limit)
    ingestion = ingest_query(topic, limit=paper_limit)
    report = generate_report(topic)
    return ResearchResponse(
        topic=topic,
        papers_processed=ingestion.papers_processed,
        total_chunks=ingestion.total_chunks,
        report=report,
    )
