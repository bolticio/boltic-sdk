import { ColumnQueryOptions, ColumnUpdateRequest } from '../types/api/column';
import { AddIndexRequest, ListIndexesQuery } from '../types/api/index';
import {
  RecordData,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordUpdateOptions,
} from '../types/api/record';
import {
  FieldDefinition,
  TableCreateRequest,
  TableQueryOptions,
  TableUpdateRequest,
} from '../types/api/table';
import { Environment, EnvironmentConfig } from '../types/config/environment';
import { TextToSQLOptions } from '../types/sql';
import { HttpRequestConfig, HttpResponse } from '../utils/http/adapter';
import { AuthManager } from './core/auth-manager';
import { BaseClient } from './core/base-client';
import { ClientConfig, ConfigManager } from './core/config';
import { ColumnResource } from './resources/column';
import { IndexResource } from './resources/indexes';
import { RecordResource } from './resources/record';
import { createRecordBuilder, RecordBuilder } from './resources/record-builder';
import { SqlResource } from './resources/sql';
import { TableResource } from './resources/table';
import { createTableBuilder, TableBuilder } from './resources/table-builder';

export interface ClientOptions extends Partial<EnvironmentConfig> {
  environment?: Environment;
  region?: 'asia-south1' | 'us-central1';
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface DatabaseContext {
  databaseName: string;
}

export class BolticClient {
  private configManager: ConfigManager;
  private authManager: AuthManager;
  private baseClient: BaseClient;
  private tableResource: TableResource;
  private columnResource: ColumnResource;
  private recordResource: RecordResource;
  private sqlResource: SqlResource;
  private indexResource: IndexResource;
  private currentDatabase: DatabaseContext | null = null;
  private clientOptions: ClientOptions;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // Store client options
    this.clientOptions = options;

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

    // Initialize record operations
    this.recordResource = new RecordResource(this.baseClient);

    // Initialize SQL operations
    this.sqlResource = new SqlResource(this.baseClient);

    // Initialize Index operations
    this.indexResource = new IndexResource(this.baseClient);

    // Set default database context
    this.currentDatabase = {
      databaseName: 'Default',
    };
  }

  getCurrentDatabase(): DatabaseContext | null {
    return this.currentDatabase;
  }

  // Direct table operations
  get tables() {
    return {
      create: (data: TableCreateRequest) => this.tableResource.create(data),
      findAll: (options?: TableQueryOptions) =>
        this.tableResource.findAll(options),
      findById: (id: string) => this.tableResource.findById(id),
      findByName: (name: string) => this.tableResource.findByName(name),
      findOne: (options: TableQueryOptions) =>
        this.tableResource.findOne(options),
      update: (name: string, data: TableUpdateRequest) =>
        this.tableResource.update(name, data),
      delete: (name: string) => this.tableResource.delete(name),
      rename: (oldName: string, newName: string) =>
        this.tableResource.rename(oldName, newName),
      setAccess: (request: { table_name: string; is_shared: boolean }) =>
        this.tableResource.setAccess(request),
    };
  }

  // Direct column operations
  get columns() {
    return {
      create: (tableName: string, column: FieldDefinition) =>
        this.columnResource.create(tableName, column),
      createMany: (tableName: string, columns: FieldDefinition[]) =>
        this.columnResource.createMany(tableName, columns),
      findAll: (tableName: string, options?: ColumnQueryOptions) =>
        this.columnResource.findAll(tableName, options),
      findOne: (tableName: string, columnName: string) =>
        this.columnResource.get(tableName, columnName),
      findById: (tableName: string, columnId: string) =>
        this.columnResource.findById(tableName, columnId),
      update: (
        tableName: string,
        columnName: string,
        updates: ColumnUpdateRequest
      ) => this.columnResource.update(tableName, columnName, updates),
      delete: (tableName: string, columnName: string) =>
        this.columnResource.delete(tableName, columnName),
    };
  }

  // Direct index operations
  get indexes() {
    return {
      addIndex: (tableName: string, payload: AddIndexRequest) =>
        this.indexResource.addIndex(tableName, payload),
      listIndexes: (tableName: string, query: ListIndexesQuery) =>
        this.indexResource.listIndexes(tableName, query),
      deleteIndex: (indexName: string) =>
        this.indexResource.deleteIndex(indexName),
    };
  }

  // Fluent table operations
  table(name: string): TableBuilder {
    const tableBuilder = createTableBuilder({ name });
    return tableBuilder;
  }

  // Method 3: Table-scoped operations
  from(tableName: string) {
    return {
      // Column operations for this table
      columns: () => ({
        create: (column: FieldDefinition) =>
          this.columnResource.create(tableName, column),
        findAll: (options?: ColumnQueryOptions) =>
          this.columnResource.findAll(tableName, options),
        get: (columnName: string) =>
          this.columnResource.get(tableName, columnName),
        update: (columnName: string, updates: ColumnUpdateRequest) =>
          this.columnResource.update(tableName, columnName, updates),
        delete: (columnName: string) =>
          this.columnResource.delete(tableName, columnName),
      }),

      // Record operations for this table
      records: () => ({
        insert: (data: RecordData) =>
          this.recordResource.insert(tableName, data),
        insertMany: (
          records: RecordData[],
          options?: { validation?: boolean }
        ) => this.recordResource.insertMany(tableName, records, options),
        findOne: (recordId: string) =>
          this.recordResource.get(tableName, recordId),
        update: (options: RecordUpdateOptions) =>
          this.recordResource.update(tableName, options),
        updateById: (recordId: string, data: RecordData) =>
          this.recordResource.updateById(tableName, recordId, data),

        // Unified delete method
        delete: (options: RecordDeleteOptions) =>
          this.recordResource.delete(tableName, options),

        // Single record delete method
        deleteById: (recordId: string) =>
          this.recordResource.deleteById(tableName, recordId),
      }),

      // Fluent record builder for this table
      record: () =>
        createRecordBuilder({
          tableName,
          recordResource: this.recordResource,
        }),

      // Indexes - Method 2: Function chaining under from(tableName)
      indexes: () => ({
        addIndex: (payload: AddIndexRequest) =>
          this.indexResource.addIndex(tableName, payload),
        listIndexes: (query: ListIndexesQuery) =>
          this.indexResource.listIndexes(tableName, query),
        deleteIndex: (indexName: string) =>
          this.indexResource.deleteIndex(indexName),
      }),
    };
  }

