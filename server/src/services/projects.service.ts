import type { Project, AgentRun, Paper, GapCandidate, GapEvidence, Report } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { httpErrors } from '../errors/httpErrors.js';
import { logger } from '../utils/logger.js';
import { researchService } from './research.service.js';
import type {
  ProjectDTO,
  AgentRunDTO,
  ProjectStatusDTO,
  PaperDTO,
  GapCandidateDTO,
  ReportDTO
} from '../types/api.types.js';

type ProjectFull = Project & {
  agentRuns: AgentRun[];
  papers?: Paper[];
  gapCandidates?: (GapCandidate & { evidence: GapEvidence[] })[];
  reports?: Report[];
};

function agentRunToDTO(a: AgentRun): AgentRunDTO {
  return {
    id: a.id,
    agentName: a.agentName as AgentRunDTO['agentName'],
    status: a.status as AgentRunDTO['status'],
    startedAt: a.startedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
    durationMs: a.durationMs ?? null,
    errorMessage: a.errorMessage ?? null
  };
}

function paperToDTO(p: Paper): PaperDTO {
  return {
    id: p.id,
    projectId: p.projectId,
    externalId: p.externalId,
    source: p.source as PaperDTO['source'],
    title: p.title,
    authors: p.authors,
    year: p.year,
    venue: p.venue,
    abstractText: p.abstractText,
    pdfUrl: p.pdfUrl,
    citationCount: p.citationCount,
    summaryProblem: p.summaryProblem,
    summaryMethod: p.summaryMethod,
    summaryDataset: p.summaryDataset,
    summaryResults: p.summaryResults,
    summaryLimits: p.summaryLimits,
    bookmarked: p.bookmarked,
    createdAt: p.createdAt.toISOString()
  };
}

function gapToDTO(g: GapCandidate & { evidence: GapEvidence[] }): GapCandidateDTO {
  return {
    id: g.id,
    projectId: g.projectId,
    topicA: g.topicA,
    topicB: g.topicB,
    statement: g.statement,
    coOccurrenceScore: g.coOccurrenceScore,
    alpha: g.alpha,
    beta: g.beta,
    validationStatus: g.validationStatus as GapCandidateDTO['validationStatus'],
    createdAt: g.createdAt.toISOString(),
    evidence: (g.evidence || []).map((e) => ({
      id: e.id,
      paperTitle: e.paperTitle,
      paperDoi: e.paperDoi,
      passage: e.passage,
      pageNumber: e.pageNumber,
      sectionTitle: e.sectionTitle,
      relation: e.relation as GapCandidateDTO['evidence'][0]['relation']
    }))
  };
}

function toDTO(p: ProjectFull): ProjectDTO {
  const report = p.reports && p.reports.length > 0 ? p.reports[0] : null;
  return {
    id: p.id,
    name: p.name,
    topic: p.topic,
    paperLimit: p.paperLimit,
    status: p.status as ProjectStatusDTO,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    agentRuns: p.agentRuns.map(agentRunToDTO),
    papers: p.papers ? p.papers.map(paperToDTO) : undefined,
    gapCandidates: p.gapCandidates ? p.gapCandidates.map(gapToDTO) : undefined,
    report: report
      ? {
          id: report.id,
          projectId: report.projectId,
          content: report.content,
          isPublic: report.isPublic,
          createdAt: report.createdAt.toISOString()
        }
      : null
  };
}

export const projectsService = {
  async listProjects(userId: string): Promise<ProjectDTO[]> {
    const rows = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        agentRuns: { orderBy: { id: 'asc' } },
        papers: true
      }
    });
    return rows.map(toDTO);
  },

  async createProject(
    userId: string,
    input: { name: string; topic: string; paperLimit: number }
  ): Promise<ProjectDTO> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw httpErrors.unauthorized('User not found. Please log in again.', 'SESSION_EXPIRED');
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name: input.name.trim(),
        topic: input.topic.trim(),
        paperLimit: input.paperLimit,
        status: 'QUEUED'
      },
      include: { agentRuns: true }
    });

    // Auto-trigger background research execution when created in dev/production
    if (process.env.NODE_ENV !== 'test') {
      researchService.triggerResearchRun(userId, project.id).catch((err) => {
        logger.error('Failed to trigger background research run on creation', { error: String(err) });
      });
    }

    return toDTO(project);
  },

  async getProject(userId: string, projectId: string): Promise<ProjectDTO> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        agentRuns: { orderBy: { id: 'asc' } },
        papers: { orderBy: { createdAt: 'asc' } },
        gapCandidates: { include: { evidence: true } },
        reports: true
      }
    });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    return toDTO(project);
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const result = await prisma.project.deleteMany({ where: { id: projectId, userId } });
    if (result.count === 0) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
  }
};
