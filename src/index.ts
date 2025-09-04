// Main SDK exports - Boltic SDK for databases
export * from './auth';
export * from './errors';

// Export databases module - Primary functionality
export { BolticClient, createClient } from './services/databases/src/client';
export type { ClientOptions, Region } from './services/databases/src/client';

// Export response helpers - Essential for error handling
export {
  isErrorResponse,
  isListResponse,
} from './services/databases/src/types/common/responses';
export type {
  ApiResponse,
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
} from './services/databases/src/types/common/responses';

// Export common types
export type {
  FieldDefinition,
  FieldType,
  QueryOperator,
  RecordData,
  RecordWithId,
  TableCreateRequest,
  TableRecord,
  WhereCondition,
} from './services/databases/src/types';

// Version information
export const VERSION = '1.0.0';
