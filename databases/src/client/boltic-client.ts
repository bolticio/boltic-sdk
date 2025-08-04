import {
  TableAccessRequest,
  TableCreateRequest,
  TableDeleteOptions,
  TableQueryOptions,
  TableUpdateRequest,
} from '../types/api/table';
import type {
  Environment,
  EnvironmentConfig,
} from '../types/config/environment';
import type { HttpRequestConfig, HttpResponse } from '../utils/http/adapter';
import { AuthManager } from './core/auth-manager';
import { BaseClient } from './core/base-client';
import { ClientConfig, ConfigManager } from './core/config';
import { TableResource } from './resources/table';
import { TableBuilder } from './resources/table-builder';

export interface ClientOptions extends Partial<EnvironmentConfig> {
  environment?: Environment;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

interface DatabaseContext {
  databaseId: string;
  databaseName: string;
}

export class BolticClient {
  private configManager: ConfigManager;
  private authManager: AuthManager;
  private baseClient: BaseClient;
  private tableResource: TableResource;
  private currentDatabase: DatabaseContext | null = null;

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

    // Initialize table operations
    this.tableResource = new TableResource(this.baseClient);
  }

  // Database context management
  useDatabase(databaseId: string, databaseName?: string): void {
    this.currentDatabase = {
      databaseId,
      databaseName: databaseName || databaseId,
    };
  }

  getCurrentDatabase(): DatabaseContext | null {
    return this.currentDatabase;
  }

  getDatabaseContext(): DatabaseContext | null {
    return this.currentDatabase;
  }

  // Method 1: Direct table operations
  get tables() {
    return {
      create: (data: TableCreateRequest) => this.tableResource.create(data),
      findAll: (options?: TableQueryOptions) =>
        this.tableResource.findAll(options),
      findOne: (options: TableQueryOptions) =>
        this.tableResource.findOne(options),
      update: (identifier: string, data: TableUpdateRequest) =>
        this.tableResource.update(identifier, data),
      rename: (oldName: string, newName: string) =>
        this.tableResource.rename(oldName, newName),
      setAccess: (data: TableAccessRequest) =>
        this.tableResource.setAccess(data),
      delete: (options: TableDeleteOptions | string) =>
        this.tableResource.delete(options),
      getMetadata: (name: string) => this.tableResource.getMetadata(name),
    };
  }

  // Method 2: Fluent table operations
  table(): TableBuilder {
    return new TableBuilder(this.tableResource);
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
