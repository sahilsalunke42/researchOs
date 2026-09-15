import type { Project, AgentRun, Report } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { httpErrors } from '../errors/httpErrors.js';
import type { ProjectDTO, AgentRunDTO } from '../types/api.types.js';
import { runResearch } from './ai.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

type ProjectWithRuns = Project & { agentRuns: AgentRun[]; reports: Report[] };

function agentRunToDTO(a: AgentRun): AgentRunDTO {
  return {
    id: a.id,
    agentName: a.agentName,
    status: a.status,
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
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    agentRuns: p.agentRuns.map(agentRunToDTO),
    reportContent: p.reports[0]?.content ?? null
  };
}

export const projectsService = {
  async listProjects(userId: string): Promise<ProjectDTO[]> {
    const rows = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { agentRuns: { orderBy: { id: 'asc' } }, reports: true }
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
        status: 'QUEUED',
        agentRuns: {
          createMany: {
            data: [
              { agentName: 'DISCOVERY', status: 'PENDING' },
              { agentName: 'INGESTION', status: 'PENDING' },
              { agentName: 'REPORT', status: 'PENDING' }
            ]
          }
        }
      },
      include: { agentRuns: { orderBy: { id: 'asc' } }, reports: true }
    });
    if (env.NODE_ENV !== 'test') {
      void runProjectWorkflow(project.id, input.topic.trim(), input.paperLimit);
    }
    return toDTO(project);
  },

  async getProject(userId: string, projectId: string): Promise<ProjectDTO> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { agentRuns: { orderBy: { id: 'asc' } }, reports: true }
    });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    return toDTO(project);
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const result = await prisma.project.deleteMany({ where: { id: projectId, userId } });
    if (result.count === 0) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
  }
};

async function setRunStatus(projectId: string, agentName: 'DISCOVERY' | 'INGESTION' | 'REPORT', status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'ERROR') {
  const now = new Date();
  await prisma.agentRun.updateMany({
    where: { projectId, agentName },
    data: {
      status,
      startedAt: status === 'RUNNING' ? now : undefined,
      completedAt: status === 'COMPLETE' || status === 'ERROR' ? now : undefined
    }
  });
}

async function runProjectWorkflow(projectId: string, topic: string, paperLimit: number): Promise<void> {
  try {
    await prisma.project.update({ where: { id: projectId }, data: { status: 'DISCOVERING' } });
    await setRunStatus(projectId, 'DISCOVERY', 'RUNNING');
    await setRunStatus(projectId, 'INGESTION', 'RUNNING');
    await setRunStatus(projectId, 'REPORT', 'RUNNING');

    const result = await runResearch(topic, paperLimit);

    await prisma.$transaction([
      prisma.project.update({ where: { id: projectId }, data: { status: 'COMPLETE' } }),
      prisma.report.upsert({
        where: { projectId },
        update: { content: result.report },
        create: { projectId, content: result.report }
      }),
      prisma.agentRun.updateMany({
        where: { projectId, status: 'RUNNING' },
        data: { status: 'COMPLETE', completedAt: new Date() }
      })
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI workflow error';
    logger.error('Project AI workflow failed', { projectId, error: message });
    await prisma.$transaction([
      prisma.project.update({ where: { id: projectId }, data: { status: 'ERROR' } }),
      prisma.agentRun.updateMany({
        where: { projectId, status: { in: ['RUNNING', 'PENDING'] } },
        data: { status: 'ERROR', completedAt: new Date(), errorMessage: message }
      })
    ]).catch(transactionError => {
      logger.error('Failed to persist AI workflow failure state', {
        projectId,
        error: transactionError instanceof Error ? transactionError.message : String(transactionError)
      });
    });
  }
}
