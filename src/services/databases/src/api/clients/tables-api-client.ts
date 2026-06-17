import {
  TableCreateRequest,
  TableCreateResponse,
  TableQueryOptions,
  TableRecord,
  TableSchemaRecord,
  SchemaListOptions,
} from '../../types/api/table';
import {
  BaseApiClient,
  type BaseApiClientConfig,
  type BolticSuccessResponse,
  type BolticListResponse,
  type BolticErrorResponse,
} from '../../../../common';
import { filterArrayFields, filterObjectFields } from '../../utils/common';
import { addDbIdToUrl } from '../../utils/database/db-context';
import { buildEndpointPath, TABLE_ENDPOINTS } from '../endpoints/tables';
import { transformTableCreateRequest } from '../transformers/tables';

export type TablesApiClientConfig = BaseApiClientConfig;

export interface TableCreateOptions {
  is_ai_generated_schema?: boolean;
  is_template?: boolean;
  db_id?: string;
}

export interface TableListOptions extends TableQueryOptions {
  page?: number;
  pageSize?: number;
  db_id?: string;
}

export class TablesApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config);
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

  /**
   * List table schemas with optional filtering by table name
   */
  async listSchema(
    options: SchemaListOptions = {}
  ): Promise<BolticListResponse<TableSchemaRecord> | BolticErrorResponse> {
    try {
      const endpoint = TABLE_ENDPOINTS.schemaList;
      let url = `${this.baseURL}${endpoint.path}`;
      url = addDbIdToUrl(url, options.db_id);

      const resourceId = options.resource_id || 'boltic';
      url += url.includes('?')
        ? `&resource_id=${encodeURIComponent(resourceId)}`
        : `?resource_id=${encodeURIComponent(resourceId)}`;
      const filters: Array<{
        field: string;
        operator: string;
        values: unknown[];
      }> = [];
      if (options.tableName) {
        filters.push({
          field: 'name',
          operator: '=',
          values: [options.tableName],
        });
      }

      const requestPayload = {
        page: {
          page_no: options.page || 1,
          page_size: options.pageSize || 1000,
        },
        filters,
        sort: [{ field: 'created_at', direction: 'desc' }],
      };

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: requestPayload,
        timeout: this.config.timeout,
      });

      return response.data as BolticListResponse<TableSchemaRecord>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
