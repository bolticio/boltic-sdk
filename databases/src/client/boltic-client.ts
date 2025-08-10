import {
  ColumnDeleteOptions,
  ColumnQueryOptions,
  ColumnUpdateOptions,
} from '../types/api/column';
import {
  FieldDefinition,
  TableAccessRequest,
  TableCreateRequest,
  TableDeleteOptions,
  TableQueryOptions,
  TableUpdateRequest,
} from '../types/api/table';
import type { Environment, Region } from '../types/config/environment';
import type { HttpRequestConfig, HttpResponse } from '../utils/http/adapter';
import { AuthManager } from './core/auth-manager';
import { BaseClient } from './core/base-client';
import { ClientConfig, ConfigManager } from './core/config';
import { ColumnResource } from './resources/column';
import { ColumnBuilder } from './resources/column-builder';
import { TableResource } from './resources/table';
import { TableBuilder } from './resources/table-builder';

export interface ClientOptions {
  environment?: Environment;
  region?: Region;
  retryAttempts?: number;
  retryDelay?: number;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
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
  private columnResource: ColumnResource;
  private currentDatabase: DatabaseContext | null = null;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // Initialize configuration
    this.configManager = new ConfigManager(
      apiKey,
      options.environment || 'prod',
      options.region || 'asia-south1',
      options
    );
    const config = this.configManager.getConfig();

    // Initialize authentication
    this.authManager = new AuthManager({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries,
    });

    // Initialize HTTP client
    this.baseClient = new BaseClient(config, this.authManager);

    // Initialize table operations
    this.tableResource = new TableResource(this.baseClient);

    // Initialize column operations
    this.columnResource = new ColumnResource(this.baseClient);
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

  // Method 1: Direct column operations
  get columns() {
    return {
      create: (tableName: string, column: FieldDefinition) =>
        this.columnResource.create(tableName, column),
      findAll: (tableName: string, options?: ColumnQueryOptions) =>
        this.columnResource.findAll(tableName, options),
      findOne: (tableName: string, options: ColumnQueryOptions) =>
        this.columnResource.findOne(tableName, options),
      update: (tableName: string, options: ColumnUpdateOptions) =>
        this.columnResource.update(tableName, options),
      delete: (tableName: string, options: ColumnDeleteOptions) =>
        this.columnResource.delete(tableName, options),
    };
  }

  // Method 2: Fluent table operations
  table(): TableBuilder {
    return new TableBuilder({
      name: 'table',
      description: 'Table created via fluent API',
    });
  }

  // Method 2: Fluent column operations with table context
  from(tableName: string) {
    return {
      column: () => new ColumnBuilder(this.columnResource, tableName),
      // This will be extended by Record Operations Agent
    };
  }

  // Configuration and utility methods
  updateApiKey(newApiKey: string): void {
    this.configManager.updateConfig({ apiKey: newApiKey });
    this.authManager.updateApiKey(newApiKey);
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.configManager.updateConfig(updates);
  }

  getConfig(): Omit<ClientConfig, 'apiKey'> {
    const config = this.configManager.getConfig();
    const safeConfig = { ...config };
    delete (safeConfig as any).apiKey;
    return safeConfig;
  }

  async validateApiKey(): Promise<boolean> {
    return this.authManager.validateApiKeyAsync();
  }

  isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }

  getHttpClient(): BaseClient {
    return this.baseClient;
  }

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
    if (type === 'request') {
      this.baseClient.getInterceptors().request.eject(id);
    } else {
      this.baseClient.getInterceptors().response.eject(id);
    }
  }

  // Public client information (safe to expose)
  get info() {
    const config = this.configManager.getConfig();
    return {
      environment: config.environment,
      region: config.region,
      isAuthenticated: this.isAuthenticated(),
      currentDatabase: this.currentDatabase,
      resources: {
        tables: {
          basePath: this.tableResource.getBasePath(),
          available: true,
          operations: [
            'create',
            'findAll',
            'findOne',
            'update',
            'rename',
            'setAccess',
            'delete',
            'getMetadata',
          ],
        },
        columns: {
          basePath: this.columnResource.getBasePath(),
          available: true,
          operations: ['create', 'findAll', 'findOne', 'update', 'delete'],
        },
      },
    };
  }

  // Override toString to show only safe information
  toString(): string {
    return `BolticClient {
  environment: '${this.configManager.getConfig().environment}',
  region: '${this.configManager.getConfig().region}',
  isAuthenticated: ${this.isAuthenticated()},
  currentDatabase: ${this.currentDatabase ? `'${this.currentDatabase.databaseName}'` : 'null'},
  resources: {
    tables: { available: true, operations: [create, findAll, findOne, update, rename, setAccess, delete, getMetadata] },
    columns: { available: true, operations: [create, findAll, findOne, update, delete] }
  }
}`;
  }

  // Override console.log behavior
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.info;
  }

  // Custom inspect method for Node.js
  [Symbol.for('util.inspect.custom')]() {
    return this.info;
  }

  // Override valueOf to return safe info
  valueOf() {
    return this.info;
  }

  // Override toJSON to return safe info
  toJSON() {
    return this.info;
  }
}
