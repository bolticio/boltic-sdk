import { ApiError, TablesApiClient } from '../../api/clients/tables-api-client';
import {
  TableAccessRequest,
  TableCreateRequest,
  TableDeleteOptions,
  TableQueryOptions,
  TableRecord,
  TableUpdateRequest,
} from '../../types/api/table';
import { ApiResponse } from '../../types/common/responses';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';
import { createTableBuilder, TableBuilder } from './table-builder';

export interface GenerateSchemaOptions {
  prompt: string;
  isTemplate?: boolean;
}

export class TableResource extends BaseResource {
  private tablesApiClient: TablesApiClient;

  constructor(client: BaseClient) {
    super(client, '/v1/tables');
    const config = client.getConfig();

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
   * Create a new table
   */
  async create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>> {
    try {
      const result = await this.tablesApiClient.createTable(data);

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.data as unknown as TableRecord,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Find all tables with optional filtering
   */
  async findAll(
    options: TableQueryOptions = {}
  ): Promise<ApiResponse<TableRecord[]>> {
    try {
      const result = await this.tablesApiClient.listTables(options);

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Find a single table by ID or name
   */
  async findOne(
    options: TableQueryOptions
  ): Promise<ApiResponse<TableRecord | null>> {
    try {
      if (!options.where?.id && !options.where?.name) {
        throw new Error('Either id or name must be provided in where clause');
      }

      const tables = await this.findAll(options);

      if (tables.error) {
        return {
          error: tables.error,
        };
      }

      return {
        data: tables.data?.[0] || null,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Update a table by ID or name
   */
  async update(
    identifier: string,
    data: TableUpdateRequest
  ): Promise<ApiResponse<TableRecord>> {
    try {
      // First, find the table to get its ID
      const table = await this.findOne({
        where: { name: identifier },
      });

      if (table.error || !table.data) {
        return {
          error: table.error || 'Table not found',
        };
      }

      const result = await this.tablesApiClient.updateTable(
        table.data.id,
        data
      );

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Rename a table
   */
  async rename(
    oldName: string,
    newName: string
  ): Promise<ApiResponse<TableRecord>> {
    return this.update(oldName, { name: newName });
  }

  /**
   * Set table access permissions
   */
  async setAccess(data: TableAccessRequest): Promise<ApiResponse<TableRecord>> {
    try {
      const table = await this.findOne({
        where: { name: data.table_name },
      });

      if (table.error || !table.data) {
        return {
          error: table.error || 'Table not found',
        };
      }

      const result = await this.tablesApiClient.updateTable(table.data.id, {
        is_shared: data.is_shared,
      });

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Delete a table by ID or name
   */
  async delete(
    options: TableDeleteOptions | string
  ): Promise<ApiResponse<boolean>> {
    try {
      let tableId: string;

      if (typeof options === 'string') {
        // If options is a string, treat it as table name
        const table = await this.findOne({
          where: { name: options },
        });

        if (table.error || !table.data) {
          return {
            error: table.error || 'Table not found',
          };
        }

        tableId = table.data.id;
      } else {
        // If options is an object, find the table
        const table = await this.findOne({
          where: options.where,
        });

        if (table.error || !table.data) {
          return {
            error: table.error || 'Table not found',
          };
        }

        tableId = table.data.id;
      }

      const result = await this.tablesApiClient.deleteTable(tableId);

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.success,
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get table metadata by name
   */
  async getMetadata(name: string): Promise<ApiResponse<TableRecord | null>> {
    return this.findOne({ where: { name } });
  }

  /**
   * Generate table schema using AI
   */
  async generateSchema(prompt: string): Promise<
    ApiResponse<{
      fields: Array<{
        name: string;
        type: string;
        description?: string;
      }>;
      name?: string;
      description?: string;
    }>
  > {
    try {
      const result = await this.tablesApiClient.generateSchema(prompt);

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data:
          result.data ||
          ({} as {
            fields: Array<{
              name: string;
              type: string;
              description?: string;
            }>;
            name?: string;
            description?: string;
          }),
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get available currencies
   */
  async getCurrencies(): Promise<
    ApiResponse<
      Array<{
        code: string;
        name: string;
        symbol: string;
      }>
    >
  > {
    try {
      const result = await this.tablesApiClient.getCurrencies();

      if (result.error) {
        return {
          error: this.formatApiError(result.error),
        };
      }

      return {
        data: result.data || [],
      };
    } catch (error) {
      return {
        error: this.formatError(error),
      };
    }
  }

  /**
   * Get table ID by name using the tables API
   */
  static async getTableId(
    tablesApiClient: TablesApiClient,
    tableName: string
  ): Promise<string | null> {
    try {
      // List tables to find the one with matching name
      const result = await tablesApiClient.listTables({
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
      return tableId;
    } catch (error) {
      console.error('Error getting table ID:', error);
      return null;
    }
  }

  /**
   * Get table ID by name using the tables API (instance method)
   */
  async getTableId(tableName: string): Promise<string | null> {
    return TableResource.getTableId(this.tablesApiClient, tableName);
  }

  /**
   * Create a table builder for fluent API
   */
  builder(options: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): TableBuilder {
    return createTableBuilder(options, this.tablesApiClient);
  }

  // Private helper methods

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }

  private formatApiError(apiError: ApiError): string {
    // Pass through the API error message, or stringify the object if needed
    return apiError.message || JSON.stringify(apiError);
  }
}
