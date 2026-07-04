import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../../src/middleware/auth.middleware.js';
import { errorMiddleware } from '../../src/middleware/error.middleware.js';
import { env } from '../../src/config/env.js';
import { CONSTANTS } from '../../src/config/constants.js';

function makeApp() {
  const app = express();
  app.use(cookieParser());
  app.get('/x', requireAuth, (req, res) => res.json({ userId: req.userId }));
  app.use(errorMiddleware);
  return app;
}

describe('requireAuth', () => {
  it('401 when no cookie', async () => {
    const res = await request(makeApp()).get('/x');
    expect(res.status).toBe(401);
  });

  it('401 when cookie has bad token', async () => {
    const res = await request(makeApp()).get('/x').set('Cookie', `${CONSTANTS.COOKIE_NAME}=nope`);
    expect(res.status).toBe(401);
  });

  it('passes and sets userId when cookie valid', async () => {
    const token = jwt.sign({ sub: 'user-1' }, env.JWT_SECRET, { expiresIn: 60 });
    const res = await request(makeApp()).get('/x').set('Cookie', `${CONSTANTS.COOKIE_NAME}=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1' });
  });
});
