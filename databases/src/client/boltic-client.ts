import type {
  Environment,
  EnvironmentConfig,
} from '../types/config/environment';
import type { HttpRequestConfig, HttpResponse } from '../utils/http/adapter';
import { AuthManager } from './core/auth-manager';
import { BaseClient } from './core/base-client';
import { ClientConfig, ConfigManager } from './core/config';

export interface ClientOptions extends Partial<EnvironmentConfig> {
  environment?: Environment;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export class BolticClient {
  private configManager: ConfigManager;
  private authManager: AuthManager;
  private baseClient: BaseClient;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // Initialize configuration
    this.configManager = new ConfigManager(
      apiKey,
      options.environment,
      options
    );
    const config = this.configManager.getConfig();

    // Initialize authentication
    this.authManager = new AuthManager({
      apiKey: config.apiKey,
      maxRetries: config.retryAttempts,
    });

    // Initialize HTTP client
    this.baseClient = new BaseClient(config, this.authManager);
  }

  // Configuration management
  updateApiKey(newApiKey: string): void {
    this.configManager.updateConfig({ apiKey: newApiKey });
    this.authManager.updateApiKey(newApiKey);
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.configManager.updateConfig(updates);
    this.baseClient.updateConfig(this.configManager.getConfig());
  }

  getConfig(): ClientConfig {
    return this.configManager.getConfig();
  }

  // Authentication management
  async validateApiKey(): Promise<boolean> {
    return this.authManager.validateApiKeyAsync();
  }

  isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }

  // HTTP client access
  getHttpClient(): BaseClient {
    return this.baseClient;
  }

  // Interceptor management
  addRequestInterceptor(
    interceptor: (config: HttpRequestConfig) => HttpRequestConfig
  ): number {
    return this.baseClient.getInterceptors().request.use(interceptor);
  }

  addResponseInterceptor(
    onFulfilled?: (response: HttpResponse) => HttpResponse,
    onRejected?: (error: unknown) => unknown
  ): number {
    return this.baseClient
      .getInterceptors()
      .response.use(onFulfilled, onRejected);
  }

  removeInterceptor(type: 'request' | 'response', id: number): void {
    this.baseClient.getInterceptors()[type].eject(id);
  }
}
