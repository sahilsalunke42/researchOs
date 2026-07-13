import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '@/lib/api';

const originalFetch = globalThis.fetch;

function mockFetch(status: number, body: unknown) {
  globalThis.fetch = vi.fn().mockImplementation(() => Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  )) as unknown as typeof fetch;
}

describe('api client', () => {
  beforeEach(() => { globalThis.fetch = originalFetch; });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('GET returns parsed body on 200', async () => {
    mockFetch(200, { status: 'ok' });
    const out = await api.get<{ status: string }>('/api/health');
    expect(out).toEqual({ status: 'ok' });
  });

  it('POST sends JSON body and includes credentials', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = spy as unknown as typeof fetch;
    await api.post('/api/x', { a: 1 });
    expect(spy).toHaveBeenCalledWith('/api/x', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ a: 1 })
    }));
  });

  it('throws ApiError with code and status on non-2xx', async () => {
    mockFetch(400, { error: { code: 'BAD', message: 'nope' } });
    await expect(api.get('/x')).rejects.toBeInstanceOf(ApiError);
    try { await api.get('/x'); } catch (err) {
      const e = err as ApiError;
      expect(e.code).toBe('BAD');
      expect(e.status).toBe(400);
      expect(e.message).toBe('nope');
    }
  });
});
