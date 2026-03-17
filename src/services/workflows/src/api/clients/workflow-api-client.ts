/**
 * Workflow API Client
 * Handles HTTP communication with the workflow execution APIs.
 */

import type { HttpAdapter } from '../../../../databases/src/utils/http/adapter';
import { createHttpAdapter } from '../../../../databases/src/utils/http/client-factory';
import type {
  CredentialsListData,
  Environment,
  ExecuteActivityRequestBody,
  ExecuteActivityResponseData,
  GetCredentialsParams,
  GetIntegrationsParams,
  IntegrationExecutionData,
  IntegrationsListData,
  Region,
  WorkflowApiClientConfig,
  WorkflowErrorResponse,
  WorkflowSuccessResponse,
} from '../../types/workflow';
import {
  WORKFLOW_ENDPOINTS,
  buildWorkflowEndpointPath,
} from '../endpoints/workflows';

type WorkflowResponse<T> = WorkflowSuccessResponse<T> | WorkflowErrorResponse;

interface WorkflowEnvironmentConfig {
  baseURL: string;
  timeout: number;
  debug?: boolean;
}

const WORKFLOW_REGION_CONFIGS: Record<
  Region,
  Record<Environment, WorkflowEnvironmentConfig>
> = {
  'asia-south1': {
    local: { baseURL: 'http://localhost:8000', timeout: 30000, debug: true },
    sit: {
      baseURL:
        'https://asia-south1.api.fcz0.de/service/panel/temporal',
      timeout: 15000,
    },
    uat: {
      baseURL:
        'https://asia-south1.api.uat.fcz0.de/service/panel/temporal',
      timeout: 15000,
    },
    prod: {
      baseURL:
        'https://asia-south1.api.boltic.io/service/panel/temporal',
      timeout: 10000,
    },
  },
  'us-central1': {
    local: { baseURL: 'http://localhost:8000', timeout: 30000, debug: true },
    sit: {
      baseURL:
        'https://us-central1.api.fcz0.de/service/panel/temporal',
      timeout: 15000,
    },
    uat: {
      baseURL:
        'https://us-central1.api.uat.fcz0.de/service/panel/temporal',
      timeout: 15000,
    },
    prod: {
      baseURL:
        'https://us-central1.api.boltic.io/service/panel/temporal',
      timeout: 10000,
    },
  },
};

export class WorkflowApiClient {
  private httpAdapter: HttpAdapter;
  private config: WorkflowApiClientConfig;
  private baseURL: string;
  private integrationBaseURL: string;

  constructor(
    apiKey: string,
    config: Omit<WorkflowApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    const environment = config.environment || 'prod';
    const region = config.region || 'asia-south1';
    this.baseURL = this.resolveBaseURL(environment, region);
    this.integrationBaseURL = this.resolveIntegrationBaseURL(environment, region);
  }

  private resolveBaseURL(environment: Environment, region: Region): string {
    const regionConfig = WORKFLOW_REGION_CONFIGS[region];
    if (!regionConfig) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const envConfig = regionConfig[environment];
    if (!envConfig) {
      throw new Error(
        `Unsupported environment: ${environment} for region: ${region}`
      );
    }

    return `${envConfig.baseURL}/v1.0`;
  }

  /** Derives the integration service base URL (service/panel/integration/v1) from the temporal base URL. */
  private resolveIntegrationBaseURL(environment: Environment, region: Region): string {
    const regionConfig = WORKFLOW_REGION_CONFIGS[region];
    if (!regionConfig) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const envConfig = regionConfig[environment];
    if (!envConfig) {
      throw new Error(
        `Unsupported environment: ${environment} for region: ${region}`
      );
    }

    const base = envConfig.baseURL.replace(
      '/service/panel/temporal',
      '/service/panel/integration'
    );
    return `${base}/v1`;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
    };
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
      console.log('url', url);
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
      return this.handleError(error);
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
      return this.handleError(error);
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
      return this.handleError(error);
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
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): WorkflowErrorResponse {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.error('[WorkflowApiClient] Error:', error);
    }

    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      typeof (error as { response: unknown }).response === 'object' &&
      (error as { response: unknown }).response !== null
    ) {
      const resp = (
        error as {
          response: {
            data?: WorkflowErrorResponse;
            status?: number;
          };
        }
      ).response;

      if (resp.data?.error) {
        return resp.data;
      }

      return {
        error: {
          code: 'WORKFLOW_API_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown workflow API error',
          meta: [`Status: ${resp.status || 'unknown'}`],
        },
      };
    }

    if (error instanceof Error) {
      return {
        error: {
          code: 'WORKFLOW_CLIENT_ERROR',
          message: error.message,
          meta: [],
        },
      };
    }

    return {
      error: {
        code: 'WORKFLOW_UNKNOWN_ERROR',
        message: 'An unexpected workflow error occurred',
        meta: [],
      },
    };
  }

  toString(): string {
    return `WorkflowApiClient { environment: "${this.config.environment || 'prod'}", debug: ${this.config.debug || false} }`;
  }

  toJSON(): object {
    const safeConfig = { ...this.config };
    delete (safeConfig as Record<string, unknown>).apiKey;
    return { client: 'WorkflowApiClient', config: safeConfig };
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
