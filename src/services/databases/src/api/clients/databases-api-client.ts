/**
 * Database Management API Client
 * Handles all database-related API operations
 */

import {
  DatabaseCreateRequest,
  DatabaseDeletionJobResponse,
  DatabaseDeletionStatusResponse,
  DatabaseJobListRequest,
  DatabaseJobQueryOptions,
  DatabaseJobRecord,
  DatabaseListQueryParams,
  DatabaseListRequest,
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseUpdateRequest,
  PaginationMetadata,
} from '../../types/api/database';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { filterArrayFields } from '../../utils/common';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import {
  buildDatabaseEndpointPath,
  DATABASE_ENDPOINTS,
} from '../endpoints/databases';

export interface DatabasesApiClientConfig {
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
  pagination?: PaginationMetadata;
  message?: string;
}

interface BolticErrorResponse {
  data?: never;
  error: {
    code?: string | number;
    message?: string;
    meta?: string[];
  };
}

type BolticResponse<T> = BolticSuccessResponse<T> | BolticErrorResponse;
type BolticListApiResponse<T> = BolticListResponse<T> | BolticErrorResponse;

/**
 * Databases API Client - handles all database-related API operations
 */
export class DatabasesApiClient {
  private httpAdapter: HttpAdapter;
  private config: DatabasesApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<DatabasesApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    // Set baseURL based on environment and region
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

  /**
   * Create a new database
   */
  async createDatabase(
    request: DatabaseCreateRequest
  ): Promise<BolticResponse<DatabaseRecord>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.create;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request<
        BolticResponse<DatabaseRecord>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        data: request,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * List databases with pagination, sorting, and filtering
   */
  async listDatabases(
    request: DatabaseListRequest = {},
    queryParams?: DatabaseListQueryParams,
    options?: DatabaseQueryOptions
  ): Promise<BolticListApiResponse<DatabaseRecord>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.list;
      let url = `${this.baseURL}${endpoint.path}`;

      // Add query parameters
      const params = new URLSearchParams();
      if (queryParams?.connector_id) {
        params.append('connector_id', queryParams.connector_id);
      }
      if (queryParams?.add_default_if_missing) {
        params.append(
          'add_default_if_missing',
          queryParams.add_default_if_missing
        );
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.httpAdapter.request<
        BolticListApiResponse<DatabaseRecord>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        data: request,
        timeout: this.config.timeout,
      });

      const result = response.data;

      // Apply field filtering if requested
      if (options?.fields && !('error' in result)) {
        return {
          ...result,
          data: filterArrayFields(
            result.data as unknown as Record<string, unknown>[],
            options.fields
          ) as unknown as DatabaseRecord[],
        };
      }

      return result;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Update a database
   */
  async updateDatabase(
    dbId: string,
    request: DatabaseUpdateRequest
  ): Promise<BolticResponse<DatabaseRecord>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.update;
      const path = buildDatabaseEndpointPath(endpoint, { db_id: dbId });
      const url = `${this.baseURL}${path}`;

      const response = await this.httpAdapter.request<
        BolticResponse<DatabaseRecord>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        data: request,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a database (initiates deletion job)
   */
  async deleteDatabase(
    dbId: string
  ): Promise<BolticResponse<DatabaseDeletionJobResponse>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.delete;
      const path = buildDatabaseEndpointPath(endpoint, { db_id: dbId });
      const url = `${this.baseURL}${path}`;

      const response = await this.httpAdapter.request<
        BolticResponse<DatabaseDeletionJobResponse>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * List database jobs
   */
  async listDatabaseJobs(
    request: DatabaseJobListRequest = {},
    options?: DatabaseJobQueryOptions
  ): Promise<BolticListApiResponse<DatabaseJobRecord>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.listJobs;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request<
        BolticListApiResponse<DatabaseJobRecord>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        data: request,
        timeout: this.config.timeout,
      });

      const result = response.data;

      // Apply field filtering if requested
      if (options?.fields && !('error' in result)) {
        return {
          ...result,
          data: filterArrayFields(
            result.data as unknown as Record<string, unknown>[],
            options.fields
          ) as unknown as DatabaseJobRecord[],
        };
      }

      return result;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Poll deletion status for a database job
   */
  async pollDeleteStatus(
    jobId: string
  ): Promise<BolticResponse<DatabaseDeletionStatusResponse>> {
    try {
      const endpoint = DATABASE_ENDPOINTS.pollDeleteStatus;
      const path = buildDatabaseEndpointPath(endpoint, { job_id: jobId });
      const url = `${this.baseURL}${path}`;

      const response = await this.httpAdapter.request<
        BolticResponse<DatabaseDeletionStatusResponse>
      >({
        url,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-boltic-token': this.config.apiKey,
        },
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to standard error format
   */
  private handleError(error: unknown): BolticErrorResponse {
    if (this.config.debug) {
      console.error('[DatabasesApiClient] Error:', error);
    }

    // If error already has the right structure, return it
    if (error.error) {
      return {
        error: {
          code: error.error.code,
          message: error.error.message || 'An error occurred',
          meta: error.error.meta,
        },
      };
    }

    // If it's an HTTP error with response data
    if (error.response?.data?.error) {
      return {
        error: {
          code: error.response.data.error.code,
          message: error.response.data.error.message || 'An error occurred',
          meta: error.response.data.error.meta,
        },
      };
    }

    // Default error format
    return {
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        meta: [],
      },
    };
  }
}
