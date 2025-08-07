import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ValidationError } from '../../errors';
import {
  FieldDefinition,
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
      this.validateCreateRequest(data);
      const result = await this.tablesApiClient.createTable(data);
      if (result.error) {
        let errorMessage = 'Unknown error';

        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error.message) {
          errorMessage = result.error.message;
        } else if (
          result.error.details &&
          Array.isArray(result.error.details)
        ) {
          errorMessage = result.error.details.join(', ');
        } else if (
          result.error.details &&
          typeof result.error.details === 'string'
        ) {
          errorMessage = result.error.details;
        } else if (
          (result.error as { meta?: unknown }).meta &&
          Array.isArray((result.error as { meta?: unknown }).meta)
        ) {
          errorMessage = (
            (result.error as { meta?: unknown }).meta as string[]
          ).join(', ');
        } else if (
          (result.error as { meta?: unknown }).meta &&
          typeof (result.error as { meta?: unknown }).meta === 'string'
        ) {
          errorMessage = (result.error as { meta?: string }).meta || '';
        }

        return {
          error: errorMessage,
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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
          error:
            typeof result.error === 'string'
              ? result.error
              : result.error.message || 'Unknown error',
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

  private validateCreateRequest(data: TableCreateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Table name is required' });
    } else {
      this.validateTableName(data.name);
    }

    if (
      !data.fields ||
      !Array.isArray(data.fields) ||
      data.fields.length === 0
    ) {
      errors.push({
        field: 'fields',
        message: 'Fields are required and must be a non-empty array',
      });
    } else {
      this.validateSchema(data.fields, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('Table creation validation failed', errors);
    }
  }

  private validateTableName(name: string): void {
    if (name.length > 64) {
      throw new ValidationError('Table name must be 64 characters or less');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name)) {
      throw new ValidationError(
        'Table name must start with a letter or underscore and contain only letters, numbers, underscores, and hyphens'
      );
    }
  }

  private validateSchema(
    schema: FieldDefinition[],
    errors: Array<{ field: string; message: string }>
  ): void {
    const fieldNames = new Set<string>();

    schema.forEach((field, index) => {
      // Check for duplicate field names
      if (fieldNames.has(field.name)) {
        errors.push({
          field: `fields[${index}].name`,
          message: `Duplicate field name: ${field.name}`,
        });
      } else {
        fieldNames.add(field.name);
      }

      // Validate field name
      if (!field.name || field.name.trim().length === 0) {
        errors.push({
          field: `fields[${index}].name`,
          message: 'Field name is required',
        });
      } else if (field.name.length > 64) {
        errors.push({
          field: `fields[${index}].name`,
          message: 'Field name must be 64 characters or less',
        });
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push({
          field: `fields[${index}].name`,
          message:
            'Field name must start with a letter or underscore and contain only letters, numbers, and underscores',
        });
      }

      // Validate field type
      if (!field.type) {
        errors.push({
          field: `fields[${index}].type`,
          message: 'Field type is required',
        });
      }

      // Validate required boolean fields
      if (typeof field.is_nullable !== 'boolean') {
        errors.push({
          field: `fields[${index}].is_nullable`,
          message: 'is_nullable must be a boolean',
        });
      }
      if (typeof field.is_primary_key !== 'boolean') {
        errors.push({
          field: `fields[${index}].is_primary_key`,
          message: 'is_primary_key must be a boolean',
        });
      }
      if (typeof field.is_unique !== 'boolean') {
        errors.push({
          field: `fields[${index}].is_unique`,
          message: 'is_unique must be a boolean',
        });
      }
      if (typeof field.is_indexed !== 'boolean') {
        errors.push({
          field: `fields[${index}].is_indexed`,
          message: 'is_indexed must be a boolean',
        });
      }
    });
  }

  private formatError(error: unknown): string {
    if (error instanceof ValidationError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }
}
