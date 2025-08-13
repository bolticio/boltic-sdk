import {
  TableCreateRequest,
  TableCreateResponse,
  TableQueryOptions,
  TableRecord,
} from '../../types/api/table';
import type { Environment } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { TABLE_ENDPOINTS, buildEndpointPath } from '../endpoints/tables';

export interface TablesApiClientConfig {
  apiKey: string;
  environment?: Environment;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface TableCreateOptions {
  is_ai_generated_schema?: boolean;
  is_template?: boolean;
}

export interface TableListOptions extends TableQueryOptions {
  page?: number;
  pageSize?: number;
  isShared?: boolean;
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
 * Tables API Client - handles all table-related API operations
 */
export class TablesApiClient {
  private httpAdapter: HttpAdapter;
  private config: TablesApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<TablesApiClientConfig, 'apiKey'> = {}
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
   * Create a new table
   */
  async createTable(
    request: TableCreateRequest,
    options: TableCreateOptions = {}
  ): Promise<BolticSuccessResponse<TableCreateResponse> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.create;
      const url = `${this.baseURL}${endpoint.path}`;

      // Prepare request data without transformation
      const requestData = {
        ...request,
        ...options,
      };

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: requestData,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<TableCreateResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * List tables with filtering and pagination
   */
  async listTables(
    options: TableListOptions = {}
  ): Promise<BolticListResponse<TableRecord> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.list;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: options,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticListResponse<TableRecord>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a specific table by ID
   */
  async getTable(
    tableId: string
  ): Promise<BolticSuccessResponse<TableRecord> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.get;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<TableRecord>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update an existing table
   */
  async updateTable(
    tableId: string,
    updates: {
      name?: string;
      description?: string;
      is_shared?: boolean;
      snapshot?: string;
    }
  ): Promise<BolticSuccessResponse<TableRecord> | BolticErrorResponse> {
    try {
      // First get the existing table data
      const existingTable = await this.getTable(tableId);

      if ('error' in existingTable) {
        return existingTable;
      }

      if (!existingTable.data) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table with ID '${tableId}' not found`,
          },
        };
      }

      const endpoint = TABLE_ENDPOINTS.update;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: updates,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<TableRecord>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(
    tableId: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  // Private helper methods

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
      'User-Agent': '@boltic/database-js/1.0.0',
    };
  }

  private formatErrorResponse(error: unknown): BolticErrorResponse {
    if (this.config.debug) {
      console.error('Tables API Error:', error);
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
