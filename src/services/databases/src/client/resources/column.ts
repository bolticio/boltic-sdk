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

      const result = await this.columnsApiClient.createColumn(tableId, column);

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

      const result = await this.columnsApiClient.createColumns(tableId, {
        columns,
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
   * List all columns in a table
   */
  async list(
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

      const result = await this.columnsApiClient.listColumns(tableId, options);

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
        data: result.data,
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
