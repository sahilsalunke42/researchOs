import { Router } from 'express';
import { z } from 'zod';
import { projectsController } from '../controllers/projects.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  topic: z.string().min(1).max(2000),
  paperLimit: z.union([z.literal(5), z.literal(10), z.literal(20)])
});

const idParam = z.object({ id: z.string().uuid() });

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);
projectsRoutes.get('/', projectsController.list);
projectsRoutes.post('/', validate({ body: createSchema }), projectsController.create);
projectsRoutes.get('/:id', validate({ params: idParam }), projectsController.get);
projectsRoutes.delete('/:id', validate({ params: idParam }), projectsController.remove);
