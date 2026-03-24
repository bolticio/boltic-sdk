// Client
export { WorkflowResource } from './client';

// API
export { WorkflowApiClient } from './api';
export { WORKFLOW_ENDPOINTS, buildWorkflowEndpointPath } from './api';

// Constants
export {
  POLLING_INTERVAL_MS,
  MAX_POLLING_ATTEMPTS,
  DEFAULT_RETRY_CONFIG,
  CONTINUE_ON_FAILURE,
  SCHEMA_TYPE_MAPPING,
} from './constants';

// Utilities
export {
  transformFormToDefaults,
  transformFormToJsonSchema,
} from './utils/form-transformer';

// Workflow-specific types (domain types only — response wrappers come from shared module)
export type {
  ActivityNode,
  ActivityProperties,
  ActivityResultPayload,
  CredentialsListData,
  ExecuteActivityRequestBody,
  ExecuteActivityResponseData,
  ExecuteIntegrationParams,
  FormField,
  GetCredentialsParams,
  GetIntegrationFormParams,
  GetIntegrationResourceParams,
  GetIntegrationsParams,
  IntegrationExecutionData,
  IntegrationFormData,
  IntegrationFormJsonSchema,
  IntegrationResourceData,
  IntegrationsListData,
  JsonSchemaProperty,
  RetryConfig,
  WorkflowApiEndpoint,
  WorkflowApiResponse,
  WorkflowErrorResponse,
  WorkflowSuccessResponse,
} from './types';
