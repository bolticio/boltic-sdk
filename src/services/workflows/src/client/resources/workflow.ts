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
  GetCredentialsParams,
  GetIntegrationsParams,
  IntegrationExecutionData,
  IntegrationsListData,
} from '../../types/workflow';

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
  ): Promise<
    BolticSuccessResponse<CredentialsListData> | BolticErrorResponse
  > {
    return this.apiClient.getCredentials(params);
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
