import { prisma } from '../db/prisma.js';
import { httpErrors } from '../errors/httpErrors.js';
import { aiService } from './ai.services.js';
import type { ResearchResponseDTO } from '../types/api.types.js';

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
