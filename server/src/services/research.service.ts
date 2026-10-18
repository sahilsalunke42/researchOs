import { EventEmitter } from 'node:events';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { httpErrors } from '../errors/httpErrors.js';
import type {
  PaperDTO,
  GapCandidateDTO,
  ReportDTO,
  ProjectDTO,
  ProjectStatusDTO,
  AgentRunDTO
} from '../types/api.types.js';

export interface SSEEvent {
  type:
    | 'run.started'
    | 'stage.updated'
    | 'paper.discovered'
    | 'paper.ingested'
    | 'gap.detected'
    | 'report.completed'
    | 'run.completed'
    | 'run.failed';
  projectId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

class ProjectEventEmitter extends EventEmitter {}
export const projectEvents = new ProjectEventEmitter();

export const researchService = {
  subscribe(projectId: string, listener: (event: SSEEvent) => void): () => void {
    const handler = (event: SSEEvent) => {
      if (event.projectId === projectId) {
        listener(event);
      }
    };
    projectEvents.on('project.event', handler);
    return () => {
      projectEvents.off('project.event', handler);
    };
  },

  emitEvent(projectId: string, type: SSEEvent['type'], data: Record<string, unknown>) {
    const event: SSEEvent = {
      type,
      projectId,
      data,
      timestamp: new Date().toISOString()
    };
    projectEvents.emit('project.event', event);
  },

  async triggerResearchRun(userId: string, projectId: string): Promise<void> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });
    if (!project) {
      throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');
    }

    // Set status to DISCOVERING and start async execution
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'DISCOVERING' }
    });

    this.emitEvent(projectId, 'run.started', {
      projectId,
      topic: project.topic,
      paperLimit: project.paperLimit
    });

    // Run in background without blocking response
    this.executePipeline(project.id, project.userId, project.topic, project.paperLimit).catch((err) => {
      logger.error('Background research pipeline failed unexpectedly', { projectId, error: String(err) });
    });
  },

  async executePipeline(
    projectId: string,
    userId: string,
    topic: string,
    paperLimit: number
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // 1. Stage: Discovery
      this.emitEvent(projectId, 'stage.updated', { stage: 'DISCOVERY', status: 'RUNNING' });
      await prisma.agentRun.create({
        data: {
          projectId,
          agentName: 'DISCOVERY',
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      // Call AI Service /research
      logger.info('Calling AI service for research', { projectId, topic, paperLimit });
      const aiResponse = await fetch(`${env.AI_SERVICE_URL}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': env.AI_SERVICE_SECRET
        },
        body: JSON.stringify({
          topic,
          paper_limit: paperLimit,
          project_id: projectId,
          user_id: userId,
          alpha: 0.15,
          beta: 0.65
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI service responded with HTTP ${aiResponse.status}: ${errorText}`);
      }

      const result = (await aiResponse.json()) as {
        topic: string;
        project_id: string;
        papers_processed: number;
        total_chunks: number;
        papers: Array<{
          title: string;
          authors: string[];
          year: number | null;
          doi: string | null;
          source: string;
          url: string | null;
          abstract: string | null;
          external_id: string | null;
          relevance_score: number | null;
        }>;
        gap_candidates: Array<{
          topic_a: string;
          topic_b: string;
          statement: string;
          co_occurrence_score: number;
          validation_status: string;
          confidence_rationale: string;
          evidence_items: Array<{
            paper_title: string;
            paper_doi: string | null;
            passage: string;
            relation: string;
          }>;
        }>;
        report: string;
      };

      // 2. Persist Discovered Papers
      this.emitEvent(projectId, 'stage.updated', { stage: 'INGESTION', status: 'RUNNING' });
      const createdPapers = [];
      for (const p of result.papers || []) {
        const sourceEnum = p.source?.toLowerCase().includes('arxiv') ? 'ARXIV' : 'SEMANTIC_SCHOLAR';
        const paper = await prisma.paper.create({
          data: {
            projectId,
            externalId: p.external_id || p.doi || p.url || `paper-${Date.now()}-${Math.random()}`,
            doi: p.doi || null,
            source: sourceEnum,
            title: p.title,
            authors: p.authors || [],
            year: p.year,
            venue: p.source,
            abstractText: p.abstract,
            pdfUrl: p.url,
            citationCount: 0
          }
        });
        createdPapers.push(paper);
        this.emitEvent(projectId, 'paper.discovered', { paperId: paper.id, title: paper.title });
      }

      // 3. Persist Candidate Gaps
      this.emitEvent(projectId, 'stage.updated', { stage: 'GAPS', status: 'RUNNING' });
      for (const gap of result.gap_candidates || []) {
        const statusMap: Record<string, 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'INCONCLUSIVE'> = {
          supported: 'SUPPORTED',
          partially_supported: 'PARTIALLY_SUPPORTED',
          unsupported: 'UNSUPPORTED',
          inconclusive: 'INCONCLUSIVE'
        };
        const validationStatus = statusMap[gap.validation_status?.toLowerCase()] || 'INCONCLUSIVE';

        const candidate = await prisma.gapCandidate.create({
          data: {
            projectId,
            topicA: gap.topic_a,
            topicB: gap.topic_b,
            statement: gap.statement,
            coOccurrenceScore: gap.co_occurrence_score,
            alpha: 0.15,
            beta: 0.65,
            validationStatus,
            evidence: {
              create: (gap.evidence_items || []).map((e) => {
                const relationMap: Record<string, 'SUPPORTS' | 'CONTRADICTS' | 'PARTIALLY_SUPPORTS' | 'ADDRESSES_ALREADY' | 'UNCLEAR'> = {
                  supports: 'SUPPORTS',
                  contradicts: 'CONTRADICTS',
                  partially_supports: 'PARTIALLY_SUPPORTS',
                  addresses_already: 'ADDRESSES_ALREADY'
                };
                return {
                  paperTitle: e.paper_title,
                  paperDoi: e.paper_doi,
                  passage: e.passage,
                  relation: relationMap[e.relation?.toLowerCase()] || 'UNCLEAR'
                };
              })
            }
          }
        });
        this.emitEvent(projectId, 'gap.detected', {
          candidateId: candidate.id,
          topicA: candidate.topicA,
          topicB: candidate.topicB,
          status: candidate.validationStatus
        });
      }

      // 4. Persist Generated Report
      this.emitEvent(projectId, 'stage.updated', { stage: 'REPORT', status: 'RUNNING' });
      await prisma.report.upsert({
        where: { projectId },
        create: {
          projectId,
          content: result.report
        },
        update: {
          content: result.report
        }
      });
      this.emitEvent(projectId, 'report.completed', { projectId });

      // 5. Update Project Status to COMPLETE
      const totalDuration = Date.now() - startTime;
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETE' }
      });

      // Record completed AgentRuns
      const stages: Array<'DISCOVERY' | 'INGESTION' | 'ANALYSIS' | 'GAPS' | 'REPORT'> = [
        'DISCOVERY',
        'INGESTION',
        'ANALYSIS',
        'GAPS',
        'REPORT'
      ];
      for (const stage of stages) {
        await prisma.agentRun.create({
          data: {
            projectId,
            agentName: stage,
            status: 'COMPLETE',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            durationMs: Math.round(totalDuration / stages.length)
          }
        });
      }

      this.emitEvent(projectId, 'run.completed', {
        projectId,
        papersCount: createdPapers.length,
        gapsCount: result.gap_candidates?.length || 0,
        durationMs: totalDuration
      });
    } catch (err) {
      logger.error('Research pipeline failed', { projectId, error: String(err) });
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ERROR' }
      });
      await prisma.agentRun.create({
        data: {
          projectId,
          agentName: 'REPORT',
          status: 'ERROR',
          errorMessage: err instanceof Error ? err.message : String(err),
          startedAt: new Date(startTime),
          completedAt: new Date()
        }
      });
      this.emitEvent(projectId, 'run.failed', {
        projectId,
        error: err instanceof Error ? err.message : 'Unknown research pipeline failure'
      });
    }
  },

  async getPapers(userId: string, projectId: string): Promise<PaperDTO[]> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const papers = await prisma.paper.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    return papers.map((p) => ({
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
    }));
  },

  async getGaps(userId: string, projectId: string): Promise<GapCandidateDTO[]> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const gaps = await prisma.gapCandidate.findMany({
      where: { projectId },
      include: { evidence: true },
      orderBy: { coOccurrenceScore: 'desc' }
    });

    return gaps.map((g) => ({
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
      evidence: g.evidence.map((e) => ({
        id: e.id,
        paperTitle: e.paperTitle,
        paperDoi: e.paperDoi,
        passage: e.passage,
        pageNumber: e.pageNumber,
        sectionTitle: e.sectionTitle,
        relation: e.relation as GapCandidateDTO['evidence'][0]['relation']
      }))
    }));
  },

  async getReport(userId: string, projectId: string): Promise<ReportDTO | null> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const report = await prisma.report.findUnique({
      where: { projectId }
    });
    if (!report) return null;

    return {
      id: report.id,
      projectId: report.projectId,
      content: report.content,
      isPublic: report.isPublic,
      createdAt: report.createdAt.toISOString()
    };
  },

  async askQuestion(userId: string, projectId: string, prompt: string): Promise<{ answer: string }> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const res = await fetch(`${env.AI_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': env.AI_SERVICE_SECRET
      },
      body: JSON.stringify({ prompt, project_id: projectId })
    });

    if (!res.ok) {
      throw httpErrors.internal('AI service failed to answer question', 'AI_SERVICE_ERROR');
    }

    const data = (await res.json()) as { response: string };
    return { answer: data.response };
  },

  async exportMarkdown(userId: string, projectId: string): Promise<string> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const report = await prisma.report.findUnique({ where: { projectId } });
    if (!report) throw httpErrors.notFound('Report not yet generated for this project', 'REPORT_NOT_FOUND');

    return report.content;
  },

  async exportBibTeX(userId: string, projectId: string): Promise<string> {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw httpErrors.notFound('Project not found', 'PROJECT_NOT_FOUND');

    const papers = await prisma.paper.findMany({ where: { projectId } });
    if (!papers.length) return '% No papers indexed for this project yet.\n';

    const entries = papers.map((p, idx) => {
      const citeKey = p.doi
        ? p.doi.replace(/[^a-zA-Z0-9]/g, '_')
        : `paper_${idx + 1}_${p.year || 'nd'}`;
      const firstAuthor = p.authors[0] || 'Unknown';
      const authorList = p.authors.length ? p.authors.join(' and ') : 'Unknown';
      const yearStr = p.year ? `${p.year}` : 'n.d.';

      return (
        `@article{${citeKey},\n` +
        `  title = {${p.title}},\n` +
        `  author = {${authorList}},\n` +
        `  year = {${yearStr}},\n` +
        `  journal = {${p.venue || p.source}},\n` +
        (p.doi ? `  doi = {${p.doi}},\n` : '') +
        (p.pdfUrl ? `  url = {${p.pdfUrl}},\n` : '') +
        `}`
      );
    });

    return entries.join('\n\n') + '\n';
  }
};
