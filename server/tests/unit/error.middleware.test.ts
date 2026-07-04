import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorMiddleware } from '../../src/middleware/error.middleware.js';
import { HttpError } from '../../src/errors/httpErrors.js';

function makeApp(handler: express.RequestHandler) {
  const app = express();
  app.get('/x', handler);
  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware', () => {
  it('serialises HttpError with status and code', async () => {
    const app = makeApp((_req, _res, next) => next(new HttpError(400, 'BAD_INPUT', 'nope')));
    const res = await request(app).get('/x');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'BAD_INPUT', message: 'nope' } });
  });

  it('maps unknown errors to 500 INTERNAL', async () => {
    const app = makeApp((_req, _res, next) => next(new Error('boom')));
    const res = await request(app).get('/x');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  });
});
