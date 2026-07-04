import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './utils/requestId.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { defaultLimiter } from './middleware/rateLimit.middleware.js';
import { authRoutes } from './routes/auth.routes.js';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', defaultLimiter);
  app.use('/api/auth', authRoutes);

  app.use(errorMiddleware);
  return app;
}
