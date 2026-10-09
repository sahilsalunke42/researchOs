import { prisma } from '../db/prisma.js';
import { PaperSource } from '@prisma/client';
import { httpErrors } from '../errors/httpErrors.js';
import { aiService } from './ai.services.js';
import type { ResearchResponseDTO } from '../types/api.types.js';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function paperSource(value: unknown): PaperSource {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('arxiv')) return 'ARXIV';
  if (normalized.includes('openalex')) return 'OPENALEX';
  return 'SEMANTIC_SCHOLAR';
}

function normalizedTitle(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase();
}

async function persistResearchPapers(projectId: string, result: ResearchResponseDTO): Promise<void> {
  const analyses = new Map(result.paper_analysis.map(item => [normalizedTitle(item.paper), item] as const));
  const unique = new Map<string, {
    externalId: string; source: PaperSource; title: string; authors: string[];
    year: number | null; pdfUrl: string | null; abstractText: string | null;
    summaryProblem: string | null; summaryMethod: string | null; summaryDataset: string | null;
    summaryResults: string | null; summaryLimits: string | null;
  }>();

  for (const source of result.sources) {
    const title = asString(source.title);
    if (!title) continue;
    const doi = asString(source.doi);
    const url = asString(source.url);
    const yearValue = source.year;
    const year = typeof yearValue === 'number' && Number.isInteger(yearValue) ? yearValue : null;
    const externalId = doi ? `doi:${doi}` : url ? url : `title:${normalizedTitle(title)}:${year ?? 'unknown'}`;
    const analysis = analyses.get(normalizedTitle(title));
    const authors = Array.isArray(source.authors)
      ? source.authors.filter((author): author is string => typeof author === 'string' && Boolean(author.trim())).map(author => author.trim())
      : [];
    unique.set(externalId, {
      externalId,
      source: paperSource(source.source),
      title,
      authors,
      year,
      pdfUrl: url && /\.pdf(?:[?#].*)?$/i.test(url) ? url : null,
      abstractText: asString(source.abstract),
      summaryProblem: asString(analysis?.objective),
      summaryMethod: asString(analysis?.method),
      summaryDataset: asString(analysis?.dataset),
      summaryResults: asString(analysis?.findings),
      summaryLimits: asString(analysis?.limitations)
    });
  }

  await prisma.$transaction(async tx => {
    const existing = await tx.paper.findMany({ where: { projectId } });
    const byExternalId = new Map(existing.map(paper => [paper.externalId, paper] as const));
    for (const paper of unique.values()) {
      const current = byExternalId.get(paper.externalId);
      if (current) {
        await tx.paper.update({ where: { id: current.id }, data: paper });
      } else {
        await tx.paper.create({ data: { ...paper, projectId } });
      }
    }
  });
}


export const researchService = {
  async runForUser(
    userId: string,
    input: { topic: string; paperLimit: number; projectId?: string }
  ): Promise<ResearchResponseDTO> {
    let projectId = input.projectId;

    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
      if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    }

    const startedAt = new Date();
    const agentRun = projectId
      ? await prisma.agentRun.create({
          data: {
            projectId,
            agentName: 'REPORT',
            status: 'RUNNING',
            startedAt
          }
        })
      : null;

    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'REPORTING' }
      });
    }

    try {
      const result = await aiService.runResearch(input.topic.trim(), input.paperLimit);

      if (projectId) {
        await persistResearchPapers(projectId, result);
        const completedAt = new Date();
        await prisma.$transaction([
          prisma.report.upsert({
            where: { projectId },
            create: { projectId, content: result.report },
            update: { content: result.report }
          }),
          prisma.agentRun.update({
            where: { id: agentRun!.id },
            data: {
              status: 'COMPLETE',
              completedAt,
              durationMs: completedAt.getTime() - startedAt.getTime(),
              metadata: {
                papersProcessed: result.papers_processed,
                totalChunks: result.total_chunks,
                researchGaps: result.research_gaps.length,
                contradictions: result.contradictions.length
              }
            }
          }),
          prisma.project.update({
            where: { id: projectId },
            data: { status: 'COMPLETE' }
          })
        ]);
      }

      return result;
    } catch (error) {
      if (projectId) {
        const completedAt = new Date();
        await prisma.$transaction([
          prisma.agentRun.update({
            where: { id: agentRun!.id },
            data: {
              status: 'ERROR',
              completedAt,
              durationMs: completedAt.getTime() - startedAt.getTime(),
              errorMessage: error instanceof Error ? error.message : String(error)
            }
          }),
          prisma.project.update({
            where: { id: projectId },
            data: { status: 'ERROR' }
          })
        ]);
      }
      throw error;
    }
  }
};
