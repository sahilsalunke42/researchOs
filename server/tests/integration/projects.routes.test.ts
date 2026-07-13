import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

const app = createApp();

async function reset() {
  await prisma.agentRun.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function auth() {
  const email = `u${Math.random()}@x.com`;
  const reg = await request(app).post('/api/auth/register').send({ email, password: 'password123', name: 'U' });
  const cookie = (reg.headers['set-cookie'] as unknown as string[])[0]!;
  return { cookie, userId: reg.body.user.id };
}

describe('projects routes', () => {
  beforeEach(reset);

  it('401 without cookie', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('creates and lists projects', async () => {
    const { cookie } = await auth();
    const create = await request(app)
      .post('/api/projects')
      .set('Cookie', cookie)
      .send({ name: 'P', topic: 'Quantum', paperLimit: 10 });
    expect(create.status).toBe(200);
    expect(create.body.project.status).toBe('QUEUED');

    const list = await request(app).get('/api/projects').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.projects).toHaveLength(1);
    expect(list.body.projects[0].name).toBe('P');
  });

  it('rejects invalid paperLimit', async () => {
    const { cookie } = await auth();
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', cookie)
      .send({ name: 'P', topic: 'T', paperLimit: 999 });
    expect(res.status).toBe(400);
  });

  it('GET /:id returns own project', async () => {
    const { cookie } = await auth();
    const c = await request(app).post('/api/projects').set('Cookie', cookie).send({ name: 'P', topic: 'T', paperLimit: 5 });
    const res = await request(app).get(`/api/projects/${c.body.project.id}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe(c.body.project.id);
  });

  it('GET /:id 404 for other user', async () => {
    const a = await auth();
    const b = await auth();
    const c = await request(app).post('/api/projects').set('Cookie', a.cookie).send({ name: 'P', topic: 'T', paperLimit: 5 });
    const res = await request(app).get(`/api/projects/${c.body.project.id}`).set('Cookie', b.cookie);
    expect(res.status).toBe(404);
  });

  it('DELETE removes project', async () => {
    const { cookie } = await auth();
    const c = await request(app).post('/api/projects').set('Cookie', cookie).send({ name: 'P', topic: 'T', paperLimit: 5 });
    const del = await request(app).delete(`/api/projects/${c.body.project.id}`).set('Cookie', cookie);
    expect(del.status).toBe(200);
    const list = await request(app).get('/api/projects').set('Cookie', cookie);
    expect(list.body.projects).toHaveLength(0);
  });
});
