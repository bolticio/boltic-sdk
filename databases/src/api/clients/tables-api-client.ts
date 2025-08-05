import {
  TableCreateRequest,
  TableCreateResponse,
  TableQueryOptions,
  TableRecord,
} from '../../types/api/table';
import type { Environment } from '../../types/config/environment';
import { createHttpAdapter } from '../../utils/http';
import { HttpAdapter } from '../../utils/http/adapter';
import {
  Currency,
  CurrencyValidator as CurrencyValidatorType,
  createCurrencyValidator,
} from '../../utils/validation/currency-validator';
import { TABLE_ENDPOINTS, buildEndpointPath } from '../endpoints/tables';
import {
  TableApiResponse,
  TableListApiResponse,
  transformGenerateSchemaRequest,
  transformTableCreateRequest,
  transformTableListRequest,
  transformTableListResponse,
  transformTableResponse,
  transformTableUpdateRequest,
} from '../transformers/tables';

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

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Tables API Client - handles all table-related API operations
 */
export class TablesApiClient {
  private httpAdapter: HttpAdapter;
  private config: TablesApiClientConfig;
  private currencyValidator: CurrencyValidatorType;
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

    this.currencyValidator = createCurrencyValidator(
      this.httpAdapter,
      this.baseURL,
      this.config.apiKey
    );
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
  ): Promise<{ data: TableCreateResponse; error?: ApiError }> {
    try {
      // Validate currency formats if any
      await this.validateCurrencyFormats(request.fields);

      const endpoint = TABLE_ENDPOINTS.create;
      const url = `${this.baseURL}${endpoint.path}`;
      const transformedRequest = transformTableCreateRequest(request, options);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        // Return the nested data directly without double wrapping
        return response.data as { data: TableCreateResponse; error?: ApiError };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as TableCreateResponse,
        error: this.formatError(error),
      };
    }
  }

  /**
   * List tables with filtering and pagination
   */
  async listTables(options: TableListOptions = {}): Promise<{
    data: TableRecord[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    error?: ApiError;
  }> {
    try {
      const endpoint = TABLE_ENDPOINTS.list;
      const url = `${this.baseURL}${endpoint.path}`;
      const transformedRequest = transformTableListRequest(options);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        const transformed = transformTableListResponse(
          response.data as TableListApiResponse
        );

        return {
          data: transformed.tables,
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
   * Get a specific table by ID
   */
  async getTable(
    tableId: string
  ): Promise<{ data: TableRecord; error?: ApiError }> {
    try {
      const endpoint = TABLE_ENDPOINTS.get;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: transformTableResponse(response.data as TableApiResponse),
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as TableRecord,
        error: this.formatError(error),
      };
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
  ): Promise<{ data: TableRecord; error?: ApiError }> {
    try {
      const endpoint = TABLE_ENDPOINTS.update;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;
      const transformedRequest = transformTableUpdateRequest(updates);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: transformTableResponse(response.data as TableApiResponse),
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as TableRecord,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(
    tableId: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    try {
      const endpoint = TABLE_ENDPOINTS.delete;
      const url = `${this.baseURL}${buildEndpointPath(endpoint, { table_id: tableId })}`;

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
   * Generate table schema using AI
   */
  async generateSchema(prompt: string): Promise<{
    data?: {
      fields: Array<{
        name: string;
        type: string;
        description?: string;
      }>;
      name?: string;
      description?: string;
    };
    error?: ApiError;
  }> {
    try {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('Prompt is required for schema generation');
      }

      const endpoint = TABLE_ENDPOINTS.generateSchema;
      const url = `${this.baseURL}${endpoint.path}`;
      const transformedRequest = transformGenerateSchemaRequest(prompt.trim());

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout || 30000, // Longer timeout for AI operations
      });

      return response.data as {
        data?: {
          fields: Array<{
            name: string;
            type: string;
            description?: string;
          }>;
          name?: string;
          description?: string;
        };
        error?: ApiError;
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get available currencies from the API
   */
  async getCurrencies(): Promise<{
    data?: Array<{
      code: string;
      name: string;
      symbol: string;
    }>;
    error?: ApiError;
  }> {
    try {
      const endpoint = TABLE_ENDPOINTS.getCurrencies;
      const url = `${this.baseURL}${endpoint.path}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        timeout: this.config.timeout,
      });

      return response.data as {
        data?: Array<{
          code: string;
          name: string;
          symbol: string;
        }>;
        error?: ApiError;
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Validate currency format using the currencies API
   */
  async validateCurrencyFormat(currencyCode: string): Promise<{
    isValid: boolean;
    error?: string;
    suggestion?: string;
  }> {
    return this.currencyValidator.validateCurrencyFormat(currencyCode);
  }

  /**
   * Get available currencies (with caching)
   */
  async getAvailableCurrencies(): Promise<Currency[]> {
    return this.currencyValidator.getAvailableCurrencies();
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

  private formatError(error: unknown): ApiError {
    if (this.config.debug) {
      console.error('Tables API Error:', error);
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

  private async validateCurrencyFormats(
    schema: Array<{ type: string; currency_format?: string; name: string }>
  ): Promise<void> {
    const currencyFields = schema.filter(
      (field) => field.type === 'currency' && field.currency_format
    );

    for (const field of currencyFields) {
      const validation = await this.currencyValidator.validateCurrencyFormat(
        field.currency_format!
      );
      if (!validation.isValid) {
        throw new Error(
          `Invalid currency format in field '${field.name}': ${validation.error}. ${validation.suggestion || ''}`
        );
      }
    }
  }
}
