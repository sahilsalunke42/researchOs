import type { Project, AgentRun } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { httpErrors } from '../errors/httpErrors.js';
import type { ProjectDTO, AgentRunDTO } from '../types/api.types.js';

type ProjectWithRuns = Project & { agentRuns: AgentRun[] };

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

function toDTO(p: ProjectWithRuns): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    topic: p.topic,
    paperLimit: p.paperLimit,
    status: p.status as ProjectDTO['status'],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    agentRuns: p.agentRuns.map(agentRunToDTO)
  };
}

export const projectsService = {
  async listProjects(userId: string): Promise<ProjectDTO[]> {
    const rows = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { agentRuns: { orderBy: { id: 'asc' } } }
    });
    return rows.map(toDTO);
  },

  async createProject(
    userId: string,
    input: { name: string; topic: string; paperLimit: number }
  ): Promise<ProjectDTO> {
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
    return toDTO(project);
  },

  async getProject(userId: string, projectId: string): Promise<ProjectDTO> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { agentRuns: { orderBy: { id: 'asc' } } }
    });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    return toDTO(project);
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const result = await prisma.project.deleteMany({ where: { id: projectId, userId } });
    if (result.count === 0) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
  },

  async runResearch(userId: string, projectId: string): Promise<ProjectDTO> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { agentRuns: true }
    });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'DISCOVERING' }
    });

    try {
      // 1. Search Papers from AI Service
      const searchRes = await fetch(`${env.AI_SERVICE_URL}/papers/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: project.topic, limit: project.paperLimit })
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json() as any;
        const papers = searchData.papers || [];
        for (const p of papers) {
          await prisma.paper.create({
            data: {
              projectId,
              externalId: p.external_id || p.title.slice(0, 30),
              source: p.source === 'arXiv' ? 'ARXIV' : 'SEMANTIC_SCHOLAR',
              title: p.title,
              authors: JSON.stringify(p.authors || []),
              year: p.year,
              pdfUrl: p.url,
              abstractText: p.abstract
            }
          });
        }
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'REPORTING' }
      });

      // 2. Generate Research Report
      const reportRes = await fetch(`${env.AI_SERVICE_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: project.topic })
      });
      if (reportRes.ok) {
        const reportData = await reportRes.json() as any;
        await prisma.report.upsert({
          where: { projectId },
          create: { projectId, content: reportData.report },
          update: { content: reportData.report }
        });
      }

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETE' },
        include: { agentRuns: { orderBy: { id: 'asc' } } }
      });

      return toDTO(updated);
    } catch (err: any) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ERROR' }
      });
      throw err;
    }
  },

  async getPapers(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    const papers = await prisma.paper.findMany({ where: { projectId } });
    return papers.map(p => ({
      ...p,
      authors: (() => { try { return JSON.parse(p.authors); } catch { return []; } })()
    }));
  },

  async getReport(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    const report = await prisma.report.findUnique({ where: { projectId } });
    return report;
  }
};
