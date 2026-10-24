import { Router } from 'express';
import { z } from 'zod';
import { projectsController } from '../controllers/projects.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  topic: z.string().min(1).max(2000),
  paperLimit: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal(15), z.literal(20)])
});

const idParam = z.object({ id: z.string().uuid() });

const askSchema = z.object({
  prompt: z.string().min(1).max(5000).optional(),
  question: z.string().min(1).max(5000).optional()
}).refine((data) => Boolean(data.prompt || data.question), {
  message: 'prompt or question is required'
});

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);

projectsRoutes.get('/', projectsController.list);
projectsRoutes.post('/', validate({ body: createSchema }), projectsController.create);
projectsRoutes.get('/:id', validate({ params: idParam }), projectsController.get);
projectsRoutes.delete('/:id', validate({ params: idParam }), projectsController.remove);

// Research execution & streaming endpoints
projectsRoutes.post('/:id/run', validate({ params: idParam }), projectsController.run);
projectsRoutes.get('/:id/stream', validate({ params: idParam }), projectsController.stream);

// Research result intelligence endpoints
projectsRoutes.get('/:id/papers', validate({ params: idParam }), projectsController.papers);
projectsRoutes.get('/:id/gaps', validate({ params: idParam }), projectsController.gaps);
projectsRoutes.get('/:id/report', validate({ params: idParam }), projectsController.report);
projectsRoutes.post('/:id/ask', validate({ params: idParam, body: askSchema }), projectsController.ask);

// Export endpoints
projectsRoutes.get('/:id/export/markdown', validate({ params: idParam }), projectsController.exportMarkdown);
projectsRoutes.get('/:id/export/bibtex', validate({ params: idParam }), projectsController.exportBibTeX);
