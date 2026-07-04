import type { Project, AgentRun } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { httpErrors } from '../errors/httpErrors.js';
import type { ProjectDTO, AgentRunDTO } from '../types/api.types.js';

type ProjectWithRuns = Project & { agentRuns: AgentRun[] };

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
  }
};
