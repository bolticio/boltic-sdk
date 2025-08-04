import { ValidationError } from '../../errors/utils';
import {
  FieldDefinition,
  FieldType,
  PaginationInfo,
  TableAccessRequest,
  TableCreateRequest,
  TableDeleteOptions,
  TableListResponse,
  TableQueryOptions,
  TableRecord,
  TableUpdateRequest,
} from '../../types/api/table';
import { ApiResponse } from '../../types/common/responses';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';

export class TableResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, '/v1/tables');
  }

  /**
   * Create a new table with schema
   */
  async create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>> {
    this.validateCreateRequest(data);

    // Get current database context (defaults to 'Default' if none set)
    const databaseId = this.getCurrentDatabaseId();

    const requestData = {
      ...data,
      database_id: databaseId,
    };

    try {
      const response = await this.makeRequest<TableRecord>(
        'POST',
        '',
        requestData
      );

      return response;
    } catch (error) {
      // Check if it's a 409 conflict (table already exists)
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 409
      ) {
        throw new ValidationError('Table already exists', [
          {
            field: 'table_name',
            message: 'A table with this name already exists in the database',
          },
        ]);
      }
      throw error;
    }
  }

  /**
   * Find multiple tables with filtering and pagination
   */
  async findAll(
    options: TableQueryOptions = {}
  ): Promise<ApiResponse<TableRecord[]> & { pagination?: PaginationInfo }> {
    // Auto-add current database filter if not specified
    const databaseId = this.getCurrentDatabaseId();
    if (databaseId && !options.where?.db_id) {
      options = {
        ...options,
        where: {
          ...options.where,
          db_id: databaseId,
        },
      };
    }

    const queryParams = this.buildQueryParams(options);
    const response = await this.makeRequest<TableListResponse>(
      'GET',
      '',
      undefined,
      { params: queryParams }
    );

    // Handle error response
    if (response.error) {
      return {
        error: response.error,
      } as ApiResponse<TableRecord[]> & { pagination?: PaginationInfo };
    }

    // Transform response to match expected format
    return {
      data: response.data?.tables || [],
      pagination: response.data?.pagination,
    } as ApiResponse<TableRecord[]> & { pagination?: PaginationInfo };
  }

  /**
   * Find a single table
   */
  async findOne(
    options: TableQueryOptions
  ): Promise<ApiResponse<TableRecord | null>> {
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

    // Auto-add current database filter if not specified
    const databaseId = this.getCurrentDatabaseId();
    if (databaseId && !options.where.db_id) {
      options.where.db_id = databaseId;
    }

    const queryParams = this.buildQueryParams({ ...options, limit: 1 });
    const response = await this.makeRequest<TableListResponse>(
      'GET',
      '',
      undefined,
      { params: queryParams }
    );

    // Handle error response
    if (response.error) {
      return {
        error: response.error,
      } as ApiResponse<TableRecord | null>;
    }

    const table = response.data?.tables?.[0] || null;
    return {
      data: table,
    } as ApiResponse<TableRecord | null>;
  }

  /**
   * Update a table
   */
  async update(
    identifier: string | TableQueryOptions,
    data?: TableUpdateRequest
  ): Promise<ApiResponse<TableRecord>> {
    let updateData: TableUpdateRequest;
    let tableId: string;

    if (typeof identifier === 'string') {
      // Update by table name
      updateData = data!;

      // Find table by name to get ID
      const findResult = await this.findOne({ where: { name: identifier } });
      if (!findResult.data) {
        throw new ValidationError('Table not found', [
          { field: 'identifier', message: `Table '${identifier}' not found` },
        ]);
      }
      tableId = findResult.data.id;
    } else {
      throw new ValidationError(
        'Table updates must specify a table name or ID',
        [
          {
            field: 'identifier',
            message: 'Table identifier is required for updates',
          },
        ]
      );
    }

    this.validateUpdateRequest(updateData);

    const response = await this.makeRequest<TableRecord>(
      'PUT',
      `/${tableId}`,
      updateData
    );

    return response;
  }

  /**
   * Rename a table
   */
  async rename(
    oldName: string,
    newName: string
  ): Promise<ApiResponse<TableRecord>> {
    this.validateTableName(newName);

    return this.update(oldName, { name: newName });
  }

  /**
   * Set table access permissions
   */
  async setAccess(
    accessData: TableAccessRequest
  ): Promise<ApiResponse<TableRecord>> {
    // Use update API with is_shared property
    return this.update(accessData.table_name, {
      is_shared: accessData.is_shared,
    });
  }

  /**
   * Delete a table
   */
  async delete(
    options: TableDeleteOptions | string
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    let whereClause: { id?: string; name?: string };
    let tableId: string | undefined;

    if (typeof options === 'string') {
      // Delete by table name
      const findResult = await this.findOne({ where: { name: options } });
      if (!findResult.data) {
        throw new ValidationError('Table not found', [
          { field: 'table', message: `Table '${options}' not found` },
        ]);
      }
      tableId = findResult.data.id;
      whereClause = { id: tableId };
    } else {
      whereClause = options.where;
      if (whereClause.id) {
        tableId = whereClause.id;
      } else if (whereClause.name) {
        const findResult = await this.findOne({
          where: { name: whereClause.name },
        });
        tableId = findResult.data?.id;
      }
    }

    if (!tableId) {
      throw new ValidationError('Table not found for deletion', [
        { field: 'identifier', message: 'Could not resolve table identifier' },
      ]);
    }

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>('DELETE', `/${tableId}`);

    return response;
  }

  /**
   * Get table metadata including schema
   */
  async getMetadata(tableName: string): Promise<ApiResponse<TableRecord>> {
    const response = await this.findOne({
      where: { name: tableName },
    });

    if (!response.data) {
      throw new ValidationError('Table not found', [
        { field: 'table_name', message: `Table '${tableName}' not found` },
      ]);
    }

    return {
      data: response.data,
      error: response.error,
    };
  }

  // Private helper methods
  private validateCreateRequest(data: TableCreateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.table_name || data.table_name.trim().length === 0) {
      errors.push({ field: 'table_name', message: 'Table name is required' });
    } else {
      this.validateTableName(data.table_name);
    }

    if (
      !data.schema ||
      !Array.isArray(data.schema) ||
      data.schema.length === 0
    ) {
      errors.push({
        field: 'schema',
        message: 'Table schema is required and must contain at least one field',
      });
    } else {
      this.validateSchema(data.schema);
    }

    if (data.description && data.description.length > 255) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 255 characters',
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Table creation validation failed', errors);
    }
  }

  private validateUpdateRequest(data: TableUpdateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Table name cannot be empty' });
      } else {
        this.validateTableName(data.name);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Table update validation failed', errors);
    }
  }

  private validateTableName(name: string): void {
    // Table name validation rules
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
      throw new ValidationError('Invalid table name', [
        {
          field: 'table_name',
          message:
            'Table name must start with a letter and contain only letters, numbers, hyphens, and underscores',
        },
      ]);
    }

    if (name.length > 50) {
      throw new ValidationError('Table name too long', [
        {
          field: 'table_name',
          message: 'Table name cannot exceed 50 characters',
        },
      ]);
    }

    // Reserved words check
    const reservedWords = [
      'table',
      'index',
      'view',
      'database',
      'schema',
      'select',
      'insert',
      'update',
      'delete',
      'vector',
    ];
    if (reservedWords.includes(name.toLowerCase())) {
      throw new ValidationError('Reserved table name', [
        {
          field: 'table_name',
          message: `'${name}' is a reserved word and cannot be used as a table name`,
        },
      ]);
    }
  }

  private validateSchema(schema: FieldDefinition[]): void {
    const errors: Array<{ field: string; message: string }> = [];
    const fieldNames = new Set<string>();

    schema.forEach((field, index) => {
      const fieldPrefix = `schema[${index}]`;

      // Validate field name
      if (!field.name || field.name.trim().length === 0) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: 'Field name is required',
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message:
            'Field name must start with a letter and contain only letters, numbers, and underscores',
        });
      } else if (fieldNames.has(field.name.toLowerCase())) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: `Duplicate field name: ${field.name}`,
        });
      } else {
        fieldNames.add(field.name.toLowerCase());
      }

      // Validate field type
      if (!field.type) {
        errors.push({
          field: `${fieldPrefix}.type`,
          message: 'Field type is required',
        });
      } else {
        this.validateFieldType(field, fieldPrefix, errors);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError('Schema validation failed', errors);
    }
  }

  private validateFieldType(
    field: FieldDefinition,
    fieldPrefix: string,
    errors: Array<{ field: string; message: string }>
  ): void {
    const validTypes: FieldType[] = [
      'text',
      'long-text',
      'number',
      'currency',
      'checkbox',
      'dropdown',
      'email',
      'phone-number',
      'link',
      'json',
      'date-time',
      'vector',
      'halfvec',
      'sparsevec',
    ];

    if (!validTypes.includes(field.type)) {
      errors.push({
        field: `${fieldPrefix}.type`,
        message: `Invalid field type: ${field.type}`,
      });
      return;
    }

    // Type-specific validations
    switch (field.type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!field.vector_dimension || field.vector_dimension <= 0) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: `${field.type} fields require a positive vector_dimension`,
          });
        }
        if (
          field.type === 'halfvec' &&
          field.vector_dimension &&
          field.vector_dimension > 65535
        ) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: 'Half-vector fields support maximum 65535 dimensions',
          });
        }
        break;

      case 'currency':
        if (
          field.currency_format &&
          !/^[A-Z]{3}$/.test(field.currency_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.currency_format`,
            message: 'Currency format must be a 3-letter ISO code (e.g., USD)',
          });
        }
        break;

      case 'dropdown':
        if (
          !field.selectable_items ||
          !Array.isArray(field.selectable_items) ||
          field.selectable_items.length === 0
        ) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: 'Dropdown fields require selectable_items array',
          });
        }
        if (field.selectable_items && field.selectable_items.length > 100) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: 'Dropdown fields support maximum 100 selectable items',
          });
        }
        break;

      case 'email':
        // Email fields don't need additional validation
        break;

      case 'phone-number':
        if (
          field.phone_format &&
          !['international', 'national', 'e164'].includes(field.phone_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.phone_format`,
            message:
              'Phone format must be one of: international, national, e164',
          });
        }
        break;

      case 'link':
        // URLs will be validated at the data level, not schema level
        break;

      case 'long-text':
        // Long text fields support larger content than regular text
        break;

      case 'text':
        // Regular text fields
        break;

      case 'number':
        if (
          field.decimals &&
          typeof field.decimals === 'number' &&
          field.decimals < 0
        ) {
          errors.push({
            field: `${fieldPrefix}.decimals`,
            message: 'Decimal places must be non-negative',
          });
        }
        break;

      case 'checkbox':
        if (
          field.default_value !== undefined &&
          typeof field.default_value !== 'boolean'
        ) {
          errors.push({
            field: `${fieldPrefix}.default_value`,
            message: 'Checkbox default value must be boolean',
          });
        }
        break;

      case 'date-time':
        if (field.date_format && !/^[YMD\-/\s]+$/.test(field.date_format)) {
          errors.push({
            field: `${fieldPrefix}.date_format`,
            message: 'Invalid date format pattern',
          });
        }
        if (field.time_format && !/^[Hms:\s]+$/.test(field.time_format)) {
          errors.push({
            field: `${fieldPrefix}.time_format`,
            message: 'Invalid time format pattern',
          });
        }
        break;

      case 'json':
        // JSON fields don't need schema-level validation
        break;
    }
  }

  private getCurrentDatabaseId(): string | null {
    // Get database context from client
    const client = this.client as BaseClient & {
      getDatabaseContext?: () => { databaseId: string } | null;
    };
    if (client.getDatabaseContext) {
      const context = client.getDatabaseContext();
      return context?.databaseId || 'Default';
    }
    return 'Default';
  }

  protected buildQueryParams(
    options: TableQueryOptions = {}
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

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
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Handle complex operators
            Object.entries(value).forEach(([operator, operatorValue]) => {
              params[`where[${key}][${operator}]`] = operatorValue;
            });
          } else {
            params[`where[${key}]`] = value;
          }
        }
      });
    }

    return params;
  }
}
