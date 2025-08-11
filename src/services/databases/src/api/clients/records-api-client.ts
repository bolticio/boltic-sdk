import {
  RecordData,
  RecordDeleteByIdsOptions,
  RecordDeleteOptions,
  RecordListResponse,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import type { Environment } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import {
  RECORD_ENDPOINTS,
  buildRecordEndpointPath,
} from '../endpoints/records';

// Response interfaces to avoid any types
interface RecordInsertResponse {
  data: RecordWithId;
}

interface RecordGetResponse {
  data: RecordWithId;
}

interface RecordUpdateResponse {
  data: RecordWithId[];
}

interface RecordUpdateByIdResponse {
  data: RecordWithId;
}

export interface RecordsApiClientConfig {
  apiKey: string;
  environment?: Environment;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
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

    // Set baseURL based on environment
    const environment = config.environment || 'sit';
    this.baseURL = this.getBaseURL(environment);
  }

  private getBaseURL(environment: Environment): string {
    const envConfigs = {
      local: 'http://localhost:8000',
      sit: 'https://asia-south1.api.fcz0.de/service/panel/boltic-tables/v1',
      uat: 'https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables/v1',
      prod: 'https://asia-south1.api.boltic.io/service/panel/boltic-tables/v1',
    };
    return envConfigs[environment];
  }

  /**
   * Insert a single record
   */
  async insertRecord(
    request: RecordData & { table_id?: string }
  ): Promise<{ data: RecordWithId; error?: ApiError }> {
    try {
      const { table_id, ...recordData } = request;

      if (!table_id) {
        throw new Error('table_id is required for insert operation');
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

      if (response.data) {
        return {
          data: (response.data as RecordInsertResponse).data,
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as RecordWithId,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get a single record by ID
   */
  async getRecord(
    recordId: string,
    tableId: string
  ): Promise<{ data: RecordWithId; error?: ApiError }> {
    try {
      if (!tableId) {
        throw new Error('table_id is required for get operation');
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

      if (response.data) {
        return {
          data: (response.data as RecordGetResponse).data,
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as RecordWithId,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List records with filtering and pagination
   */
  async listRecords(
    options: RecordQueryOptions & { table_id?: string } = {}
  ): Promise<{
    data: RecordWithId[];
    pagination?: {
      total_count: number;
      total_pages: number;
      current_page: number;
      per_page: number;
      type: string;
    };
    error?: ApiError;
  }> {
    try {
      const { table_id, ...queryOptions } = options;

      if (!table_id) {
        throw new Error('table_id is required for list operation');
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

      if (response.data) {
        return {
          data: (response.data as RecordListResponse).data,
          pagination: (response.data as RecordListResponse).pagination,
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update records by filters
   */
  async updateRecords(
    request: RecordUpdateOptions & { table_id?: string }
  ): Promise<{ data: RecordWithId[]; error?: ApiError }> {
    try {
      const { table_id, ...updateOptions } = request;

      if (!table_id) {
        throw new Error('table_id is required for update operation');
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

      if (response.data) {
        return {
          data: (response.data as RecordUpdateResponse).data,
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update a single record by ID
   */
  async updateRecordById(
    recordId: string,
    request: RecordUpdateByIdOptions & { table_id?: string }
  ): Promise<{ data: RecordWithId; error?: ApiError }> {
    try {
      const { table_id, ...updateOptions } = request;

      if (!table_id) {
        throw new Error('table_id is required for updateById operation');
      }

      // First, get the existing record data
      const getRecordResult = await this.getRecord(recordId, table_id);

      if (getRecordResult.error) {
        return {
          data: {} as RecordWithId,
          error: getRecordResult.error,
        };
      }

      // Merge the existing record data with the update request
      const existingRecord = getRecordResult.data;
      const mergedData = this.mergeRecordData(
        existingRecord,
        updateOptions.set
      );

      const endpoint = RECORD_ENDPOINTS.updateById;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, {
        record_id: recordId,
        table_id,
      })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: mergedData,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: (response.data as RecordUpdateByIdResponse).data,
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as RecordWithId,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete records by filters
   */
  async deleteRecords(
    request: RecordDeleteOptions & { table_id?: string }
  ): Promise<{ data: { message: string }; error?: ApiError }> {
    try {
      const { table_id, ...deleteOptions } = request;

      if (!table_id) {
        throw new Error('table_id is required for delete operation');
      }

      const endpoint = RECORD_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: deleteOptions,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return { data: { message: 'Records deleted successfully' } };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: { message: 'Failed to delete records' },
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete records by IDs
   */
  async deleteRecordsByIds(
    request: RecordDeleteByIdsOptions & { table_id?: string }
  ): Promise<{ data: { message: string }; error?: ApiError }> {
    try {
      const { table_id, ...deleteOptions } = request;

      if (!table_id) {
        throw new Error('table_id is required for deleteByIds operation');
      }

      const endpoint = RECORD_ENDPOINTS.deleteByIds;
      const url = `${this.baseURL}${buildRecordEndpointPath(endpoint, { table_id })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: deleteOptions,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return { data: { message: 'Records deleted successfully' } };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: { message: 'Failed to delete records' },
        error: this.formatError(error),
      };
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
      'User-Agent': '@boltic/database-js/1.0.0',
    };
  }

  private formatError(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        code: (errorObj.code as string) || 'UNKNOWN_ERROR',
        message: (errorObj.message as string) || 'An unknown error occurred',
        details: error,
        statusCode: (errorObj.statusCode as number) || undefined,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
    };
  }

  /**
   * Helper method to merge existing record data with update request
   * Excludes system fields: id, created_at, updated_at
   */
  private mergeRecordData(
    existingRecord: RecordWithId,
    updates: RecordData
  ): RecordData {
    const mergedData: RecordData = { ...existingRecord };

    // Apply user updates
    Object.assign(mergedData, updates);

    // Remove system fields that should not be updated
    delete mergedData.id;
    delete mergedData.created_at;
    delete mergedData.updated_at;

    return mergedData;
  }
}
