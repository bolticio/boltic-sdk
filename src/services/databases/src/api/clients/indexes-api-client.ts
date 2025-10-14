import {
  AddIndexRequest,
  AddIndexResponse,
  DeleteIndexRequest,
  DeleteIndexResponse,
  ListIndexesQuery,
  ListIndexesResponse,
} from '../../types/api/index';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { buildIndexEndpointPath, INDEX_ENDPOINTS } from '../endpoints/indexes';

export interface IndexesApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

interface BolticSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

// Note: No BolticListResponse needed in this client; API returns wrapped success lists

interface BolticErrorResponse {
  data?: never;
  error: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

export class IndexesApiClient {
  private httpAdapter: HttpAdapter;
  private config: IndexesApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<IndexesApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    const environment = config.environment || 'prod';
    const region = config.region || 'asia-south1';
    this.baseURL = this.getBaseURL(environment, region);
  }

  private getBaseURL(environment: Environment, region: Region): string {
    const regionConfig = REGION_CONFIGS[region];
    if (!regionConfig) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const envConfig = regionConfig[environment];
    if (!envConfig) {
      throw new Error(
        `Unsupported environment: ${environment} for region: ${region}`
      );
    }

    return `${envConfig.baseURL}/v1`;
  }

  async addIndex(
    tableId: string,
    request: AddIndexRequest
  ): Promise<BolticSuccessResponse<AddIndexResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.create;
      const url = `${this.baseURL}${buildIndexEndpointPath(endpoint, { table_id: tableId })}`;
      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });
      return response.data as BolticSuccessResponse<AddIndexResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  async listIndexes(
    tableId: string,
    query: ListIndexesQuery
  ): Promise<BolticSuccessResponse<ListIndexesResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.list;
      const url = `${this.baseURL}${buildIndexEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: query,
        timeout: this.config.timeout,
      });

      return response.data as BolticSuccessResponse<ListIndexesResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  async deleteIndex(
    request: DeleteIndexRequest
  ): Promise<BolticSuccessResponse<DeleteIndexResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildIndexEndpointPath(endpoint)}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data as BolticSuccessResponse<DeleteIndexResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
    };
  }

  private formatErrorResponse(error: unknown): BolticErrorResponse {
    if (this.config.debug) {
      console.error('Indexes API Error:', error);
    }

    // Handle different error types following Boltic format
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as {
        response?: {
          data?: BolticErrorResponse;
          status?: number;
        };
      };

      // If API already returned Boltic format, use it
      if (apiError.response?.data?.error) {
        return apiError.response.data;
      }

      // Otherwise format it to Boltic structure
      return {
        error: {
          code: 'API_ERROR',
          message: (error as unknown as Error).message || 'Unknown API error',
          meta: [`Status: ${apiError.response?.status || 'unknown'}`],
        },
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        error: {
          code: 'CLIENT_ERROR',
          message: (error as Error).message,
          meta: ['Client-side error occurred'],
        },
      };
    }

    return {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        meta: ['Unknown error type'],
      },
    };
  }
}
