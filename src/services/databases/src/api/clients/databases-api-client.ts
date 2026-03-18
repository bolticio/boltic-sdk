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
} from '../../types/api/database';
import {
  BaseApiClient,
  type BaseApiClientConfig,
  type BolticSuccessResponse,
  type BolticListResponse,
  type BolticErrorResponse,
} from '../../../../common';
import { filterArrayFields } from '../../utils/common';
import {
  buildDatabaseEndpointPath,
  DATABASE_ENDPOINTS,
} from '../endpoints/databases';

export type DatabasesApiClientConfig = BaseApiClientConfig;

type BolticResponse<T> = BolticSuccessResponse<T> | BolticErrorResponse;
type BolticListApiResponse<T> = BolticListResponse<T> | BolticErrorResponse;

export class DatabasesApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config);
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
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
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
        headers: this.buildHeaders(),
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
      return this.formatErrorResponse(error);
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
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
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
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
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
        headers: this.buildHeaders(),
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
      return this.formatErrorResponse(error);
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
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }
}
