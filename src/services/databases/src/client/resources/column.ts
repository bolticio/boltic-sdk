import { ColumnsApiClient } from '../../api/clients/columns-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import {
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
  isErrorResponse,
} from '../../types/common/responses';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';
import { TableResource } from './table';

export class ColumnResource extends BaseResource {
  private columnsApiClient: ColumnsApiClient;
  private tablesApiClient: TablesApiClient;

  constructor(client: BaseClient) {
    super(client, '/v1/tables');

    // Initialize the API clients
    const config = client.getConfig();
    this.columnsApiClient = new ColumnsApiClient(config.apiKey, {
      environment: config.environment,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    this.tablesApiClient = new TablesApiClient(config.apiKey, {
      environment: config.environment,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });
  }

  /**
   * Add a single column to existing table
   */
  async create(
    tableName: string,
    column: FieldDefinition
  ): Promise<BolticSuccessResponse<ColumnRecord> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Apply defaults and auto-generate field_order
      const processedColumn = await this.processColumnDefaults(tableId, column);

      const result = await this.columnsApiClient.createColumn(
        tableId,
        processedColumn
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<ColumnRecord>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'CREATE_COLUMN_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Process column defaults and auto-generate field_order
   */
  private async processColumnDefaults(
    tableId: string,
    column: FieldDefinition
  ): Promise<FieldDefinition> {
    const processedColumn: FieldDefinition = { ...column };

    // Set default values for optional fields if not provided
    if (processedColumn.is_primary_key === undefined) {
      processedColumn.is_primary_key = false;
    }
    if (processedColumn.is_unique === undefined) {
      processedColumn.is_unique = false;
    }
    if (processedColumn.is_nullable === undefined) {
      processedColumn.is_nullable = true;
    }
    if (processedColumn.is_indexed === undefined) {
      processedColumn.is_indexed = false;
    }

    // Auto-generate field_order if not provided
    if (processedColumn.field_order === undefined) {
      processedColumn.field_order = await this.generateFieldOrder(tableId);
    }

    // Validate field_order is within acceptable range
    if (
      processedColumn.field_order <= 0 ||
      processedColumn.field_order >= 2147483647
    ) {
      throw new Error(
        'Field order must be a number greater than 0 and less than 2147483647'
      );
    }

    return processedColumn;
  }

  /**
   * Generate the next available field_order for a table
   */
  private async generateFieldOrder(tableId: string): Promise<number> {
    try {
      // Get existing columns to find the highest field_order
      const existingColumns = await this.columnsApiClient.listColumns(tableId);

      let maxOrder = 0;
      if (
        !isErrorResponse(existingColumns) &&
        existingColumns.data &&
        Array.isArray(existingColumns.data)
      ) {
        for (const col of existingColumns.data) {
          if (col.field_order && col.field_order > maxOrder) {
            maxOrder = col.field_order;
          }
        }
      }

      // Return next available number (starting from 1 if no columns exist)
      return maxOrder + 1;
    } catch (error) {
      // Fallback to timestamp-based order if there's an error
      return Math.floor(Date.now() / 1000) % 2147483647;
    }
  }

  /**
   * Transform SDK ColumnQueryOptions to API request format
   */
  private transformColumnQueryToApiRequest(
    options: ColumnQueryOptions
  ): unknown {
    const apiRequest: {
      page: { page_no: number; page_size: number };
      filters: Array<{ field: string; operator: string; values: unknown[] }>;
      sort: Array<{ field: string; direction: string }>;
    } = {
      page: {
        page_no: 1,
        page_size: options.limit || 100,
      },
      filters: [],
      sort: [],
    };

    // Handle pagination
    if (options.offset && options.limit) {
      const pageNo = Math.floor(options.offset / options.limit) + 1;
      apiRequest.page.page_no = pageNo;
    }

    // Transform where clause to filters
    if (options.where) {
      Object.entries(options.where).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          apiRequest.filters.push({
            field,
            operator: '=',
            values: [value],
          });
        }
      });
    }

    // Transform sort
    if (options.sort) {
      apiRequest.sort = options.sort.map((s) => ({
        field: s.field,
        direction: s.order,
      }));
    }

    return apiRequest;
  }

  /**
   * Add multiple columns to existing table
   */
  async createMany(
    tableName: string,
    columns: FieldDefinition[]
  ): Promise<BolticListResponse<ColumnRecord> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Process all columns with defaults and auto-generate field_order
      const processedColumns: FieldDefinition[] = [];
      for (const column of columns) {
        const processedColumn = await this.processColumnDefaults(
          tableId,
          column
        );
        processedColumns.push(processedColumn);
      }

      const result = await this.columnsApiClient.createColumns(tableId, {
        columns: processedColumns,
      });

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticListResponse<ColumnRecord>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'CREATE_COLUMNS_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Find all columns in a table (replaces list functionality)
   */
  async findAll(
    tableName: string,
    options: ColumnQueryOptions = {}
  ): Promise<BolticListResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Transform SDK format to API format
      const apiRequest = this.transformColumnQueryToApiRequest(options);

      const result = await this.columnsApiClient.listColumns(
        tableId,
        apiRequest as unknown as ColumnQueryOptions
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticListResponse<ColumnDetails>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'LIST_COLUMNS_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Get a single column by name
   */
  async get(
    tableName: string,
    columnName: string
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      const result = await this.columnsApiClient.findColumnByName(
        tableId,
        columnName
      );

      if (isErrorResponse(result)) {
        return result;
      }

      if (!result.data) {
        return {
          data: {},
          error: {
            code: 'COLUMN_NOT_FOUND',
            message: `Column '${columnName}' not found in table '${tableName}'`,
          },
        };
      }

      return {
        data: result.data as ColumnDetails,
        message: 'Column found successfully',
      };
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'GET_COLUMN_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  async findById(
    tableName: string,
    columnId: string
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Use the direct getColumn API method
      const result = await this.columnsApiClient.getColumn(tableId, columnId);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<ColumnDetails>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'FIND_COLUMN_BY_ID_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Update a column by name
   */
  async update(
    tableName: string,
    columnName: string,
    updates: ColumnUpdateRequest
  ): Promise<BolticSuccessResponse<ColumnDetails> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      const result = await this.columnsApiClient.updateColumnByName(
        tableId,
        columnName,
        updates
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<ColumnDetails>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'UPDATE_COLUMN_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Delete a column by name
   */
  async delete(
    tableName: string,
    columnName: string
  ): Promise<
    | BolticSuccessResponse<{ success: boolean; message?: string }>
    | BolticErrorResponse
  > {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      const result = await this.columnsApiClient.deleteColumnByName(
        tableId,
        columnName
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return {
        data: {
          success: true,
          message: 'Column deleted successfully',
        },
      };
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'DELETE_COLUMN_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Helper method to get table ID by name
   */
  private async getTableId(tableName: string): Promise<string | null> {
    try {
      // Use the table resource to find the table by name
      const tableResource = new TableResource(this.client);
      const tableResult = await tableResource.findByName(tableName);

      if (tableResult.data) {
        return tableResult.data.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting table ID:', error);
      return null;
    }
  }
}
