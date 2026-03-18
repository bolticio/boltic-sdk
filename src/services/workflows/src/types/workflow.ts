/**
 * Workflow module types
 *
 * Domain-specific request/response shapes for workflow APIs.
 * Common infrastructure types (Region, Environment, response wrappers,
 * client config) are imported from the shared common module.
 */

import type {
  Region,
  Environment,
  BolticSuccessResponse,
  BolticErrorResponse,
  BaseApiClientConfig,
} from '../../../common';

// Re-export shared types so consumers can import from one place
export type {
  Region,
  Environment,
  BolticSuccessResponse,
  BolticErrorResponse,
  BaseApiClientConfig,
};

/** @deprecated Use `BolticSuccessResponse` directly */
export type WorkflowSuccessResponse<T> = BolticSuccessResponse<T>;
/** @deprecated Use `BolticErrorResponse` directly */
export type WorkflowErrorResponse = BolticErrorResponse;
/** @deprecated Use `BolticSuccessResponse<T> | BolticErrorResponse` directly */
export type WorkflowApiResponse<T> =
  | BolticSuccessResponse<T>
  | BolticErrorResponse;

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
  // activity_data: {
  //   id: string;
  //   properties: Record<string, unknown>;
  //   status: string;
  // };
}

/** Properties describing the activity to execute (dynamic, varies by integration) */
export type ActivityProperties = Record<string, unknown>;

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
// Get Integration Resource (schema) – user-facing params
// ---------------------------------------------------------------------------

/** Parameters accepted by `workflow.getIntegrationResource()`. */
export interface GetIntegrationResourceParams {
  /** Integration slug identifier (e.g. "blt-int.asana"). */
  integration_slug: string;
}

/** Data returned from the get-integration-resource API */
export type IntegrationResourceData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Get Integration Form (fields) – user-facing params
// ---------------------------------------------------------------------------

/** Parameters accepted by `workflow.getIntegrationForm()`. */
export interface GetIntegrationFormParams {
  /** Integration slug identifier (e.g. "blt-int.asana"). */
  integration_slug: string;

  /** Resource type (e.g. "project", "task"). */
  resource: string;

  /** Operation type (e.g. "create", "update", "read"). */
  operation: string;

  /** Credential secret for the integration. */
  secret: string;

  /**
   * When `true`, returns only the form schema without executing.
   * @defaultValue true
   */
  getFormOnly?: boolean;

  /**
   * When `true`, the response `data` is returned as a JSON Schema object
   * describing the expected input shape (type, required, default, enum).
   *
   * When `false` or omitted, the response `data` is a flat JSON object
   * with default/fallback values for each field.
   *
   * @defaultValue false
   */
  asJsonSchema?: boolean;
}

/** Data returned from the get-integration-form API */
export type IntegrationFormData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Form field shape (raw API response)
// ---------------------------------------------------------------------------

/** A single field in the integration form response */
export interface FormField {
  name: string;
  meta: {
    displayType?: string;
    value?: unknown;
    validation?: { required?: boolean; [key: string]: unknown };
    options?: Array<{ label: string; value: string }>;
    description?: string;
    placeholder?: string;
    displayName?: string;
    config?: Record<string, unknown>;
    htmlProps?: Record<string, unknown>;
    dependencies?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// JSON Schema output
// ---------------------------------------------------------------------------

/** A single property in the generated JSON Schema */
export interface JsonSchemaProperty {
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: string[];
}

/** JSON Schema output for an integration form */
export interface IntegrationFormJsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
}
