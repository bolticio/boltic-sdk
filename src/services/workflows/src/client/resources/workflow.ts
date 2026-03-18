/**
 * Workflow Resource
 * Provides workflow integration execution and polling operations.
 * Extends BaseResource for consistency with other SDK modules.
 */

import { POLLING_INTERVAL_MS, MAX_POLLING_ATTEMPTS } from '../../constants';
import { WorkflowApiClient } from '../../api/clients/workflow-api-client';
import {
  BaseResource,
  BaseClient,
  isErrorResponse,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type {
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
} from '../../types/workflow';
import {
  transformFormToDefaults,
  transformFormToJsonSchema,
} from '../../utils/form-transformer';

// ---------------------------------------------------------------------------
// Request body builder – isolated so defaults are easy to adjust later
// ---------------------------------------------------------------------------

function buildDefaultResultPayload(): ActivityResultPayload {
  return {
    payload: {},
    global_variables: {},
  };
}

function buildExecuteActivityBody(
  params: ExecuteIntegrationParams
): ExecuteActivityRequestBody {
  return {
    nodes: params.nodes,
    result: params.result ?? buildDefaultResultPayload(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class WorkflowResource extends BaseResource {
  private apiClient: WorkflowApiClient;

  constructor(client: BaseClient) {
    super(client, '/workflows');

    const config = client.getConfig();
    this.apiClient = new WorkflowApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
    });
  }

  /**
   * Execute a workflow integration activity.
   *
   * When `executeOnly` is `true`, returns the immediate API response.
   * When `executeOnly` is `false` (default), polls until a terminal state
   * is reached and returns the final execution result.
   *
   * @param params - Execution parameters
   * @returns The execute response or the final polled result
   *
   * @example
   * ```typescript
   * const result = await client.workflow.executeIntegration({
   *   nodes: [{ id: 'api1', data: { ... }, activity_data: { ... } }],
   * });
   *
   * const fire = await client.workflow.executeIntegration({
   *   nodes: [{ id: 'api1', data: { ... }, activity_data: { ... } }],
   *   executeOnly: true,
   * });
   * ```
   */
  async executeIntegration(
    params: ExecuteIntegrationParams
  ): Promise<
    | BolticSuccessResponse<
        ExecuteActivityResponseData | IntegrationExecutionData
      >
    | BolticErrorResponse
  > {
    const body = buildExecuteActivityBody(params);
    const executeResult = await this.apiClient.executeActivity(body);

    if (isErrorResponse(executeResult)) {
      return executeResult;
    }

    if (params.executeOnly) {
      return executeResult;
    }

    const executionId = executeResult.data?.execution_id;
    if (!executionId) {
      return {
        error: {
          code: 'MISSING_EXECUTION_ID',
          message: 'Execute API response did not contain an execution_id',
          meta: [],
        },
      };
    }

    return this.pollExecution(executionId);
  }

  /**
   * Retrieve the result of a workflow execution by its run/execution ID.
   *
   * @param executionId - The execution run ID
   * @returns The execution data or an error response
   *
   * @example
   * ```typescript
   * const result = await client.workflow.getIntegrationExecuteById('run-uuid');
   * ```
   */
  async getIntegrationExecuteById(
    executionId: string
  ): Promise<
    BolticSuccessResponse<IntegrationExecutionData> | BolticErrorResponse
  > {
    return this.apiClient.getExecutionById(executionId);
  }

  /**
   * Fetch the list of available integrations.
   *
   * @param params - Optional pagination parameters (`page`, `per_page`)
   * @returns The integrations list or an error response
   *
   * @example
   * ```typescript
   * const list = await client.workflow.getIntegrations();
   * ```
   */
  async getIntegrations(
    params: GetIntegrationsParams = {}
  ): Promise<
    BolticSuccessResponse<IntegrationsListData> | BolticErrorResponse
  > {
    return this.apiClient.getIntegrations(params);
  }

  /**
   * Fetch credentials for a given integration entity.
   *
   * @param params - Entity name (required), optional `current_page` and `page_size`
   * @returns The credentials list or an error response
   *
   * @example
   * ```typescript
   * const creds = await client.workflow.getCredentials({ entity: 'freshsales' });
   * ```
   */
  async getCredentials(
    params: GetCredentialsParams
  ): Promise<BolticSuccessResponse<CredentialsListData> | BolticErrorResponse> {
    return this.apiClient.getCredentials(params);
  }

  /**
   * Fetch the resource/operation schema for an integration.
   *
   * Returns the available resources and operations supported by the
   * specified integration (e.g. which resources like "task", "project"
   * are available and what operations can be performed on them).
   *
   * @param params - Integration slug identifier
   * @returns The integration resource schema or an error response
   *
   * @example
   * ```typescript
   * const schema = await client.workflow.getIntegrationResource({
   *   integration_slug: 'blt-int.asana',
   * });
   * ```
   */
  async getIntegrationResource(
    params: GetIntegrationResourceParams
  ): Promise<
    BolticSuccessResponse<IntegrationResourceData> | BolticErrorResponse
  > {
    return this.apiClient.getIntegrationResource(params);
  }

  /**
   * Fetch the form schema (fields) for a specific integration resource + operation.
   *
   * By default, returns a flat JSON object with default/fallback values
   * for each input field. Set `asJsonSchema: true` to get a JSON Schema
   * object describing the expected input shape instead.
   *
   * Fields like `resource` and `operation` are automatically excluded
   * since they are already handled by the SDK parameters. The `secret`
   * field is included and populated with the value from `params.secret`.
   *
   * @param params - Integration slug, resource, operation, credential secret, and format flag
   * @returns Transformed form data or an error response
   *
   * @example
   * ```typescript
   * // Get flat defaults: { name: '', workspace: [], team: '', ... }
   * const defaults = await client.workflow.getIntegrationForm({
   *   integration_slug: 'blt-int.asana',
   *   resource: 'project',
   *   operation: 'create',
   *   secret: 'credential-secret-here',
   * });
   *
   * // Get JSON Schema: { type: 'object', properties: { name: { type: 'string', ... } } }
   * const schema = await client.workflow.getIntegrationForm({
   *   integration_slug: 'blt-int.asana',
   *   resource: 'project',
   *   operation: 'create',
   *   secret: 'credential-secret-here',
   *   asJsonSchema: true,
   * });
   * ```
   */
  async getIntegrationForm(
    params: GetIntegrationFormParams
  ): Promise<
    | BolticSuccessResponse<
        Record<string, unknown> | IntegrationFormJsonSchema
      >
    | BolticErrorResponse
  > {
    const rawResult = await this.apiClient.getIntegrationForm(params);

    if (isErrorResponse(rawResult)) {
      return rawResult;
    }

    const fields = (rawResult.data as unknown as FormField[]) ?? [];

    const transformed = params.asJsonSchema
      ? transformFormToJsonSchema(fields)
      : transformFormToDefaults(fields);

    if (params.asJsonSchema) {
      const schema = transformed as IntegrationFormJsonSchema;
      if (schema.properties.secret) {
        schema.properties.secret.default = params.secret;
      }
    } else {
      const defaults = transformed as Record<string, unknown>;
      if ('secret' in defaults) {
        defaults.secret = params.secret;
      }
    }

    return {
      data: transformed,
      message: rawResult.message,
    };
  }

  /**
   * Internal polling loop.
   * Repeatedly calls `getExecutionById` until the response `data` object is
   * non-empty (execution finished) or max attempts are exhausted.
   */
  private async pollExecution(
    executionId: string
  ): Promise<
    BolticSuccessResponse<IntegrationExecutionData> | BolticErrorResponse
  > {
    const debug = this.client.getConfig().debug;

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      const result = await this.apiClient.getExecutionById(executionId);

      if (isErrorResponse(result)) {
        return result;
      }

      if (result.data && Object.keys(result.data).length > 0) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log(
            `[WorkflowResource] Execution ${executionId} completed after ${attempt + 1} poll(s)`
          );
        }
        return result;
      }

      await sleep(POLLING_INTERVAL_MS);
    }

    return {
      error: {
        code: 'EXECUTION_TIMEOUT',
        message: `Execution ${executionId} did not complete within ${MAX_POLLING_ATTEMPTS} polling attempts`,
        meta: [
          `execution_id: ${executionId}`,
          `max_attempts: ${MAX_POLLING_ATTEMPTS}`,
        ],
      },
    };
  }
}
