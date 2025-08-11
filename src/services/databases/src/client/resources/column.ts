import { ColumnsApiClient } from '../../api/clients/columns-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ApiError, ValidationError } from '../../errors';
import {
  ColumnDeleteOptions,
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateOptions,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import { PaginationInfo } from '../../types/common/operations';
import { ApiResponse } from '../../types/common/responses';
import { ColumnValidator } from '../../utils/validation/column-validator';
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
  ): Promise<ApiResponse<ColumnRecord>> {
    // Get current table context
    const tableId = await TableResource.getTableId(
      this.tablesApiClient,
      tableName
    );
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Pass column data as-is without transformation
    try {
      const result = await this.columnsApiClient.createColumn(tableId, column);

      if (result.error) {
        return {
          error: result.error.message,
          details: result.error,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        throw new ValidationError('Column already exists', [
          {
            field: 'columns',
            message: 'Column already exists in the table',
          },
        ]);
      }
      throw error;
    }
  }

  /**
   * Find columns in a table with filtering and pagination
   */
  async findAll(
    tableName: string,
    options: ColumnQueryOptions = {}
  ): Promise<ApiResponse<ColumnDetails[]> & { pagination?: PaginationInfo }> {
    const tableId = await TableResource.getTableId(
      this.tablesApiClient,
      tableName
    );
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    try {
      const result = await this.columnsApiClient.listColumns(tableId, options);

      if (result.error) {
        return {
          error: result.error.message,
          details: result.error,
        };
      }

      return {
        data: result.data,
        pagination: result.pagination
          ? {
              total_count: result.pagination.total_count,
              total_pages: result.pagination.total_pages,
              current_page: result.pagination.current_page,
              per_page: result.pagination.per_page,
              type: result.pagination.type,
            }
          : undefined,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      };
    }
  }

  /**
   * Find a single column
   */
  async findOne(
    tableName: string,
    options: ColumnQueryOptions
  ): Promise<ApiResponse<ColumnDetails | null>> {
    if (!options.where || Object.keys(options.where).length === 0) {
      throw new ValidationError(
        'findOne requires at least one where condition',
        [
          {
            field: 'where',
            message: 'Where clause is required for findOne operation',
          },
        ]
      );
    }

    const tableId = await TableResource.getTableId(
      this.tablesApiClient,
      tableName
    );
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // If searching by name, use the optimized findColumnByName method
    if (options.where.name && !options.where.id) {
      const result = await this.columnsApiClient.findColumnByName(
        tableId,
        options.where.name
      );

      if (result.error) {
        return {
          error: result.error.message,
          details: result.error,
        };
      }

      return {
        data: result.data,
      };
    }

    // Otherwise, use the list method with limit 1
    const queryOptions = { ...options, limit: 1 };

    const result = await this.columnsApiClient.listColumns(
      tableId,
      queryOptions
    );

    if (result.error) {
      return {
        error: result.error.message,
        details: result.error,
      };
    }

    const column = result.data[0] || null;
    return {
      data: column,
    };
  }

  /**
   * Update a column
   */
  async update(
    tableName: string,
    options: ColumnUpdateOptions
  ): Promise<ApiResponse<ColumnDetails>> {
    ColumnValidator.validateUpdateRequest(
      options.set as Record<string, unknown>
    );

    const tableId = await TableResource.getTableId(
      this.tablesApiClient,
      tableName
    );
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Pass update data as-is without transformation
    try {
      let result;

      // If updating by name, use the optimized method
      if (options.where.name && !options.where.id) {
        result = await this.columnsApiClient.updateColumnByName(
          tableId,
          options.where.name,
          options.set
        );
      } else {
        // Find the column to get its ID
        let columnId: string;
        if (options.where.id) {
          columnId = options.where.id;
        } else if (options.where.name) {
          const findResult = await this.findOne(tableName, {
            where: { name: options.where.name },
          });
          if (!findResult.data) {
            throw new ValidationError('Column not found', [
              {
                field: 'column',
                message: `Column '${options.where.name}' not found in table '${tableName}'`,
              },
            ]);
          }
          columnId = findResult.data.id;
        } else {
          throw new ValidationError('Column identifier required', [
            {
              field: 'where',
              message: 'Column ID or name is required for update operation',
            },
          ]);
        }

        result = await this.columnsApiClient.updateColumn(
          tableId,
          columnId,
          options.set
        );
      }

      if (result.error) {
        return {
          error: result.error.message,
          details: result.error,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      };
    }
  }

  /**
   * Delete a column
   */
  async delete(
    tableName: string,
    options: ColumnDeleteOptions
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    const tableId = await TableResource.getTableId(
      this.tablesApiClient,
      tableName
    );
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    try {
      let result;

      // If deleting by name, use the optimized method
      if (options.where.name && !options.where.id) {
        result = await this.columnsApiClient.deleteColumnByName(
          tableId,
          options.where.name
        );
      } else {
        // Find the column to get its ID
        let columnId: string;
        if (options.where.id) {
          columnId = options.where.id;
        } else if (options.where.name) {
          const findResult = await this.findOne(tableName, {
            where: { name: options.where.name },
          });
          if (!findResult.data) {
            throw new ValidationError('Column not found', [
              {
                field: 'column',
                message: `Column '${options.where.name}' not found in table '${tableName}'`,
              },
            ]);
          }
          columnId = findResult.data.id;
        } else {
          throw new ValidationError('Column identifier required', [
            {
              field: 'where',
              message: 'Column ID or name is required for delete operation',
            },
          ]);
        }

        result = await this.columnsApiClient.deleteColumn(tableId, columnId);
      }

      if (result.error) {
        return {
          error: result.error.message,
          details: result.error,
        };
      }

      return {
        data: {
          success: result.success,
          message: result.success
            ? 'Column deleted successfully'
            : 'Failed to delete column',
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      };
    }
  }

  protected buildQueryParams(
    options: ColumnQueryOptions = {}
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (options.fields?.length) {
      params.fields = options.fields.join(',');
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(',');
    }

    if (options.limit !== undefined) {
      params.limit = options.limit;
    }

    if (options.offset !== undefined) {
      params.offset = options.offset;
    }

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[`where[${key}]`] = value;
        }
      });
    }

    return params;
  }
}
