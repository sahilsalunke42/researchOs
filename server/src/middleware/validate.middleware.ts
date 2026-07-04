import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { httpErrors } from '../errors/httpErrors.js';

interface Schemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const parsed = schema.safeParse(req[key]);
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => `${i.path.join('.') || key}: ${i.message}`).join('; ');
        return next(httpErrors.badRequest(msg, 'VALIDATION_ERROR'));
      }
      // Assign to a mutable holder; express typings treat body/query as writeable.
      (req as unknown as Record<string, unknown>)[key] = parsed.data;
    }
    next();
  };
}
