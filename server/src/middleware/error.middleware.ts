import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../errors/httpErrors.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  res.setHeader('Content-Type', 'application/json');

  if (err instanceof HttpError) {
    logger.warn(err.message, { requestId: req.id, code: err.code, status: err.status });
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    const msg = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    logger.warn('Zod validation error', { requestId: req.id, issues: err.issues });
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: msg } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`Prisma error [${err.code}]: ${err.message}`, { requestId: req.id, code: err.code });
    if (err.code === 'P2002') {
      res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Requested record was not found.' } });
      return;
    }
    res.status(400).json({ error: { code: 'DATABASE_ERROR', message: 'Database request constraint violation.' } });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error('Prisma initialization error', { requestId: req.id, message: err.message });
    res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database connection failed. Please ensure PostgreSQL is running.' } });
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && (err as Record<string, unknown>).status === 400 && 'body' in err) {
    logger.warn('Malformed JSON request body', { requestId: req.id });
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : String(err);
  logger.error('Unhandled error', {
    requestId: req.id,
    error: err instanceof Error ? err.stack : String(err)
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: process.env.NODE_ENV === 'development' && errorMessage ? errorMessage : 'Internal server error'
    }
  });
};
