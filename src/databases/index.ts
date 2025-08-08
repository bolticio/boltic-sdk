// Export the databases client functionality
// Note: This is a facade to the actual implementation in the databases folder

// Type definitions for the databases client
export interface ClientOptions {
  environment?: 'dev' | 'sit' | 'staging' | 'prod';
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  timeout?: number;
  debug?: boolean;
}

// Import types from the actual implementation for proper auto-completion
export interface DatabaseContext {
  databaseId: string;
  databaseName: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Table-related types
export interface TableRecord {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_shared?: boolean;
  row_count?: number;
  [key: string]: unknown;
}

export interface FieldDefinition {
  name: string;
  type: string;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  default_value?: unknown;
  [key: string]: unknown;
}

export interface TableCreateRequest {
  name: string;
  description?: string;
  fields?: FieldDefinition[];
}

export interface TableUpdateRequest {
  name?: string;
  description?: string;
}

export interface TableAccessRequest {
  table_name: string;
  is_shared: boolean;
}

export interface TableQueryOptions {
  where?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  };
  fields?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
}

export interface TableDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

// Column-related types
export interface ColumnDetails {
  id: string;
  name: string;
  type: string;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  is_visible?: boolean;
  default_value?: unknown;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ColumnQueryOptions {
  where?: {
    id?: string;
    name?: string;
    type?: string;
    [key: string]: unknown;
  };
  fields?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
}

export interface ColumnUpdateOptions {
  where: {
    id?: string;
    name?: string;
  };
  set: Partial<ColumnDetails>;
}

export interface ColumnDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

// Tables operations interface
export interface TablesOperations {
  create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>>;
  findAll(options?: TableQueryOptions): Promise<ApiResponse<TableRecord[]>>;
  findOne(options: TableQueryOptions): Promise<ApiResponse<TableRecord | null>>;
  update(
    identifier: string,
    data: TableUpdateRequest
  ): Promise<ApiResponse<TableRecord>>;
  rename(oldName: string, newName: string): Promise<ApiResponse<TableRecord>>;
  setAccess(data: TableAccessRequest): Promise<ApiResponse<TableRecord>>;
  delete(options: TableDeleteOptions | string): Promise<ApiResponse<boolean>>;
  getMetadata(name: string): Promise<ApiResponse<TableRecord | null>>;
}

// Columns operations interface
export interface ColumnsOperations {
  create(
    tableName: string,
    column: FieldDefinition
  ): Promise<ApiResponse<ColumnDetails>>;
  findAll(
    tableName: string,
    options?: ColumnQueryOptions
  ): Promise<ApiResponse<ColumnDetails[]> & { pagination?: PaginationInfo }>;
  findOne(
    tableName: string,
    options: ColumnQueryOptions
  ): Promise<ApiResponse<ColumnDetails | null>>;
  update(
    tableName: string,
    options: ColumnUpdateOptions
  ): Promise<ApiResponse<ColumnDetails>>;
  delete(
    tableName: string,
    options: ColumnDeleteOptions
  ): Promise<ApiResponse<{ success: boolean; message?: string }>>;
}

// Main BolticClient interface with proper types
export interface BolticClient {
  // Database context management
  useDatabase(databaseId: string, databaseName?: string): void;
  getCurrentDatabase(): DatabaseContext | null;
  getDatabaseContext(): DatabaseContext | null;

  // Resource operations
  tables: TablesOperations;
  columns: ColumnsOperations;

  // Utility methods
  validateApiKey(): Promise<boolean>;
  isAuthenticated(): boolean;
}

// Import the actual BolticClient implementation directly
import {
  createClient as dbCreateClient,
  type ClientOptions as DbClientOptions,
} from '../../databases/src/client';

// Simple createClient function that uses the bundled databases implementation
export function createClient(
  apiKey: string,
  options: ClientOptions = {}
): BolticClient {
  try {
    // Convert our ClientOptions to the databases ClientOptions format
    const dbOptions: DbClientOptions = {
      environment: options.environment as DbClientOptions['environment'],
      retryAttempts: options.retryAttempts,
      retryDelay: options.retryDelay,
      headers: options.headers,
      timeout: options.timeout,
      debug: options.debug,
    };

    // Use the directly imported databases createClient function
    return dbCreateClient(apiKey, dbOptions) as BolticClient;
  } catch (error: unknown) {
    throw new Error(
      `Failed to initialize BolticClient: ${error instanceof Error ? error.message : String(error)}. ` +
        `API Key: ${apiKey ? '[PROVIDED]' : '[MISSING]'}, ` +
        `Options: ${JSON.stringify(Object.keys(options))}`
    );
  }
}

// Re-export for convenience
export type { ClientOptions as DatabaseClientOptions };

// Version info
export const DATABASES_VERSION = '1.0.0';
