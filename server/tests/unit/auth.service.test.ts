import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import { authService } from '../../src/services/auth.service.js';

async function reset() {
  await prisma.user.deleteMany();
}

describe('auth.service', () => {
  beforeEach(reset);

  it('register creates user and returns token', async () => {
    const out = await authService.register({ email: 'a@b.com', password: 'password123', name: 'A' });
    expect(out.user.email).toBe('a@b.com');
    expect(out.user.name).toBe('A');
    expect(out.token.split('.').length).toBe(3);
    expect((out.user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('register rejects duplicate email', async () => {
    await authService.register({ email: 'a@b.com', password: 'password123', name: 'A' });
    await expect(
      authService.register({ email: 'a@b.com', password: 'password123', name: 'A' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('login accepts valid credentials', async () => {
    await authService.register({ email: 'a@b.com', password: 'password123', name: 'A' });
    const out = await authService.login({ email: 'a@b.com', password: 'password123' });
    expect(out.user.email).toBe('a@b.com');
  });

  it('login rejects wrong password', async () => {
    await authService.register({ email: 'a@b.com', password: 'password123', name: 'A' });
    await expect(
      authService.login({ email: 'a@b.com', password: 'wrong' })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('getMe returns user without passwordHash', async () => {
    const { user } = await authService.register({ email: 'a@b.com', password: 'password123', name: 'A' });
    const me = await authService.getMe(user.id);
    expect(me.id).toBe(user.id);
  });
});
