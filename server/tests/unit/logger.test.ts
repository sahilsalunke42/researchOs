import { describe, it, expect, vi } from 'vitest';
import { logger } from '../../src/utils/logger.js';

describe('logger', () => {
  it('emits structured JSON with required fields', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    logger.info('hello', { userId: 'u1', requestId: 'r1' });
    expect(spy).toHaveBeenCalled();
    const raw = (spy.mock.calls[0]?.[0] as string) ?? '';
    const line = JSON.parse(raw.trim());
    expect(line.level).toBe('info');
    expect(line.message).toBe('hello');
    expect(line.userId).toBe('u1');
    expect(line.requestId).toBe('r1');
    expect(typeof line.timestamp).toBe('string');
    spy.mockRestore();
  });
});
