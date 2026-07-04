import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.middleware.js';
import { errorMiddleware } from '../../src/middleware/error.middleware.js';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/x',
    validate({ body: z.object({ name: z.string().min(2) }) }),
    (req, res) => res.json({ name: req.body.name })
  );
  app.use(errorMiddleware);
  return app;
}

describe('validate middleware', () => {
  it('rejects invalid body with 400 VALIDATION_ERROR', async () => {
    const res = await request(makeApp()).post('/x').send({ name: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts valid body', async () => {
    const res = await request(makeApp()).post('/x').send({ name: 'ok' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'ok' });
  });
});
