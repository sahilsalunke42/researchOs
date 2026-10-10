import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './utils/requestId.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { defaultLimiter } from './middleware/rateLimit.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { projectsRoutes } from './routes/projects.routes.js';
import { researchRoutes } from './routes/research.routes.js';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.get('/', (_req, res) => {
    res.json({
      name: 'ResearchOS Backend API',
      status: 'online',
      version: '0.1.0',
      health: '/api/health',
      frontend: env.CORS_ORIGIN
    });
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', defaultLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/research', researchRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  });

  app.use(errorMiddleware);
  return app;
}
