import { describe, expect, it, vi } from 'vitest';
import { createClient, isErrorResponse, VERSION } from '../src';
import { ConfigManager } from '../src/services/common/client/config';

const API_KEY = 'offline-client-test-key';

describe('public SDK client', () => {
  it('reports the same public version as the SDK export', () => {
    expect(createClient(API_KEY).getVersion()).toBe(VERSION);
  });

  it('validates credentials before any request', () => {
    expect(() => createClient('')).toThrow('API key');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends database list requests with the public token header and default active filter', async () => {
    const payload = { data: [{ id: 'db-example', db_name: 'Example' }] };
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(payload));
    vi.stubGlobal('fetch', fetchMock);
    const client = createClient(API_KEY, { environment: 'uat', debug: false });
    const result = await client.databases.findAll();
    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe(
      '/service/sdk/boltic-tables/v1/tables/databases/list'
    );
    expect(init?.method).toBe('POST');
    expect(init?.headers).toHaveProperty('x-boltic-token', API_KEY);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      filters: [{ field: 'status', operator: '=', values: ['ACTIVE'] }],
    });
  });

  it('returns a structured API error through the database facade', async () => {
    const payload = {
      error: { code: 'DENIED', message: 'Access denied', meta: [] },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json(payload, { status: 403 }))
    );
    const client = createClient(API_KEY, { environment: 'uat', debug: false });
    const result = await client.databases.findAll();
    expect(isErrorResponse(result)).toBe(true);
    expect(result).toEqual(payload);
  });

  it('omits API credentials from configuration serialization', () => {
    const config = new ConfigManager(API_KEY, 'uat');
    expect(JSON.stringify(config)).not.toContain(API_KEY);
    expect(JSON.stringify(config)).not.toContain('apiKey');
  });

  it('returns serverless environment configuration without logging the response', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const payload = {
      data: {
        ID: 'offline-function',
        Config: { Env: { TOKEN: 'dummy-environment-secret' } },
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json(payload))
    );
    const client = createClient(API_KEY, { environment: 'uat', debug: false });
    expect(await client.serverless.get('offline-function')).toEqual(payload);
    expect(log).not.toHaveBeenCalled();
  });

  it('transforms integration forms without logging raw credential values', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const payload = {
      data: {
        parameters: [
          {
            name: 'secret',
            meta: { displayType: 'text', value: 'dummy-form-secret' },
          },
        ],
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => Response.json(payload))
    );
    const client = createClient(API_KEY, { environment: 'uat', debug: false });
    const result = await client.workflow.getIntegrationForm({
      integration_slug: 'offline-integration',
      resource: 'project',
      operation: 'read',
      secret: 'dummy-selected-credential',
    });
    expect(result.data).toEqual({ secret: 'dummy-selected-credential' });
    expect(log).not.toHaveBeenCalled();
  });
});
