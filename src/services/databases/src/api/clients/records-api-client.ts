import {
  RecordData,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import {
  buildRecordEndpointPath,
  RECORD_ENDPOINTS,
} from '../endpoints/records';
import { transformDeleteRequest } from '../transformers/records';

export interface RecordsApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// Boltic API Response Structure interfaces
interface BolticSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

interface BolticListResponse<T = unknown> {
  data: T[];
  pagination?: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
  message?: string;
}

interface BolticErrorResponse {
  data: {};
  error: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

/**
 * Records API Client - handles all record-related API operations
 */
export class RecordsApiClient {
  private httpAdapter: HttpAdapter;
  private config: RecordsApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<RecordsApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    // Set baseURL based on environment and region
    const environment = config.environment || 'prod';
    const region = config.region || 'asia-south1'; // Default to asia-south1 for legacy support
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

  /**
   * Insert a single record
   */
  async insertRecord(
    request: RecordData & { table_id?: string }
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, ...recordData } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for insert operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.insert;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: recordData,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a single record by ID
   */
  async getRecord(
    recordId: string,
    tableId: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      if (!tableId) {
        return this.formatErrorResponse(
          new Error('table_id is required for get operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.get;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, {
        table_id: tableId,
        record_id: recordId,
      })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * List records with filtering and pagination
   */
  async listRecords(
    options: RecordQueryOptions & { table_id?: string } = {}
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, ...queryOptions } = options;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for list operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.list;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: queryOptions,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticListResponse<RecordWithId>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update records by filters
   */
  async updateRecords(
    request: RecordUpdateOptions & { table_id?: string }
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, ...updateOptions } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for update operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.update;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: updateOptions,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticListResponse<RecordWithId>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update a single record by ID
   */
  async updateRecordById(
    recordId: string,
    request: RecordUpdateByIdOptions & { table_id?: string }
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      const { table_id, ...updateOptions } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for updateById operation')
        );
      }

      const endpoint = RECORD_ENDPOINTS.updateById;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, {
        record_id: recordId,
        table_id,
      })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: updateOptions.set,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Unified delete records method that supports both record_ids and filters
   */
  async deleteRecords(
    request: RecordDeleteOptions & { table_id?: string }
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      const { table_id } = request;

      if (!table_id) {
        return this.formatErrorResponse(
          new Error('table_id is required for delete operation')
        );
      }

      // Transform the request to API format
      const transformedRequest = transformDeleteRequest(request);

      const endpoint = RECORD_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete a single record by ID
   */
  async deleteRecordById(
    recordId: string,
    request: { table_id?: string }
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    // Use deleteRecords with a single ID
    return this.deleteRecords({
      record_ids: [recordId],
      table_id: request.table_id,
    });
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
      console.error('Records API Error:', error);
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
        data: {},
        error: {
          code: 'API_ERROR',
          message: (error as unknown as Error).message || 'Unknown API error',
          meta: [`Status: ${apiError.response?.status || 'unknown'}`],
        },
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        data: {},
        error: {
          code: 'CLIENT_ERROR',
          message: (error as Error).message,
          meta: ['Client-side error occurred'],
        },
      };
    }

    return {
      data: {},
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        meta: ['Unknown error type'],
      },
    };
  }
}
