import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiModule from '@/lib/api';
import { getSession, login, register, logout, serverGetSession } from '@/lib/auth';

describe('auth helpers', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('getSession returns user when /me succeeds', async () => {
    vi.spyOn(apiModule.api, 'get').mockResolvedValue({ user: { id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' } });
    const user = await getSession();
    expect(user?.email).toBe('a@b.com');
  });

  it('getSession returns null on 401', async () => {
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(new apiModule.ApiError(401, 'NOT_AUTH', 'nope'));
    expect(await getSession()).toBeNull();
  });

  it('login posts to /api/auth/login and returns user', async () => {
    const spy = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ user: { id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' } });
    const user = await login({ email: 'a@b.com', password: 'password123' });
    expect(spy).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'password123' });
    expect(user.email).toBe('a@b.com');
  });

  it('register posts to /api/auth/register', async () => {
    const spy = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ user: { id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' } });
    await register({ email: 'a@b.com', password: 'password123', name: 'A' });
    expect(spy).toHaveBeenCalledWith('/api/auth/register', { email: 'a@b.com', password: 'password123', name: 'A' });
  });

  it('logout posts to /api/auth/logout', async () => {
    const spy = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ ok: true });
    await logout();
    expect(spy).toHaveBeenCalledWith('/api/auth/logout');
  });

  it('serverGetSession calls fetch with cookie header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: '1', email: 'a@b.com', name: 'A', createdAt: 'x' } })
    });
    vi.stubGlobal('fetch', mockFetch);
    const user = await serverGetSession('key=val');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({ headers: { cookie: 'key=val' } })
    );
    expect(user?.email).toBe('a@b.com');
  });
});
