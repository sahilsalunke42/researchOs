import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors/httpErrors.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    logger.warn(err.message, { requestId: req.id, code: err.code, status: err.status });
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  logger.error('Unhandled error', {
    requestId: req.id,
    error: err instanceof Error ? err.stack : String(err)
  });
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
