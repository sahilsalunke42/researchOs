import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/db/prisma.js';

describe('prisma client', () => {
  it('exposes a PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.user.findMany).toBe('function');
    expect(typeof prisma.project.findMany).toBe('function');
  });
});
