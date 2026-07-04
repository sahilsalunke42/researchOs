import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { CONSTANTS } from '../../src/config/constants.js';

const app = createApp();

async function reset() { await prisma.user.deleteMany(); }

describe('POST /api/auth/register', () => {
  beforeEach(reset);

  it('creates user and sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123', name: 'A' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies?.some(c => c.startsWith(`${CONSTANTS.COOKIE_NAME}=`))).toBe(true);
  });

  it('rejects invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(reset);

  it('returns 401 for unknown user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 200 for correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123', name: 'A' });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(reset);

  it('401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('200 with cookie', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123', name: 'A' });
    const cookie = (reg.headers['set-cookie'] as unknown as string[])[0]!;
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies?.some(c => c.startsWith(`${CONSTANTS.COOKIE_NAME}=`) && /Expires=Thu, 01 Jan 1970/.test(c))).toBe(true);
  });
});
