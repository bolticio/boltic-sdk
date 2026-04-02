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

// Export serverless module
export { ServerlessResource } from './services/serverless/src/client';
export { ServerlessApiClient } from './services/serverless/src/api';
export {
  STATUS_POLLING_INTERVAL_MS,
  MAX_STATUS_POLLING_ATTEMPTS,
  TERMINAL_STATUSES,
  DEFAULT_RESOURCES,
  DEFAULT_SCALING,
} from './services/serverless/src/constants';
export type {
  ServerlessApiEndpoint,
  ServerlessRuntime,
  ServerlessStatus,
  ServerlessScaling,
  ServerlessResources,
  ServerlessCodeOpts,
  ServerlessContainerOpts,
  ServerlessPortMap,
  ServerlessGitRepository,
  ServerlessAppDomain,
  ServerlessConfig,
  ServerlessData,
  ListServerlessParams,
  ListServerlessData,
  GetServerlessParams,
  GetServerlessData,
  CreateServerlessParams,
  CreateServerlessData,
  UpdateServerlessParams,
  UpdateServerlessData,
  ServerlessBuildStatusEntry,
  ServerlessBuild,
  GetBuildsParams,
  GetBuildsData,
  ServerlessLogEntry,
  GetLogsParams,
  GetLogsData,
  ServerlessBuildLogEntry,
  GetBuildLogsParams,
  GetBuildLogsData,
} from './services/serverless/src/types';


export { StorageResource } from './services/storage/src/client';
export {
  StorageApiClient,
  STORAGE_ENDPOINTS,
  buildStorageEndpointPath,
} from './services/storage/src/api';
export {
  DEFAULT_STORAGE_TYPE,
  MAX_SIGNED_URL_EXPIRE_MINUTES,
} from './services/storage/src/constants';
export type {
  StorageApiEndpoint,
  ListStorageParams,
  StorageListFilesPayload,
  StorageListItem,
  ListStorageData,
  CreateFolderParams,
  CreateFolderData,
  DeleteFileParams,
  DeleteFileData,
  ChangeObjectAccessParams,
  ObjectAccessSummary,
  UploadMultipartFields,
  UploadParams,
  UploadData,
  DownloadFileParams,
  DownloadFileData,
  StorageResponse,
} from './services/storage/src/types';

// Version information
export const VERSION = '1.0.0';
