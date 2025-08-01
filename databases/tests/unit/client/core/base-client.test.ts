import { beforeEach, describe, expect, it } from 'vitest';
import { AuthManager } from '../../../../src/client/core/auth-manager';
import { BaseClient } from '../../../../src/client/core/base-client';
import { ConfigManager } from '../../../../src/client/core/config';

describe('BaseClient', () => {
  let client: BaseClient;
  let authManager: AuthManager;
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager('test-api-key', 'local');
    authManager = new AuthManager({ apiKey: 'test-api-key' });
    client = new BaseClient(configManager.getConfig(), authManager);
  });

  it('should create instance successfully', () => {
    expect(client).toBeDefined();
  });

  it('should add auth headers to requests', () => {
    const authHeaders = authManager.getAuthHeaders();
    expect(authHeaders).toHaveProperty('x-boltic-token');
    expect(authHeaders['x-boltic-token']).toBe('test-api-key');
  });

  it('should provide access to interceptors', () => {
    const interceptors = client.getInterceptors();
    expect(interceptors).toBeDefined();
    expect(interceptors.request).toBeDefined();
    expect(interceptors.response).toBeDefined();
  });

  it('should allow config updates', () => {
    const originalConfig = client.getConfig();
    client.updateConfig({ timeout: 5000 });
    const updatedConfig = client.getConfig();

    expect(updatedConfig.timeout).toBe(5000);
    expect(updatedConfig.timeout).not.toBe(originalConfig.timeout);
  });
});
