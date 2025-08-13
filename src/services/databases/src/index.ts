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
  RecordQueryOptions,
  RecordWithId,
} from './types/api/record';
export type {
  FieldDefinition,
  TableCreateRequest,
  TableRecord,
  TableUpdateRequest,
} from './types/api/table';
export { isErrorResponse, isListResponse } from './types/common/responses';
export type {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
} from './types/common/responses';

// Export all errors
export * from './errors';

// Export all types
export * from './types';

// Version information
export const VERSION = '1.0.0';
