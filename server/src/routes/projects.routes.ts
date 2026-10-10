import { Router } from 'express';
import { z } from 'zod';
import { projectsController } from '../controllers/projects.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  topic: z.string().min(1).max(2000),
  paperLimit: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(10),
    z.literal(20)
  ])
});

const idParam = z.object({ id: z.string().uuid() });

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);
projectsRoutes.get('/', projectsController.list);
projectsRoutes.post('/', validate({ body: createSchema }), projectsController.create);
projectsRoutes.get('/:id', validate({ params: idParam }), projectsController.get);
projectsRoutes.get('/:id/papers', validate({ params: idParam }), projectsController.papers);
projectsRoutes.get('/:id/report', validate({ params: idParam }), projectsController.report);
projectsRoutes.delete('/:id', validate({ params: idParam }), projectsController.remove);
projectsRoutes.post('/:id/research', validate({ params: idParam }), projectsController.runResearch);
projectsRoutes.get('/:id/papers', validate({ params: idParam }), projectsController.getPapers);
projectsRoutes.get('/:id/report', validate({ params: idParam }), projectsController.getReport);
