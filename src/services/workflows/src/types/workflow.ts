/**
 * Workflow module types
 * Defines request/response shapes for workflow integration execution APIs.
 */

export type Region = 'asia-south1' | 'us-central1';
export type Environment = 'local' | 'sit' | 'uat' | 'prod';

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

/** API endpoint definition for workflow routes */
export interface WorkflowApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
}

// ---------------------------------------------------------------------------
// Execute Integration – user-facing params
// ---------------------------------------------------------------------------

/**
 * Parameters accepted by `workflow.executeIntegration()`.
 *
 * @remarks
 * When `executeOnly` is `false` (default), the SDK will poll
 * `getIntegrationExecuteById` until the execution reaches a terminal state.
 */
export interface ExecuteIntegrationParams {
  /**
   * If `true`, return immediately after the execute call without polling.
   * @defaultValue false
   */
  executeOnly?: boolean;

  /** Activity nodes to include in the request body. */
  nodes: ActivityNode[];

  /**
   * Result/context payload for the execute request.
   * Falls back to a sensible default when omitted.
   */
  result?: ActivityResultPayload;
}

// ---------------------------------------------------------------------------
// Activity node & properties (matches raw API shape)
// ---------------------------------------------------------------------------

/** A single activity node in the execute request body */
export interface ActivityNode {
  id: string;
  data: {
    type: string;
    name: string;
    properties: ActivityProperties;
  };
  activity_data: {
    id: string;
    properties: Record<string, unknown>;
    status: string;
  };
}

/** Properties describing the activity to execute (dynamic, varies by integration) */
export type ActivityProperties = Record<string, any>;

/** Retry configuration for an activity */
export interface RetryConfig {
  maximum_attempts: number;
  backoff_coefficient: number;
  initial_interval: number;
  maximum_interval: number;
}

/** Result/context payload sent alongside activity nodes */
export interface ActivityResultPayload {
  payload: Record<string, unknown>;
  global_variables: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Raw API request / response shapes
// ---------------------------------------------------------------------------

/** Request body sent to the execute-activity API */
export interface ExecuteActivityRequestBody {
  nodes: ActivityNode[];
  result: ActivityResultPayload;
}

/** Data returned from the execute-activity API */
export interface ExecuteActivityResponseData {
  execution_id: string;
  [key: string]: unknown;
}

/** Data returned from the get-execution-by-id API */
export type IntegrationExecutionData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Get Integrations – user-facing params
// ---------------------------------------------------------------------------

/** Parameters accepted by `workflow.getIntegrations()`. */
export interface GetIntegrationsParams {
  /**
   * Page number for pagination.
   * @defaultValue 1
   */
  page?: number;

  /**
   * Number of items per page.
   * @defaultValue 999
   */
  per_page?: number;
}

/** Data returned from the get-integrations API */
export type IntegrationsListData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Get Credentials – user-facing params
// ---------------------------------------------------------------------------

/** Parameters accepted by `workflow.getCredentials()`. */
export interface GetCredentialsParams {
  /** Integration name (e.g. "freshsales"). Automatically uppercased by the SDK. */
  entity: string;

  /**
   * Current page number for pagination.
   * @defaultValue 1
   */
  current_page?: number;

  /**
   * Number of items per page.
   * @defaultValue 999
   */
  page_size?: number;
}

/** Data returned from the get-credentials API */
export type CredentialsListData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Boltic-style response wrappers (local to workflow module)
// ---------------------------------------------------------------------------

/** Workflow API success response */
export interface WorkflowSuccessResponse<T> {
  data: T;
  message?: string;
}

/** Workflow API error response */
export interface WorkflowErrorResponse {
  data?: never;
  error: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

/** Union of success and error responses */
export type WorkflowApiResponse<T> =
  | WorkflowSuccessResponse<T>
  | WorkflowErrorResponse;

// ---------------------------------------------------------------------------
// Client / resource configuration
// ---------------------------------------------------------------------------

/** Configuration for `WorkflowApiClient` */
export interface WorkflowApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
  timeout?: number;
  debug?: boolean;
}

/** Configuration for `WorkflowResource` */
export interface WorkflowResourceConfig {
  apiKey: string;
  environment: Environment;
  region: Region;
  timeout: number;
  debug?: boolean;
}