  // Direct record operations
  get records() {
    return {
      insert: (tableName: string, data: RecordData) =>
        this.recordResource.insert(tableName, data),
      insertMany: (
        tableName: string,
        records: RecordData[],
        options?: { validation?: boolean }
      ) => this.recordResource.insertMany(tableName, records, options),
      findAll: (tableName: string, options?: RecordQueryOptions) =>
        this.recordResource.list(tableName, options),
      findOne: (tableName: string, recordId: string) =>
        this.recordResource.get(tableName, recordId),
      update: (tableName: string, options: RecordUpdateOptions) =>
        this.recordResource.update(tableName, options),
      updateById: (tableName: string, recordId: string, data: RecordData) =>
        this.recordResource.updateById(tableName, recordId, data),
      delete: (tableName: string, options: RecordDeleteOptions) =>
        this.recordResource.delete(tableName, options),
      deleteById: (tableName: string, recordId: string) =>
        this.recordResource.deleteById(tableName, recordId),
    };
  }

  // Method 4: Create fluent record builder
  record(tableName: string): RecordBuilder {
    return createRecordBuilder({
      tableName,
      recordResource: this.recordResource,
    });
  }

  // Direct SQL operations
  get sql() {
    return {
      textToSQL: (prompt: string, options?: TextToSQLOptions) =>
        this.sqlResource.textToSQL(prompt, options),
      executeSQL: (query: string) => this.sqlResource.executeSQL(query),
    };
  }

  // SQL resource access for testing
  getSqlResource(): SqlResource {
    return this.sqlResource;
  }

  // Configuration management
  updateApiKey(newApiKey: string): void {
    this.configManager.updateConfig({ apiKey: newApiKey });
    this.authManager.updateApiKey(newApiKey);
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.configManager.updateConfig(updates);
    this.baseClient.updateConfig(this.configManager.getConfig());
    this.updateAllResourcesConfig();
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
    interceptor: (
      config: HttpRequestConfig
    ) => HttpRequestConfig | Promise<HttpRequestConfig>
  ): number {
    return this.baseClient.getInterceptors().request.use(interceptor);
  }

  addResponseInterceptor(
    onFulfilled?: (
      response: HttpResponse
    ) => HttpResponse | Promise<HttpResponse>,
    onRejected?: (error: unknown) => unknown
  ): number {
    return this.baseClient
      .getInterceptors()
      .response.use(onFulfilled, onRejected);
  }

  ejectRequestInterceptor(id: number): void {
    this.baseClient.getInterceptors().request.eject(id);
  }

  ejectResponseInterceptor(id: number): void {
    this.baseClient.getInterceptors().response.eject(id);
  }

  // Connection testing
  async testConnection(): Promise<boolean> {
    try {
      return await this.authManager.validateApiKeyAsync();
    } catch (error) {
      return false;
    }
  }

  // Get client version
  getVersion(): string {
    return '1.0.0';
  }

  // Environment helpers
  getEnvironment(): Environment {
    return this.configManager.getConfig().environment;
  }

  getRegion(): string {
    return this.configManager.getConfig().region;
  }

  // Debug helpers
  enableDebug(): void {
    this.configManager.updateConfig({ debug: true });
    this.baseClient.updateConfig(this.configManager.getConfig());
    this.updateAllResourcesConfig();
  }

  disableDebug(): void {
    this.configManager.updateConfig({ debug: false });
    this.baseClient.updateConfig(this.configManager.getConfig());
    this.updateAllResourcesConfig();
  }

  isDebugEnabled(): boolean {
    return this.configManager.getConfig().debug || false;
  }

  // Private method to update all resource configurations
  private updateAllResourcesConfig(): void {
    // Recreate all resources with updated config
    this.tableResource = new TableResource(this.baseClient);
    this.columnResource = new ColumnResource(this.baseClient);
    this.recordResource = new RecordResource(this.baseClient);
    this.sqlResource = new SqlResource(this.baseClient);
    this.indexResource = new IndexResource(this.baseClient);
  }

  // Security methods to prevent API key exposure
  toString(): string {
    const config = this.getConfig();
    return `BolticClient { environment: "${config.environment}", region: "${config.region}", debug: ${config.debug} }`;
  }

  toJSON(): object {
    const config = this.getConfig();
    return {
      environment: config.environment,
      region: config.region,
      debug: config.debug,
      timeout: config.timeout,
      version: this.getVersion(),
    };
  }

  // Custom inspect method for Node.js console logging
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
