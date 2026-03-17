/**
 * Workflow API Client
 * Extends BaseApiClient — shares auth, headers, error handling, and HTTP
 * infrastructure with the rest of the SDK via the common module.
 */

import {
  BaseApiClient,
  SERVICE_PATHS,
  type BaseApiClientConfig,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type {
  CredentialsListData,
  ExecuteActivityRequestBody,
  ExecuteActivityResponseData,
  GetCredentialsParams,
  GetIntegrationsParams,
  IntegrationExecutionData,
  IntegrationsListData,
} from '../../types/workflow';
import {
  WORKFLOW_ENDPOINTS,
  buildWorkflowEndpointPath,
} from '../endpoints/workflows';

type WorkflowResponse<T> = BolticSuccessResponse<T> | BolticErrorResponse;

export class WorkflowApiClient extends BaseApiClient {
  private integrationBaseURL: string;

  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config, SERVICE_PATHS.WORKFLOW_TEMPORAL);
    this.integrationBaseURL = this.resolveAdditionalServiceURL(
      SERVICE_PATHS.INTEGRATION
    );
  }

  /**
   * Execute a workflow activity.
   *
   * @param body - The execute-activity request body
   */
  async executeActivity(
    body: ExecuteActivityRequestBody
  ): Promise<WorkflowResponse<ExecuteActivityResponseData>> {
    try {
      const endpoint = WORKFLOW_ENDPOINTS.executeActivity;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request<
        WorkflowResponse<ExecuteActivityResponseData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: body,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'WORKFLOW');
    }
  }

  /**
   * Fetch the result of a workflow execution by its run ID.
   *
   * @param runId - The execution run ID returned by `executeActivity`
   */
  async getExecutionById(
    runId: string
  ): Promise<WorkflowResponse<IntegrationExecutionData>> {
    try {
      const endpoint = WORKFLOW_ENDPOINTS.getExecutionById;
      const path = buildWorkflowEndpointPath(endpoint, { run_id: runId });
      const url = `${this.baseURL}${path}`;

      const response = await this.httpAdapter.request<
        WorkflowResponse<IntegrationExecutionData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'WORKFLOW');
    }
  }

  /**
   * Fetch the list of available integrations.
   *
   * @param params - Optional pagination parameters
   */
  async getIntegrations(
    params: GetIntegrationsParams = {}
  ): Promise<WorkflowResponse<IntegrationsListData>> {
    try {
      const endpoint = WORKFLOW_ENDPOINTS.getIntegrations;
      const query = new URLSearchParams({
        page: String(params.page ?? 1),
        per_page: String(params.per_page ?? 999),
      });
      const url = `${this.baseURL}${endpoint.path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        WorkflowResponse<IntegrationsListData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'WORKFLOW');
    }
  }

  /**
   * Fetch credentials for a given integration entity.
   *
   * @param params - Entity name (required) and optional pagination
   */
  async getCredentials(
    params: GetCredentialsParams
  ): Promise<WorkflowResponse<CredentialsListData>> {
    try {
      const endpoint = WORKFLOW_ENDPOINTS.getCredentials;
      const path = buildWorkflowEndpointPath(endpoint, {
        entity: params.entity.toUpperCase(),
      });
      const query = new URLSearchParams({
        current_page: String(params.current_page ?? 1),
        page_size: String(params.page_size ?? 999),
      });
      const url = `${this.integrationBaseURL}${path}?${query.toString()}`;

      const response = await this.httpAdapter.request<
        WorkflowResponse<CredentialsListData>
      >({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, 'INTEGRATION');
    }
  }
}
