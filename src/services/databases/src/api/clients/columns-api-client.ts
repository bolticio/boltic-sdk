import {
  ColumnCreateRequest,
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import type { Environment } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { COLUMN_ENDPOINTS, buildEndpointPath } from '../endpoints/columns';

export interface ColumnsApiClientConfig {
  apiKey: string;
  environment?: Environment;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ColumnListOptions extends ColumnQueryOptions {
  page?: number;
  pageSize?: number;
}

// API request format interfaces
export interface ApiFilter {
  field: string;
  operator: string;
  values: unknown[];
}

export interface ApiSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ColumnApiListRequest {
  page: {
    page_no: number;
    page_size: number;
  };
  filters: ApiFilter[];
  sort: ApiSort[];
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
 * Columns API Client - handles all column-related API operations
 */
export class ColumnsApiClient {
  private httpAdapter: HttpAdapter;
  private config: ColumnsApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<ColumnsApiClientConfig, 'apiKey'> = {}
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
   * Create a single column in a table
   */
  async createColumn(
    tableId: string,
    request: FieldDefinition
  ): Promise<BolticSuccessResponse<ColumnRecord> | BolticErrorResponse> {
    try {
      const endpoint = COLUMN_ENDPOINTS.create;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      if (this.config.debug) {
        console.log(
          'Column API Response:',
          JSON.stringify(response.data, null, 2)
        );
      }

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<ColumnRecord>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Create multiple columns in a table (one by one)
   */
  async createColumns(
    tableId: string,
    request: ColumnCreateRequest
  ): Promise<BolticListResponse<ColumnRecord> | BolticErrorResponse> {
    try {
      const columns = request.columns;
      const createdColumns: ColumnRecord[] = [];

      for (const column of columns) {
        const result = await this.createColumn(tableId, column);

        if ('error' in result) {
          return result;
        }

        createdColumns.push(result.data);
      }

      // Return in Boltic list format
      return {
        data: createdColumns,
        message: 'Columns created successfully',
      };
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * List columns in a table with filtering and pagination
   */
  async listColumns(
    tableId: string,
    options: ColumnListOptions = {}
  ): Promise<BolticListResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      const endpoint = COLUMN_ENDPOINTS.list;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}?no_cache=true`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: options,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticListResponse<ColumnDetails>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a single column by ID
   */
  async getColumn(
    tableId: string,
    columnId: string
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // Use listColumns with filter on ID since get endpoint is not available
      // Transform to API format
      const apiRequest = {
        page: { page_no: 1, page_size: 1 },
        filters: [
          {
            field: 'id',
            operator: '=',
            values: [columnId],
          },
        ],
        sort: [],
      };

      const listResult = await this.listColumns(
        tableId,
        apiRequest as unknown as ColumnListOptions
      );

      if ('error' in listResult) {
        return listResult;
      }

      const column = listResult.data[0] || null;

      if (!column) {
        return {
          data: {},
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column with ID '${columnId}' not found in table`,
            meta: ['Column not found'],
          },
        };
      }

      return {
        data: column,
        message: 'Column retrieved successfully',
      };
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update a column
   */
  async updateColumn(
    tableId: string,
    columnId: string,
    updates: ColumnUpdateRequest
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // First get the existing column data
      const existingColumn = await this.getColumn(tableId, columnId);

      if ('error' in existingColumn) {
        return existingColumn;
      }

      if (!existingColumn.data) {
        return {
          data: {},
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column with ID '${columnId}' not found`,
          },
        };
      }

      // Merge existing data with updates (updates override existing values)
      const mergedData = {
        ...existingColumn.data,
        ...updates,
      };

      const endpoint = COLUMN_ENDPOINTS.update;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, {
        table_id: tableId,
        field_id: columnId,
      })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: mergedData,
        timeout: this.config.timeout,
      });

      // Return raw response without transformation
      return response.data as BolticSuccessResponse<ColumnDetails>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete a column
   */
  async deleteColumn(
    tableId: string,
    columnId: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      const endpoint = COLUMN_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, {
        table_id: tableId,
        field_id: columnId,
      })}`;

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

  /**
   * Find column by name in a table
   */
  async findColumnByName(
    tableId: string,
    columnName: string
  ): Promise<
    BolticSuccessResponse<ColumnDetails | null> | BolticErrorResponse
  > {
    try {
      // Transform to API format
      const apiRequest = {
        page: { page_no: 1, page_size: 1 },
        filters: [
          {
            field: 'name',
            operator: '=',
            values: [columnName],
          },
        ],
        sort: [],
      };

      const listResult = await this.listColumns(
        tableId,
        apiRequest as unknown as ColumnListOptions
      );
      if ('error' in listResult) {
        return listResult;
      }

      const column = listResult.data[0] || null;
      return {
        data: column,
        message: column ? 'Column found' : 'Column not found',
      };
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Update a column by name
   */
  async updateColumnByName(
    tableId: string,
    columnName: string,
    updates: ColumnUpdateRequest
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // First find the column to get its ID
      const findResult = await this.findColumnByName(tableId, columnName);

      if ('error' in findResult) {
        return findResult;
      }

      if (!findResult.data) {
        return {
          data: {},
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${columnName}' not found in table`,
            meta: ['404'],
          },
        };
      }

      // Update using the column ID
      return await this.updateColumn(tableId, findResult.data.id, updates);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete column by name
   */
  async deleteColumnByName(
    tableId: string,
    columnName: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      // First find the column to get its ID
      const findResult = await this.findColumnByName(tableId, columnName);

      if ('error' in findResult) {
        return findResult;
      }

      if (!findResult.data) {
        return {
          data: {},
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${columnName}' not found in table`,
            meta: ['Column not found'],
          },
        };
      }

      // Delete using the column ID
      return await this.deleteColumn(tableId, findResult.data.id);
    } catch (error) {
      return this.formatErrorResponse(error);
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

  private formatErrorResponse(error: unknown): BolticErrorResponse {
    if (this.config.debug) {
      console.error('Columns API Error:', error);
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
