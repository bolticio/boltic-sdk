import { ColumnQueryOptions, ColumnUpdateRequest } from '../types/api/column';
import {
  DatabaseCreateRequest,
  DatabaseJobQueryOptions,
  DatabaseQueryOptions,
  DatabaseUpdateRequest,
} from '../types/api/database';
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
import {
  BolticErrorResponse,
  BolticSuccessResponse,
  isErrorResponse,
} from '../types/common/responses';
import { Environment, EnvironmentConfig } from '../types/config/environment';
import { TextToSQLOptions } from '../types/sql';
import { HttpRequestConfig, HttpResponse } from '../utils/http/adapter';
import { AuthManager } from './core/auth-manager';
import { BaseClient } from './core/base-client';
import { ClientConfig, ConfigManager } from './core/config';
import { ColumnResource } from './resources/column';
import { DatabaseResource } from './resources/database';
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
  databaseId?: string;
  dbInternalName?: string;
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
  private databaseResource: DatabaseResource;
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

    // Initialize Database operations
    this.databaseResource = new DatabaseResource(this.baseClient);

    // Set default database context (will use default database in API if not specified)
    this.currentDatabase = null;
  }

  /**
   * Get current database context
   */
  getCurrentDatabase(): DatabaseContext | null {
    return this.currentDatabase;
  }

  /**
   * Switch to a different database using its internal name (slug).
   * All subsequent operations will use this database.
   *
   * If no internal name is provided, the SDK will switch back to the default database.
   *
   * @param dbInternalName - Database internal name/slug to switch to. If omitted or empty, default DB is used.
   *
   * @example
   * ```typescript
   * // Switch to a specific database by slug
   * await client.useDatabase('my_database_slug');
   *
   * // Switch back to default database
   * await client.useDatabase();
   * ```
   */
  async useDatabase(dbInternalName?: string): Promise<void> {
    // Reset to default database if no slug is provided
    console.log(`Database internal name:${dbInternalName}`);
    if (!dbInternalName || dbInternalName === '') {
      this.currentDatabase = null;
      return;
    }

    // Look up the database by its internal name (slug)
    const result: BolticSuccessResponse<unknown> | BolticErrorResponse =
      await this.databaseResource.findOne(dbInternalName);
    console.log(`Result:${JSON.stringify(result, null, 2)}`);
    if (isErrorResponse(result)) {
      console.log(`Error:${result.error.message}`);
      throw new Error(
        result.error.message ||
          `Failed to switch database to internal name '${dbInternalName}'`
      );
    }

    const db = result.data as { id: string; db_internal_name?: string };

    this.currentDatabase = {
      databaseId: db.id,
      dbInternalName: db.db_internal_name || dbInternalName,
    };
  }

  // Direct database operations
  get databases() {
    return {
      create: (data: DatabaseCreateRequest) =>
        this.databaseResource.create(data),
      findAll: (options?: DatabaseQueryOptions) =>
        this.databaseResource.findAll(options),
      findOne: (dbInternalName: string, options?: { fields?: string[] }) =>
        this.databaseResource.findOne(dbInternalName, options),
      getDefault: () => this.databaseResource.getDefault(),
      update: (dbInternalName: string, data: DatabaseUpdateRequest) =>
        this.databaseResource.update(dbInternalName, data),
      delete: (dbInternalName: string) =>
        this.databaseResource.delete(dbInternalName),
      listJobs: (options?: DatabaseJobQueryOptions) =>
        this.databaseResource.listJobs(options),
      pollDeleteStatus: (jobId: string) =>
        this.databaseResource.pollDeleteStatus(jobId),
    };
  }

  // Direct table operations
  get tables() {
    const dbId = this.currentDatabase?.databaseId;
    return {
      create: (data: TableCreateRequest) =>
        this.tableResource.create(data, dbId),
      findAll: (options?: TableQueryOptions) =>
        this.tableResource.findAll(options, dbId),
      findById: (id: string) => this.tableResource.findById(id, dbId),
      findByName: (name: string) => this.tableResource.findByName(name, dbId),
      findOne: (options: TableQueryOptions) =>
        this.tableResource.findOne(options, dbId),
      update: (name: string, data: TableUpdateRequest) =>
        this.tableResource.update(name, data, dbId),
      delete: (name: string) => this.tableResource.delete(name, dbId),
      rename: (oldName: string, newName: string) =>
        this.tableResource.rename(oldName, newName, dbId),
      setAccess: (request: { table_name: string; is_shared: boolean }) =>
        this.tableResource.setAccess(request, dbId),
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
      deleteIndex: (tableName: string, indexName: string) =>
        this.indexResource.deleteIndex(tableName, indexName),
    };
  }

  // Fluent table operations
  table(name: string): TableBuilder {
    const tableBuilder = createTableBuilder({ name });
    return tableBuilder;
  }

  // Table-scoped operations for method chaining
  from(tableName: string) {
    const dbId = this.currentDatabase?.databaseId;
    return {
      // Index operations for this table
      indexes: () => ({
        addIndex: (payload: AddIndexRequest) =>
          this.indexResource.addIndex(tableName, payload, dbId),
        listIndexes: (query: ListIndexesQuery) =>
          this.indexResource.listIndexes(tableName, query, dbId),
        deleteIndex: (indexName: string) =>
          this.indexResource.deleteIndex(tableName, indexName, dbId),
      }),
      // Record operations for this table
      records: () => ({
        insert: (data: RecordData) =>
          this.recordResource.insert(tableName, data, dbId),
        insertMany: (
          records: RecordData[],
          options?: { validation?: boolean }
        ) => this.recordResource.insertMany(tableName, records, options, dbId),
        findOne: (recordId: string) =>
          this.recordResource.get(tableName, recordId, dbId),
        update: (options: RecordUpdateOptions) =>
          this.recordResource.update(tableName, options, dbId),
        updateById: (recordId: string, data: RecordData) =>
          this.recordResource.updateById(tableName, recordId, data, dbId),
        delete: (options: RecordDeleteOptions) =>
          this.recordResource.delete(tableName, options, dbId),
        deleteById: (recordId: string) =>
          this.recordResource.deleteById(tableName, recordId, dbId),
      }),
    };
  }

  // Direct record operations
  get records() {
    const dbId = this.currentDatabase?.databaseId;
    return {
      insert: (tableName: string, data: RecordData) =>
        this.recordResource.insert(tableName, data, dbId),
      insertMany: (
        tableName: string,
        records: RecordData[],
        options?: { validation?: boolean }
      ) => this.recordResource.insertMany(tableName, records, options, dbId),
      findAll: (tableName: string, options?: RecordQueryOptions) =>
        this.recordResource.list(tableName, options, dbId),
      findOne: (
        tableName: string,
        recordId: string,
        options?: { show_decrypted?: boolean }
      ) => this.recordResource.get(tableName, recordId, options, dbId),
      update: (tableName: string, options: RecordUpdateOptions) =>
        this.recordResource.update(tableName, options, dbId),
      updateById: (
        tableName: string,
        recordId: string,
        data: RecordData,
        options?: { show_decrypted?: boolean }
      ) =>
        this.recordResource.updateById(
          tableName,
          recordId,
          data,
          options,
          dbId
        ),
      delete: (tableName: string, options: RecordDeleteOptions) =>
        this.recordResource.delete(tableName, options, dbId),
      deleteById: (tableName: string, recordId: string) =>
        this.recordResource.deleteById(tableName, recordId, dbId),
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
    const dbId = this.currentDatabase?.databaseId;
    return {
      textToSQL: (prompt: string, options?: TextToSQLOptions) =>
        this.sqlResource.textToSQL(prompt, options, dbId),
      executeSQL: (query: string) => this.sqlResource.executeSQL(query, dbId),
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
    this.databaseResource = new DatabaseResource(this.baseClient);
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
