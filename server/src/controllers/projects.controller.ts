import type { Request, Response, NextFunction } from 'express';
import { projectsService } from '../services/projects.service.js';
import { researchService } from '../services/research.service.js';
import { logger } from '../utils/logger.js';

export const projectsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectsService.listProjects(req.userId!);
      res.json({ projects });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.createProject(req.userId!, req.body);
      res.json({ project });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getProject(req.userId!, req.params.id!);
      res.json({ project });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectsService.deleteProject(req.userId!, req.params.id!);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      await researchService.triggerResearchRun(req.userId!, req.params.id!);
      res.json({ ok: true, status: 'DISCOVERING' });
    } catch (err) { next(err); }
  },

  async stream(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getProject(req.userId!, req.params.id!);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      res.flushHeaders?.();

      // Send initial status payload
      res.write(`event: project.status\ndata: ${JSON.stringify({ status: project.status, agentRuns: project.agentRuns })}\n\n`);

      // Subscribe to live events
      const unsubscribe = researchService.subscribe(project.id, (event) => {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      });

      // Keepalive heartbeat
      const heartbeat = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 15_000);

      req.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
        logger.debug('SSE client disconnected', { projectId: project.id });
      });
    } catch (err) { next(err); }
  },

  async papers(req: Request, res: Response, next: NextFunction) {
    try {
      const papers = await researchService.getPapers(req.userId!, req.params.id!);
      res.json({ papers });
    } catch (err) { next(err); }
  },

  async gaps(req: Request, res: Response, next: NextFunction) {
    try {
      const gaps = await researchService.getGaps(req.userId!, req.params.id!);
      res.json({ gaps });
    } catch (err) { next(err); }
  },

  async report(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await researchService.getReport(req.userId!, req.params.id!);
      res.json({ report });
    } catch (err) { next(err); }
  },

  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const prompt = req.body.prompt || req.body.question;
      const result = await researchService.askQuestion(req.userId!, req.params.id!, prompt);
      res.json(result);
    } catch (err) { next(err); }
  },

  async exportMarkdown(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await researchService.exportMarkdown(req.userId!, req.params.id!);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.id}.md"`);
      res.send(content);
    } catch (err) { next(err); }
  },

  async exportBibTeX(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await researchService.exportBibTeX(req.userId!, req.params.id!);
      res.setHeader('Content-Type', 'application/x-bibtex; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="citations-${req.params.id}.bib"`);
      res.send(content);
    } catch (err) { next(err); }
  }
};
