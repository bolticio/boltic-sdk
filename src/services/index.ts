// Common shared infrastructure
export * from './common';

// Main SDK exports
export { createClient } from './databases/src/client';
export * from './databases/src/errors';
export * from './databases/src/types';

// Workflow module
export { WorkflowResource } from './workflows/src/client';
export type {
  ActivityNode,
  ActivityProperties,
  ActivityResultPayload,
  CredentialsListData,
  ExecuteActivityRequestBody,
  ExecuteActivityResponseData,
  ExecuteIntegrationParams,
  GetCredentialsParams,
  GetIntegrationsParams,
  IntegrationExecutionData,
  IntegrationsListData,
  RetryConfig,
  WorkflowApiEndpoint,
  WorkflowApiResponse,
  WorkflowErrorResponse,
  WorkflowSuccessResponse,
} from './workflows/src/types';

// Version information
export const VERSION = '1.0.0';
