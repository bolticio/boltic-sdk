import {
  ColumnCreateRequest,
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
  DateFormatEnum,
  DecimalType,
  PhoneFormatType,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import type { Environment } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { COLUMN_ENDPOINTS, buildEndpointPath } from '../endpoints/columns';
import {
  ColumnApiResponse,
  ColumnListApiResponse,
  transformColumnCreateRequest,
  transformColumnCreateResponse,
  transformColumnListRequest,
  transformColumnListResponse,
  transformColumnResponse,
  transformColumnUpdateRequest,
} from '../transformers/columns';

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

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
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
  ): Promise<{ data: ColumnRecord; error?: ApiError }> {
    try {
      const endpoint = COLUMN_ENDPOINTS.create;

      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;
      const transformedRequest = transformColumnCreateRequest(request);
      console.log('transformedRequest', transformedRequest);
      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        if (this.config.debug) {
          console.log(
            'Column API Response:',
            JSON.stringify(response.data, null, 2)
          );
        }

        try {
          // Try to transform the response
          const transformedData = transformColumnCreateResponse(
            response.data as { data: { id: string }; message?: string }
          );

          if (this.config.debug) {
            console.log(
              'Transformed Column Data:',
              JSON.stringify(transformedData, null, 2)
            );
          }

          return {
            data: transformedData,
          };
        } catch (transformError) {
          if (this.config.debug) {
            console.error('Transform error:', transformError);
            console.log('Raw response data:', response.data);
          }

          // Return a basic structure if transformation fails
          return {
            data: {
              id: 'unknown',
            } as ColumnRecord,
          };
        }
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as ColumnRecord,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Create multiple columns in a table (one by one)
   */
  async createColumns(
    tableId: string,
    request: ColumnCreateRequest
  ): Promise<{ data: ColumnRecord[]; error?: ApiError }> {
    try {
      const columns = request.columns;
      const createdColumns: ColumnRecord[] = [];

      for (const column of columns) {
        const result = await this.createColumn(tableId, column);

        if (result.error) {
          return {
            data: createdColumns,
            error: result.error,
          };
        }

        createdColumns.push(result.data);
      }

      return {
        data: createdColumns,
      };
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error),
      };
    }
  }

  /**
   * List columns in a table with filtering and pagination
   */
  async listColumns(
    tableId: string,
    options: ColumnListOptions = {}
  ): Promise<{
    data: ColumnDetails[];
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
      const endpoint = COLUMN_ENDPOINTS.list;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}?no_cache=true`;
      const transformedRequest = transformColumnListRequest(options);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });
      console.log('response', response.data);
      if (response.data) {
        const transformed = transformColumnListResponse(
          response.data as ColumnListApiResponse
        );

        return {
          data: transformed.columns,
          pagination: transformed.pagination,
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
   * Get a single column by ID
   */
  async getColumn(
    tableId: string,
    columnId: string
  ): Promise<{ data: ColumnDetails; error?: ApiError }> {
    try {
      // Use listColumns with filter on ID since get endpoint is not available
      const listResult = await this.listColumns(tableId, {
        where: { id: columnId },
        limit: 1,
      });

      if (listResult.error) {
        return {
          data: {} as ColumnDetails,
          error: listResult.error,
        };
      }

      const column = listResult.data[0] || null;

      if (!column) {
        return {
          data: {} as ColumnDetails,
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column with ID '${columnId}' not found in table`,
            statusCode: 404,
          },
        };
      }

      return {
        data: column,
      };
    } catch (error) {
      return {
        data: {} as ColumnDetails,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update a column
   */
  async updateColumn(
    tableId: string,
    columnId: string,
    updates: ColumnUpdateRequest
  ): Promise<{ data: ColumnDetails; error?: ApiError }> {
    try {
      // First, get the existing column data
      const getColumnResult = await this.getColumn(tableId, columnId);

      if (getColumnResult.error) {
        return {
          data: {} as ColumnDetails,
          error: getColumnResult.error,
        };
      }
      console.log('getColumnResult', getColumnResult);
      // Merge the existing column data with the update request
      const existingColumn = getColumnResult.data;
      const mergedData = this.mergeColumnData(existingColumn, updates);

      const endpoint = COLUMN_ENDPOINTS.update;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, {
        table_id: tableId,
        field_id: columnId,
      })}`;
      const transformedRequest = transformColumnUpdateRequest(mergedData);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: transformColumnResponse(response.data as ColumnApiResponse),
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as ColumnDetails,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Helper method to merge existing column data with update request
   */
  private mergeColumnData(
    existingColumn: ColumnDetails,
    updates: ColumnUpdateRequest
  ): ColumnUpdateRequest {
    return {
      name: updates.name ?? existingColumn.name,
      type: updates.type ?? existingColumn.type,
      description: updates.description ?? existingColumn.description,
      is_nullable: updates.is_nullable ?? existingColumn.is_nullable,
      is_unique: updates.is_unique ?? existingColumn.is_unique,
      is_indexed: updates.is_indexed ?? existingColumn.is_indexed,
      is_visible: updates.is_visible ?? existingColumn.is_visible,
      is_primary_key: updates.is_primary_key ?? existingColumn.is_primary_key,
      is_readonly: updates.is_readonly ?? existingColumn.is_readonly,
      default_value: updates.default_value ?? existingColumn.default_value,
      field_order: updates.field_order ?? existingColumn.field_order,
      alignment: updates.alignment ?? existingColumn.alignment,
      decimals: updates.decimals ?? (existingColumn.decimals as DecimalType),
      currency_format:
        updates.currency_format ?? existingColumn.currency_format,
      selection_source:
        updates.selection_source ??
        (existingColumn.selection_source as 'provide-static-list' | undefined),
      selectable_items:
        updates.selectable_items ?? existingColumn.selectable_items,
      multiple_selections:
        updates.multiple_selections ?? existingColumn.multiple_selections,
      phone_format:
        updates.phone_format ??
        (existingColumn.phone_format as PhoneFormatType),
      date_format:
        updates.date_format ??
        (existingColumn.date_format as keyof typeof DateFormatEnum),
      time_format:
        updates.time_format ??
        (existingColumn.time_format as keyof typeof TimeFormatEnum),
      timezone: updates.timezone ?? existingColumn.timezone,
      vector_dimension:
        updates.vector_dimension ?? existingColumn.vector_dimension,
    };
  }

  /**
   * Delete a column
   */
  async deleteColumn(
    tableId: string,
    columnId: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    try {
      const endpoint = COLUMN_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, {
        table_id: tableId,
        field_id: columnId,
      })}`;

      await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Find column by name in a table
   */
  async findColumnByName(
    tableId: string,
    columnName: string
  ): Promise<{ data: ColumnDetails | null; error?: ApiError }> {
    try {
      const listResult = await this.listColumns(tableId, {
        where: { name: columnName },
        limit: 1,
      });

      if (listResult.error) {
        return {
          data: null,
          error: listResult.error,
        };
      }

      const column = listResult.data[0] || null;
      return {
        data: column,
      };
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update a column by name
   */
  async updateColumnByName(
    tableId: string,
    columnName: string,
    updates: ColumnUpdateRequest
  ): Promise<{ data: ColumnDetails; error?: ApiError }> {
    try {
      // First find the column to get its ID
      const findResult = await this.findColumnByName(tableId, columnName);

      if (findResult.error) {
        return {
          data: {} as ColumnDetails,
          error: findResult.error,
        };
      }

      if (!findResult.data) {
        return {
          data: {} as ColumnDetails,
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${columnName}' not found in table`,
            statusCode: 404,
          },
        };
      }

      // Update using the column ID
      return await this.updateColumn(tableId, findResult.data.id, updates);
    } catch (error) {
      return {
        data: {} as ColumnDetails,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete column by name
   */
  async deleteColumnByName(
    tableId: string,
    columnName: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    try {
      // First find the column to get its ID
      const findResult = await this.findColumnByName(tableId, columnName);

      if (findResult.error) {
        return {
          success: false,
          error: findResult.error,
        };
      }

      if (!findResult.data) {
        return {
          success: false,
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${columnName}' not found in table`,
            statusCode: 404,
          },
        };
      }

      // Delete using the column ID
      return await this.deleteColumn(tableId, findResult.data.id);
    } catch (error) {
      return {
        success: false,
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
    if (this.config.debug) {
      console.error('Columns API Error:', error);
    }

    // Handle different error types
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as {
        response?: {
          data?: {
            error?: { code?: string; message?: string; details?: unknown };
          };
          status?: number;
        };
      };
      return {
        code: apiError.response?.data?.error?.code || 'API_ERROR',
        message:
          apiError.response?.data?.error?.message ||
          (error as unknown as Error).message ||
          'Unknown API error',
        details: apiError.response?.data?.error?.details,
        statusCode: apiError.response?.status,
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        code: 'CLIENT_ERROR',
        message: (error as Error).message,
        details: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error,
    };
  }
}
