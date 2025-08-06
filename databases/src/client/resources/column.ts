import { ColumnsApiClient } from '../../api/clients/columns-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ApiError, ValidationError } from '../../errors';
import {
  ColumnDeleteOptions,
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateOptions,
  ColumnUpdateRequest,
  DateFormatEnum,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import { PaginationInfo } from '../../types/common/operations';
import { ApiResponse } from '../../types/common/responses';
import { ColumnValidator } from '../../utils/validation/column-validator';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';

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
    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Apply default values and transform user-friendly formats
    const processedData = this.processColumnData(column);

    try {
      const result = await this.columnsApiClient.createColumn(
        tableId,
        processedData
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
    const tableId = await this.getTableId(tableName);
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
              currentPage: result.pagination.page,
              totalPages: result.pagination.pages,
              totalCount: result.pagination.total,
              pageSize: result.pagination.limit,
              hasNextPage: result.pagination.page < result.pagination.pages,
              hasPreviousPage: result.pagination.page > 1,
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

    const tableId = await this.getTableId(tableName);
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
    queryOptions.where!.table_id = tableId;

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

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Process update data to transform user-friendly formats
    const processedUpdateData = this.processUpdateData(options.set);

    try {
      let result;

      // If updating by name, use the optimized method
      if (options.where.name && !options.where.id) {
        result = await this.columnsApiClient.updateColumnByName(
          tableId,
          options.where.name,
          processedUpdateData
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
          processedUpdateData
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
    const tableId = await this.getTableId(tableName);
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

  /**
   * Process single column data to apply default values and transform formats
   */
  private processColumnData(column: FieldDefinition): FieldDefinition {
    // Set default values
    const processedColumn: FieldDefinition = {
      ...column,
      // Required defaults
      description: column.description ?? undefined,
      default_value: column.default_value ?? undefined,
      is_nullable: column.is_nullable ?? true,
      is_indexed: column.is_indexed ?? false,
      is_primary_key: column.is_primary_key ?? false,
      is_unique: column.is_unique ?? false,

      // Hardcoded defaults
      is_visible: true,
      is_readonly: false,
      alignment: column.alignment ?? 'center',
      field_order: column.field_order ?? 2,
    };

    // Type-specific defaults
    switch (column.type) {
      case 'number':
        processedColumn.decimals = column.decimals ?? '0.00';
        break;
      case 'currency':
        processedColumn.decimals = column.decimals ?? '0.00';
        processedColumn.currency_format = column.currency_format ?? 'INR';
        break;
      case 'date-time':
        processedColumn.date_format = column.date_format ?? 'MMDDYY';
        processedColumn.timezone = column.timezone ?? 'utc';
        // Only set time_format if user provides it
        if (column.time_format) {
          processedColumn.time_format = column.time_format;
        }
        break;
      case 'phone-number':
        processedColumn.phone_format =
          column.phone_format ?? '+91 123 456 7890';
        break;
      case 'dropdown':
        processedColumn.selection_source =
          column.selection_source ?? 'provide-static-list';
        break;
    }

    // Transform date and time formats if provided
    if (
      processedColumn.date_format &&
      typeof processedColumn.date_format === 'string'
    ) {
      const dateFormatKey =
        processedColumn.date_format as keyof typeof DateFormatEnum;
      if (Object.keys(DateFormatEnum).includes(dateFormatKey)) {
        processedColumn.date_format =
          ColumnValidator.transformDateFormat(dateFormatKey);
      }
    }

    if (
      processedColumn.time_format &&
      typeof processedColumn.time_format === 'string'
    ) {
      const timeFormatKey =
        processedColumn.time_format as keyof typeof TimeFormatEnum;
      if (Object.keys(TimeFormatEnum).includes(timeFormatKey)) {
        processedColumn.time_format =
          ColumnValidator.transformTimeFormat(timeFormatKey);
      }
    }

    return processedColumn;
  }

  /**
   * Process update data to transform user-friendly formats
   */
  private processUpdateData(data: ColumnUpdateRequest): ColumnUpdateRequest {
    const processedData: ColumnUpdateRequest = { ...data };

    // Transform date and time formats
    if (data.date_format && typeof data.date_format === 'string') {
      processedData.date_format = ColumnValidator.transformDateFormat(
        data.date_format as keyof typeof DateFormatEnum
      ) as keyof typeof DateFormatEnum;
    }

    if (data.time_format && typeof data.time_format === 'string') {
      processedData.time_format = ColumnValidator.transformTimeFormat(
        data.time_format as keyof typeof TimeFormatEnum
      ) as keyof typeof TimeFormatEnum;
    }

    return processedData;
  }

  /**
   * Get table ID by name using the tables API
   */
  private async getTableId(tableName: string): Promise<string | null> {
    try {
      // List tables to find the one with matching name
      const result = await this.tablesApiClient.listTables({
        where: { name: tableName },
        limit: 1,
      });

      if (result.error) {
        console.error('Failed to fetch tables:', result.error);
        return null;
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      // Return the first matching table's ID
      const tableId = result.data[0].id;
      console.log(`Found table '${tableName}' with ID: ${tableId}`);
      return tableId;
    } catch (error) {
      console.error('Error getting table ID:', error);
      return null;
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
