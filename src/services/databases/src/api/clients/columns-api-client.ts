import {
  ColumnCreateRequest,
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { filterArrayFields, filterObjectFields } from '../../utils/common';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { buildEndpointPath, COLUMN_ENDPOINTS } from '../endpoints/columns';
import {
  transformColumnCreateRequest,
  transformColumnUpdateRequest,
} from '../transformers/columns';

export interface ColumnsApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
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
   * Create a single column in a table
   */
  async createColumn(
    tableId: string,
    request: FieldDefinition
  ): Promise<BolticSuccessResponse<ColumnRecord> | BolticErrorResponse> {
    try {
      const endpoint = COLUMN_ENDPOINTS.create;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      // Transform the request to ensure proper formatting (e.g., selection_source for dropdowns)
      const transformedRequest = transformColumnCreateRequest(request);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
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

      // Apply field filtering if fields are specified
      if (request.fields && createdColumns.length > 0) {
        const filteredColumns = filterArrayFields(
          createdColumns as unknown as Record<string, unknown>[],
          request.fields as string[]
        ) as unknown as ColumnRecord[];
        createdColumns.splice(0, createdColumns.length, ...filteredColumns);
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

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticListResponse<ColumnDetails>;
      if (options.fields && responseData.data) {
        responseData.data = filterArrayFields(
          responseData.data as unknown as Record<string, unknown>[],
          options.fields as string[]
        ) as unknown as ColumnDetails[];
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a single column by ID
   */
  async getColumn(
    tableId: string,
    columnId: string,
    options: { fields?: Array<keyof ColumnDetails> } = {}
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      const endpoint = COLUMN_ENDPOINTS.get;
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

      if (this.config.debug) {
        console.log(
          'Column API Response:',
          JSON.stringify(response.data, null, 2)
        );
      }

      // Apply field filtering if fields are specified
      const responseData =
        response.data as BolticSuccessResponse<ColumnDetails>;
      if (options.fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data as unknown as Record<string, unknown>,
          options.fields as string[]
        ) as unknown as ColumnDetails;
      }

      return responseData;
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
      const endpoint = COLUMN_ENDPOINTS.update;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, {
        table_id: tableId,
        field_id: columnId,
      })}`;

      // Transform the updates to API format
      const transformedUpdates = transformColumnUpdateRequest(updates);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedUpdates,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData =
        response.data as BolticSuccessResponse<ColumnDetails>;
      if (updates.fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data as unknown as Record<string, unknown>,
          updates.fields as string[]
        ) as unknown as ColumnDetails;
      }

      return responseData;
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
   * Helper function to convert ColumnDetails to ColumnUpdateRequest format
   */
  private convertColumnDetailsToUpdateRequest(
    columnDetails: ColumnDetails
  ): Record<string, unknown> {
    return {
      name: columnDetails.name,
      type: columnDetails.type,
      description: columnDetails.description,
      is_nullable: columnDetails.is_nullable,
      is_unique: columnDetails.is_unique,
      is_indexed: columnDetails.is_indexed,
      is_visible: columnDetails.is_visible,
      is_primary_key: columnDetails.is_primary_key,
      is_readonly: columnDetails.is_readonly,
      default_value: columnDetails.default_value,
      field_order: columnDetails.field_order,
      alignment: columnDetails.alignment,
      decimals: columnDetails.decimals,
      currency_format: columnDetails.currency_format,
      selection_source: columnDetails.selection_source,
      selectable_items: columnDetails.selectable_items,
      multiple_selections: columnDetails.multiple_selections,
      phone_format: columnDetails.phone_format,
      date_format: columnDetails.date_format,
      time_format: columnDetails.time_format,
      timezone: columnDetails.timezone,
      vector_dimension: columnDetails.vector_dimension,
    };
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
      // First find the column to get its current data
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

      // Convert existing column details to update request format
      const existingColumnAsUpdate = this.convertColumnDetailsToUpdateRequest(
        findResult.data
      );

      // Merge existing data with updates (updates override existing values)
      const mergedUpdates: ColumnUpdateRequest = {
        ...existingColumnAsUpdate,
        ...updates,
      } as ColumnUpdateRequest;

      // Update using the column ID with merged data
      return await this.updateColumn(
        tableId,
        findResult.data.id,
        mergedUpdates
      );
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
