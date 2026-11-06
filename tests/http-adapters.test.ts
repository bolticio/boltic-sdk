import { createRequire } from 'node:module';
import type {
  AxiosAdapter as AxiosTransportAdapter,
  AxiosInstance,
} from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AxiosAdapter } from '../src/services/common/http/axios-adapter';
import { FetchAdapter } from '../src/services/common/http/fetch-adapter';

describe('native fetch transport', () => {
  it('encodes query parameters and preserves JSON response data', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ data: ['example'] })
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await new FetchAdapter().request({
      url: 'https://example.invalid/records',
      method: 'GET',
      params: { query: 'a & b', limit: 0, ignored: undefined },
    });
    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.searchParams.get('query')).toBe('a & b');
    expect(parsed.searchParams.get('limit')).toBe('0');
    expect(parsed.searchParams.has('ignored')).toBe(false);
    expect(result.data).toEqual({ data: ['example'] });
  });

  it('preserves structured API errors for caller error handling', async () => {
    const error = {
      error: { code: 'DENIED', message: 'Access denied', meta: [] },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json(error, { status: 403 }))
    );
    const result = await new FetchAdapter().request({
      url: 'https://example.invalid/records',
      method: 'GET',
    });
    expect(result.status).toBe(403);
    expect(result.data).toEqual(error);
  });

  it('returns binary bodies unchanged for storage downloads', async () => {
    const bytes = new Uint8Array([0, 128, 255, 13, 10]);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(bytes))
    );
    const result = await new FetchAdapter().request<ArrayBuffer>({
      url: 'https://example.invalid/download',
      method: 'GET',
      responseType: 'arraybuffer',
    });
    expect(new Uint8Array(result.data)).toEqual(bytes);
  });

  it('decodes binary JSON error bodies rather than hiding their API error', async () => {
    const error = {
      error: { code: 'NOT_FOUND', message: 'File missing', meta: [] },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json(error, { status: 404 }))
    );
    const result = await new FetchAdapter().request({
      url: 'https://example.invalid/download',
      method: 'GET',
      responseType: 'arraybuffer',
    });
    expect(result.data).toEqual(error);
  });

  it('lets native FormData choose its multipart content type', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ data: 'uploaded' })
    );
    vi.stubGlobal('fetch', fetchMock);
    const form = new FormData();
    form.set('file', new Blob(['offline content']), 'example.txt');
    await new FetchAdapter().request({
      url: 'https://example.invalid/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-boltic-token': 'offline-key',
      },
      data: form,
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe(form);
    expect(init?.headers).not.toHaveProperty('Content-Type');
    expect(init?.headers).toHaveProperty('x-boltic-token', 'offline-key');
  });

  it('aborts an outstanding request when its timeout expires', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const pending = new FetchAdapter().request({
        url: 'https://example.invalid/slow',
        method: 'GET',
        timeout: 50,
      });
      const rejected = expect(pending).rejects.toThrow('Request was aborted');
      await vi.advanceTimersByTimeAsync(50);
      await rejected;
      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('optional Axios transport', () => {
  it('uses the installed Axios adapter with JSON, auth and query options', async () => {
    // AxiosAdapter uses the CommonJS entry; use that same instance for its offline adapter.
    const axios: AxiosInstance = createRequire(import.meta.url)('axios');
    const originalAdapter = axios.defaults.adapter;
    const adapter = vi.fn<AxiosTransportAdapter>(async (config) => ({
      data: { data: ['axios-response'] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    axios.defaults.adapter = adapter;
    try {
      const result = await new AxiosAdapter().request({
        url: 'https://example.invalid/records',
        method: 'POST',
        params: { limit: 2 },
        headers: { 'x-boltic-token': 'offline-key' },
        data: { query: 'example' },
      });
      expect(result.data).toEqual({ data: ['axios-response'] });
      expect(adapter).toHaveBeenCalledOnce();
      const [config] = adapter.mock.calls[0];
      expect(config.headers.get('x-boltic-token')).toBe('offline-key');
      expect(config.params).toEqual({ limit: 2 });
      expect(JSON.parse(config.data)).toEqual({ query: 'example' });
    } finally {
      axios.defaults.adapter = originalAdapter;
    }
  });
});
