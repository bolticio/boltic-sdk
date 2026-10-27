import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  // Every test must explicitly supply its HTTP response. Never call a real API.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('Unexpected network request in an offline SDK test');
    })
  );
});
