// Main SDK exports
export { BolticClient, createClient } from './client';
export type { ClientOptions } from './client';

// Type exports for external use
export type {
  ColumnDetails,
  ColumnQueryOptions,
  ColumnUpdateRequest,
} from './types/api/column';
export type {
  RecordData,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordWithId,
} from './types/api/record';
export type {
  FieldDefinition,
  TableCreateRequest,
  TableRecord,
  TableUpdateRequest,
} from './types/api/table';

// Response types and helpers - Essential for type checking
export { isErrorResponse, isListResponse } from './types/common/responses';
export type {
  ApiResponse,
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
  BulkResponse,
  ErrorResponse,
  QueryOptions,
  SuccessResponse,
} from './types/common/responses';

// Pagination and operation types
export type { PaginationInfo } from './types/common/operations';

// Utility classes for schema and column management
export { ColumnHelpers } from './utils/column/helpers';
export { SchemaHelpers } from './utils/table/schema-helpers';

// Filter utilities and constants
export {
  buildApiFilters,
  createFilter,
  FILTER_OPERATORS,
  FilterBuilder,
  mapFiltersToWhere,
  mapWhereToFilters,
  normalizeFilters,
} from './utils/filters/filter-mapper';
export type { ApiFilter } from './utils/filters/filter-mapper';

// Builder creation functions
export { createColumnBuilder } from './client/resources/column-builder';
export { createRecordBuilder } from './client/resources/record-builder';
export { createTableBuilder } from './client/resources/table-builder';

// Error handling utilities
export {
  ApiError,
  createErrorWithContext,
  formatError,
  getHttpStatusCode,
  isNetworkError,
  ValidationError,
} from './errors/utils';
export type { ValidationFailure } from './errors/utils';

// HTTP adapter types for advanced users
export type {
  HttpAdapter,
  HttpRequestConfig,
  HttpResponse,
} from './utils/http/adapter';

// Testing utilities for SDK users
export {
  createErrorResponse,
  createMockResponse,
  createTestClient,
} from './testing/test-client';
export type { MockClientOptions } from './testing/test-client';

// Export all errors
export * from './errors';

// Export all types
export * from './types';

// SQL exports
export * from './client/resources/sql';

// Version information
export const VERSION = '1.0.0';
