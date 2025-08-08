// Type definitions for databases module
// This file provides basic type definitions without importing external modules

export interface ClientOptions {
  environment?: 'dev' | 'sit' | 'staging' | 'prod';
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  timeout?: number;
  debug?: boolean;
}

export interface DatabaseContext {
  databaseId: string;
  databaseName: string;
}

export interface TablesOperations {
  create(data: unknown): Promise<unknown>;
  findAll(options?: unknown): Promise<unknown>;
  findOne(options: unknown): Promise<unknown>;
  update(identifier: string, data: unknown): Promise<unknown>;
  rename(oldName: string, newName: string): Promise<unknown>;
  setAccess(data: unknown): Promise<unknown>;
  delete(options: unknown): Promise<unknown>;
  getMetadata(name: string): Promise<unknown>;
}

export interface ColumnsOperations {
  create(tableName: string, column: unknown): Promise<unknown>;
  findAll(tableName: string, options?: unknown): Promise<unknown>;
  findOne(tableName: string, options: unknown): Promise<unknown>;
  update(tableName: string, options: unknown): Promise<unknown>;
  delete(tableName: string, options: unknown): Promise<unknown>;
}

export interface BolticClient {
  useDatabase(databaseId: string, databaseName?: string): void;
  getCurrentDatabase(): DatabaseContext | null;
  getDatabaseContext(): DatabaseContext | null;
  tables: TablesOperations;
  columns: ColumnsOperations;
  validateApiKey(): Promise<boolean>;
  isAuthenticated(): boolean;
}
