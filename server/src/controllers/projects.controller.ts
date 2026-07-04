import type { Request, Response, NextFunction } from 'express';
import { projectsService } from '../services/projects.service.js';

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
  }
};
