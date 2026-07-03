import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('env config', () => {
  const original = { ...process.env };
  beforeEach(() => { process.env = { ...original }; });
  afterEach(() => { process.env = original; });

  it('parses a valid env', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.AI_SERVICE_URL = 'http://localhost:8000';
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'development';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    const { loadEnv } = await import('../../src/config/env.js');
    const env = loadEnv();
    expect(env.PORT).toBe(4000);
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('throws when JWT_SECRET is too short', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
    process.env.JWT_SECRET = 'short';
    process.env.AI_SERVICE_URL = 'http://localhost:8000';
    const { loadEnv } = await import('../../src/config/env.js');
    expect(() => loadEnv()).toThrow(/JWT_SECRET/);
  });
});
