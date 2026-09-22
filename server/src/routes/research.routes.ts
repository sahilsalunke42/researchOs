import { Router } from 'express';
import { z } from 'zod';
import { researchController } from '../controllers/research.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const researchSchema = z.object({
  topic: z.string().min(1).max(500),
  paperLimit: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(10)
  ]),
  projectId: z.string().uuid().optional()
});

export const researchRoutes = Router();
researchRoutes.use(requireAuth);
researchRoutes.post('/', validate({ body: researchSchema }), researchController.run);
