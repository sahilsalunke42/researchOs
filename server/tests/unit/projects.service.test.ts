import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import { projectsService } from '../../src/services/projects.service.js';
import { authService } from '../../src/services/auth.service.js';

async function reset() {
  await prisma.agentRun.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function makeUser() {
  const out = await authService.register({ email: `u${Math.random()}@x.com`, password: 'password123', name: 'U' });
  return out.user.id;
}

describe('projects.service', () => {
  beforeEach(reset);

  it('createProject stores QUEUED status and returns DTO', async () => {
    const userId = await makeUser();
    const p = await projectsService.createProject(userId, { name: 'P', topic: 'T', paperLimit: 20 });
    expect(p.status).toBe('QUEUED');
    expect(p.paperLimit).toBe(20);
    expect(p.agentRuns).toEqual([]);
  });

  it('listProjects returns own projects ordered by updatedAt desc', async () => {
    const userId = await makeUser();
    const a = await projectsService.createProject(userId, { name: 'A', topic: 'T', paperLimit: 5 });
    await new Promise(r => setTimeout(r, 10));
    const b = await projectsService.createProject(userId, { name: 'B', topic: 'T', paperLimit: 5 });
    const list = await projectsService.listProjects(userId);
    expect(list.map(p => p.id)).toEqual([b.id, a.id]);
  });

  it('listProjects excludes other users projects', async () => {
    const u1 = await makeUser();
    const u2 = await makeUser();
    await projectsService.createProject(u1, { name: 'X', topic: 'T', paperLimit: 5 });
    const list = await projectsService.listProjects(u2);
    expect(list).toHaveLength(0);
  });

  it('getProject 404s if not owner', async () => {
    const u1 = await makeUser();
    const u2 = await makeUser();
    const p = await projectsService.createProject(u1, { name: 'X', topic: 'T', paperLimit: 5 });
    await expect(projectsService.getProject(u2, p.id)).rejects.toMatchObject({ status: 404 });
  });

  it('deleteProject 404s if not owner and removes otherwise', async () => {
    const u1 = await makeUser();
    const p = await projectsService.createProject(u1, { name: 'X', topic: 'T', paperLimit: 5 });
    await projectsService.deleteProject(u1, p.id);
    await expect(projectsService.getProject(u1, p.id)).rejects.toMatchObject({ status: 404 });
  });
});
