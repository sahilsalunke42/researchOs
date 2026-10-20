import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../errors/httpErrors.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    logger.warn(err.message, { requestId: req.id, code: err.code, status: err.status });
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      logger.warn('Foreign key constraint violation', { requestId: req.id, meta: err.meta });
      res.status(400).json({ error: { code: 'INVALID_REFERENCE', message: 'Referenced record does not exist or user session is invalid' } });
      return;
    }
    if (err.code === 'P2025') {
      logger.warn('Record not found', { requestId: req.id, meta: err.meta });
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
      return;
    }
    if (err.code === 'P2002') {
      logger.warn('Unique constraint violation', { requestId: req.id, meta: err.meta });
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Record already exists' } });
      return;
    }
  }

  logger.error('Unhandled error', {
    requestId: req.id,
    error: err instanceof Error ? err.stack : String(err)
  });
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
