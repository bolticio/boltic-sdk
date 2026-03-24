// Main SDK exports - Boltic SDK for databases
export * from './auth';
export * from './errors';

// Common shared infrastructure
export {
  // Types
  type Region,
  type Environment,
  type EnvironmentConfig,
  type RegionHostConfig,
  type AuthConfig,
  type AuthHeaders,
  type TokenInfo,
  type PaginationInfo,

  // Response types & guards
  type BolticSuccessResponse,
  type BolticErrorResponse,
  type BolticListResponse,
  type ApiResponse,
  type QueryOptions,
  isErrorResponse,
  isListResponse,

  // Client infrastructure
  type BaseApiClientConfig,
  type ClientConfig,
  SERVICE_PATHS,
  resolveServiceURL,
} from './services/common';

// Export databases module - Primary functionality
export { BolticClient, createClient } from './services/databases/src/client';
export type { ClientOptions } from './services/databases/src/client';

// Export database-specific types
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

// Export workflow module
export { WorkflowResource } from './services/workflows/src/client';
export type {
  ExecuteIntegrationParams,
  ExecuteActivityResponseData,
  FormField,
  GetCredentialsParams,
  GetIntegrationFormParams,
  GetIntegrationResourceParams,
  GetIntegrationsParams,
  CredentialsListData,
  IntegrationExecutionData,
  IntegrationFormData,
  IntegrationFormJsonSchema,
  IntegrationResourceData,
  IntegrationsListData,
  JsonSchemaProperty,
  WorkflowSuccessResponse,
  WorkflowErrorResponse,
  WorkflowApiResponse,
  ActivityNode,
  ActivityProperties,
  ActivityResultPayload,
  RetryConfig,
} from './services/workflows/src/types';

export {
  transformFormToDefaults,
  transformFormToJsonSchema,
} from './services/workflows/src/utils/form-transformer';

// Version information
export const VERSION = '1.0.0';
