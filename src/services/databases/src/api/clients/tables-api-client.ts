import {
  TableCreateRequest,
  TableCreateResponse,
  TableQueryOptions,
  TableRecord,
} from '../../types/api/table';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { filterArrayFields, filterObjectFields } from '../../utils/common';
import { addDbIdToUrl } from '../../utils/database/db-context';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import { buildEndpointPath, TABLE_ENDPOINTS } from '../endpoints/tables';
import { transformTableCreateRequest } from '../transformers/tables';

export interface TablesApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface TableCreateOptions {
  is_ai_generated_schema?: boolean;
  is_template?: boolean;
  db_id?: string;
}

export interface TableListOptions extends TableQueryOptions {
  page?: number;
  pageSize?: number;
  isShared?: boolean;
  db_id?: string;
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
  data?: never;
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
   * Create a new table
   */
  async createTable(
    request: TableCreateRequest,
    options: TableCreateOptions = {}
  ): Promise<BolticSuccessResponse<TableCreateResponse> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.create;
      let url = `${this.baseURL}${endpoint.path}`;
      // Add db_id query parameter if provided
      url = addDbIdToUrl(url, options.db_id);
      // Transform the request to ensure proper formatting (e.g., selection_source for dropdowns)
      const transformedRequest = transformTableCreateRequest(request, options);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      // Note: TableCreateResponse only contains id and message, so field filtering is not applicable
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
      let url = `${this.baseURL}${endpoint.path}`;

      // Add db_id query parameter if provided
      url = addDbIdToUrl(url, options.db_id);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: options,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticListResponse<TableRecord>;
      if (options.fields && responseData.data) {
        responseData.data = filterArrayFields(
          responseData.data as unknown as Record<string, unknown>[],
          options.fields
        ) as unknown as TableRecord[];
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get a specific table by ID
   */
  async getTable(
    tableId: string,
    options: { fields?: Array<keyof TableRecord>; db_id?: string } = {}
  ): Promise<BolticSuccessResponse<TableRecord> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.get;
      let url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      // Add db_id query parameter if provided
      url = addDbIdToUrl(url, options.db_id);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticSuccessResponse<TableRecord>;
      if (options.fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data as unknown as Record<string, unknown>,
          options.fields as string[]
        ) as unknown as TableRecord;
      }

      return responseData;
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
      fields?: Array<keyof TableRecord>;
      db_id?: string;
    }
  ): Promise<BolticSuccessResponse<TableRecord> | BolticErrorResponse> {
    try {
      const { fields, db_id, ...updateData } = updates;
      const endpoint = TABLE_ENDPOINTS.update;
      let url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      // Add db_id query parameter if provided
      url = addDbIdToUrl(url, db_id);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: updateData,
        timeout: this.config.timeout,
      });

      // Apply field filtering if fields are specified
      const responseData = response.data as BolticSuccessResponse<TableRecord>;
      if (fields && responseData.data) {
        responseData.data = filterObjectFields(
          responseData.data as unknown as Record<string, unknown>,
          fields as string[]
        ) as unknown as TableRecord;
      }

      return responseData;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(
    tableId: string,
    options: { db_id?: string } = {}
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.delete;
      let url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      // Add db_id query parameter if provided
      url = addDbIdToUrl(url, options.db_id);

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
