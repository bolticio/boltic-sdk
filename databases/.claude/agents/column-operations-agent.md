# Column Operations Agent Instructions

## Agent Role and Responsibility

You are the **Column Operations Agent** responsible for implementing all column/field management operations for the Boltic Tables SDK. Your mission is to create comprehensive column CRUD functionality, support both direct and fluent API styles, handle field type modifications, and provide robust validation for column operations.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Table Operations Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for column operation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known column operation issues

## Dependencies

This agent depends on the **Table Operations Agent** completion. Verify these exist:

- Table context management and schema utilities
- Complete field type definitions and validation
- Database context management and selection
- BaseResource class and operation interfaces
- BolticClient with table operations

## Primary Tasks

### Task 1: Column Type Definitions

**Duration**: 1 day
**Priority**: Critical

#### 1.1 Create Column API Types

Create `src/types/api/column.ts`:

```typescript
import { FieldDefinition, FieldType } from './table';

// Field type enum for validation
export enum FieldTypeEnum {
  TEXT = 'text',
  EMAIL = 'email',
  LONG_TEXT = 'long-text',
  DATE_TIME = 'date-time',
  NUMBER = 'number',
  CURRENCY = 'currency',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  PHONE_NUMBER = 'phone-number',
  LINK = 'link',
  JSON = 'json',
  VECTOR = 'vector',
  SPARSEVECTOR = 'sparsevec',
  HALFVECTOR = 'halfvec',
}

// Allowed field type conversions
const ALLOWED_FIELD_TYPE_CONVERSIONS = {
  [FieldTypeEnum.TEXT]: [
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.EMAIL]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.LONG_TEXT]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.DATE_TIME]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.NUMBER]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.CURRENCY]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.CHECKBOX]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.DROPDOWN]: [],
  [FieldTypeEnum.PHONE_NUMBER]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.LINK]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.JSON]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.VECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.HALFVECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.VECTOR,
  ],
  [FieldTypeEnum.SPARSEVECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.HALFVECTOR,
    FieldTypeEnum.SPARSEVECTOR,
  ],
  [FieldTypeEnum.HALFVECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
};

// Field-specific validation keys map
const FIELD_SPECIFIC_KEYS_MAP = {
  [FieldTypeEnum.TEXT]: [],
  [FieldTypeEnum.EMAIL]: [],
  [FieldTypeEnum.LONG_TEXT]: [],
  [FieldTypeEnum.NUMBER]: ['decimals'],
  [FieldTypeEnum.CURRENCY]: ['decimals', 'currency_format'],
  [FieldTypeEnum.CHECKBOX]: [],
  [FieldTypeEnum.DROPDOWN]: [
    'selection_source',
    'selectable_items',
    'multiple_selections',
  ],
  [FieldTypeEnum.DATE_TIME]: ['timezone', 'date_format', 'time_format'],
  [FieldTypeEnum.PHONE_NUMBER]: ['phone_format'],
  [FieldTypeEnum.LINK]: [],
  [FieldTypeEnum.JSON]: [],
  [FieldTypeEnum.VECTOR]: ['vector_dimension'],
  [FieldTypeEnum.SPARSEVECTOR]: ['vector_dimension'],
  [FieldTypeEnum.HALFVECTOR]: ['vector_dimension'],
};

export interface ColumnCreateRequest {
  columns: FieldDefinition[];
}

export interface ColumnUpdateRequest {
  name?: string;
  description?: string;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  is_visible?: boolean;
  is_readonly?: boolean;
  default_value?: any;

  // Type-specific properties that can be updated
  alignment?: 'left' | 'center' | 'right';
  decimals?:
    | '00'
    | '0.0'
    | '0.00'
    | '0.000'
    | '0.0000'
    | '0.00000'
    | '0.000000';
  currency_format?: string; // Use Currency API for validation
  selection_source?: 'provide-static-list';
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?:
    | '+91 123 456 7890'
    | '(123) 456-7890'
    | '+1 (123) 456-7890'
    | '+91 12 3456 7890';
  date_format?:
    | '%m/%d/%y'
    | '%m/%d/%Y'
    | '%m-%d-%Y'
    | '%d-%m-%Y'
    | '%d/%m/%Y'
    | '%Y-%m-%d'
    | '%B %d %Y'
    | '%b %d %Y'
    | '%a %b %d %Y';
  time_format?:
    | '%H:%M:%S'
    | '%H:%M:%SZ'
    | '%H:%M:%S.%f'
    | '%H:%M:%S %Z'
    | '%I:%M %p'
    | '%I:%M:%S %p';
  timezone?: string;
  vector_dimension?: number;
}

export interface ColumnRecord {
  id: string;
  name: string;
  original_name: string; // Name when column was created
  table_id: string;
  table_name: string;
  type: FieldType;
  description?: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  is_indexed: boolean;
  is_visible: boolean;
  is_readonly: boolean;
  field_order: number;
  default_value?: any;
  created_at: string;
  updated_at: string;

  // Type-specific properties
  alignment?: 'left' | 'center' | 'right';
  timezone?: string;
  date_format?: string;
  time_format?: string;
  decimals?: number | string;
  currency_format?: string;
  selection_source?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;
  vector_dimension?: number;
}

export interface ColumnQueryOptions {
  where?: {
    id?: string;
    name?: string;
    table_id?: string;
    type?: FieldType;
    is_nullable?: boolean;
    is_unique?: boolean;
    is_indexed?: boolean;
    is_primary_key?: boolean;
  };
  fields?: Array<keyof ColumnRecord>;
  sort?: Array<{
    field: keyof ColumnRecord;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface ColumnDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

export interface ColumnListResponse {
  columns: ColumnRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ColumnUpdateOptions {
  set: ColumnUpdateRequest;
  where: {
    id?: string;
    name?: string;
  };
}
```

### Task 2: Column Resource Implementation (Method 1)

**Duration**: 3-4 days
**Priority**: Critical

#### 2.1 Create Column Resource Class

Create `src/client/resources/column.ts`:

```typescript
import { BaseResource, ApiResponse } from '../core/base-resource';
import { BaseClient } from '../core/base-client';
import {
  ColumnCreateRequest,
  ColumnUpdateRequest,
  ColumnRecord,
  ColumnQueryOptions,
  ColumnDeleteOptions,
  ColumnListResponse,
  ColumnUpdateOptions,
} from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';
import { ValidationError } from '../../errors/validation-error';
import { ApiError } from '../../errors/api-error';

export class ColumnResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, '/v1/tables');
  }

  /**
   * Add columns to an existing table
   */
  async create(
    tableName: string,
    data: ColumnCreateRequest
  ): Promise<ApiResponse<ColumnRecord[]>> {
    this.validateCreateRequest(data);

    // Get current database and table context
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
      const response = await this.makeRequest<ColumnRecord[]>(
        'POST',
        `/${tableId}/fields`,
        data
      );

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        throw new ValidationError('Column already exists', [
          {
            field: 'columns',
            message: 'One or more columns already exist in the table',
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
  ): Promise<ApiResponse<ColumnRecord[]> & { pagination?: any }> {
    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Add table_id to where clause
    const queryOptions = {
      ...options,
      where: {
        ...options.where,
        table_id: tableId,
      },
    };

    const cacheKey = this.generateCacheKey('findAll', {
      table: tableName,
      ...queryOptions,
    });

    const queryParams = this.buildQueryParams(queryOptions);
    // Use POST API for fetching fields, sending pagination and filters in the body (like Tables Listing)
    const response = await this.makeRequest<ColumnListResponse>(
      'POST',
      `/${tableId}/fields/list`,
      queryParams // send pagination/filtering in the body
    );

    // Transform response to match expected format
    const result = {
      data: response.data?.fields || [],
      pagination: response.data?.pagination,
      error: response.error,
    };

    return result;
  }

  /**
   * Find a single column
   */
  async findOne(
    tableName: string,
    options: ColumnQueryOptions
  ): Promise<ApiResponse<ColumnRecord | null>> {
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

    const queryOptions = { ...options, limit: 1 };
    queryOptions.where!.table_id = tableId;

    const queryParams = this.buildQueryParams(queryOptions);
    const response = await this.makeRequest<ColumnListResponse>(
      'GET',
      `/${tableId}/fields`,
      undefined,
      { params: queryParams }
    );

    const column = response.data?.fields?.[0] || null;
    const result = {
      data: column,
      error: response.error,
    };

    return result;
  }

  /**
   * Update a column
   */
  async update(
    tableName: string,
    options: ColumnUpdateOptions
  ): Promise<ApiResponse<ColumnRecord>> {
    this.validateUpdateRequest(options.set);

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError('Table not found', [
        {
          field: 'table',
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

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

    const response = await this.makeRequest<ColumnRecord>(
      'PUT',
      `/${tableId}/fields/${columnId}`,
      options.set
    );

    return response;
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

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>('DELETE', `/${tableId}/fields/${columnId}`);

    return response;
  }

  // Private helper methods
  private validateCreateRequest(data: ColumnCreateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (
      !data.columns ||
      !Array.isArray(data.columns) ||
      data.columns.length === 0
    ) {
      errors.push({
        field: 'columns',
        message: 'At least one column definition is required',
      });
    } else {
      this.validateColumnsArray(data.columns, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('Column creation validation failed', errors);
    }
  }

  private validateUpdateRequest(data: ColumnUpdateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Column name cannot be empty' });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
        errors.push({
          field: 'name',
          message:
            'Column name must start with a letter and contain only letters, numbers, and underscores',
        });
      }
    }

    if (data.description !== undefined && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters',
      });
    }

    // Validate type-specific properties
    this.validateTypeSpecificProperties(data, errors);

    if (errors.length > 0) {
      throw new ValidationError('Column update validation failed', errors);
    }
  }

  private validateColumnsArray(
    columns: FieldDefinition[],
    errors: Array<{ field: string; message: string }>
  ): void {
    const columnNames = new Set<string>();

    columns.forEach((column, index) => {
      const fieldPrefix = `columns[${index}]`;

      // Validate column name
      if (!column.name || column.name.trim().length === 0) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: 'Column name is required',
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message:
            'Column name must start with a letter and contain only letters, numbers, and underscores',
        });
      } else if (columnNames.has(column.name.toLowerCase())) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: `Duplicate column name: ${column.name}`,
        });
      } else {
        columnNames.add(column.name.toLowerCase());
      }

      // Validate column type
      if (!column.type) {
        errors.push({
          field: `${fieldPrefix}.type`,
          message: 'Column type is required',
        });
      } else {
        this.validateFieldType(column, fieldPrefix, errors);
      }

      // Validate field order
      if (
        column.field_order !== undefined &&
        (column.field_order < 1 || !Number.isInteger(column.field_order))
      ) {
        errors.push({
          field: `${fieldPrefix}.field_order`,
          message: 'Field order must be a positive integer',
        });
      }
    });
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

    // Type-specific validations using FIELD_SPECIFIC_KEYS_MAP
    const fieldTypeEnum = field.type
      .toUpperCase()
      .replace('-', '_') as keyof typeof FieldTypeEnum;
    const requiredKeys =
      FIELD_SPECIFIC_KEYS_MAP[FieldTypeEnum[fieldTypeEnum] as FieldTypeEnum] ||
      [];

    // Validate required properties for specific field types
    switch (field.type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!field.vector_dimension || field.vector_dimension <= 0) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: 'Vector fields require a positive vector_dimension',
          });
        }
        if (field.vector_dimension && field.vector_dimension > 10000) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: 'Vector dimension cannot exceed 10,000',
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
        if (field.decimals !== undefined) {
          const decimals = Number(field.decimals);
          if (isNaN(decimals) || decimals < 0 || decimals > 10) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message: 'Decimals must be a number between 0 and 10',
            });
          }
        }
        break;

      case 'number':
        if (field.decimals !== undefined) {
          const decimals = Number(field.decimals);
          if (isNaN(decimals) || decimals < 0 || decimals > 10) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message: 'Decimals must be a number between 0 and 10',
            });
          }
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
            message: 'Dropdown cannot have more than 100 options',
          });
        }
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

      case 'date-time':
        if (field.date_format && !/^[YMD\-\/\s]+$/.test(field.date_format)) {
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
    }
  }

  private validateTypeSpecificProperties(
    data: ColumnUpdateRequest,
    errors: Array<{ field: string; message: string }>
  ): void {
    if (data.decimals !== undefined) {
      const decimals = Number(data.decimals);
      if (isNaN(decimals) || decimals < 0 || decimals > 10) {
        errors.push({
          field: 'decimals',
          message: 'Decimals must be a number between 0 and 10',
        });
      }
    }

    if (data.currency_format && !/^[A-Z]{3}$/.test(data.currency_format)) {
      errors.push({
        field: 'currency_format',
        message: 'Currency format must be a 3-letter ISO code (e.g., USD)',
      });
    }

    if (data.selectable_items) {
      if (
        !Array.isArray(data.selectable_items) ||
        data.selectable_items.length === 0
      ) {
        errors.push({
          field: 'selectable_items',
          message: 'Selectable items must be a non-empty array',
        });
      } else if (data.selectable_items.length > 100) {
        errors.push({
          field: 'selectable_items',
          message: 'Cannot have more than 100 selectable items',
        });
      }
    }

    if (
      data.phone_format &&
      !['international', 'national', 'e164'].includes(data.phone_format)
    ) {
      errors.push({
        field: 'phone_format',
        message: 'Phone format must be one of: international, national, e164',
      });
    }

    if (
      data.alignment &&
      !['left', 'center', 'right'].includes(data.alignment)
    ) {
      errors.push({
        field: 'alignment',
        message: 'Alignment must be one of: left, center, right',
      });
    }
  }

  protected buildQueryParams(
    options: ColumnQueryOptions = {}
  ): Record<string, any> {
    const params: Record<string, any> = {};

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
```

### Task 3: Column Fluent Interface (Method 2)

**Duration**: 2-3 days
**Priority**: Critical

#### 3.1 Create Column Fluent Builder

Create `src/client/resources/column-builder.ts`:

```typescript
import { ColumnResource } from './column';
import {
  ColumnCreateRequest,
  ColumnUpdateRequest,
  ColumnRecord,
  ColumnQueryOptions,
  ColumnDeleteOptions,
  ColumnUpdateOptions,
} from '../../types/api/column';
import { ApiResponse } from '../core/base-resource';

export class ColumnBuilder {
  private columnResource: ColumnResource;
  private tableName: string;
  private queryOptions: ColumnQueryOptions = {};
  private updateData: ColumnUpdateRequest = {};

  constructor(columnResource: ColumnResource, tableName: string) {
    this.columnResource = columnResource;
    this.tableName = tableName;
  }

  /**
   * Add where conditions to the query
   */
  where(conditions: ColumnQueryOptions['where']): ColumnBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Specify fields to select
   */
  fields(fieldList: Array<keyof ColumnRecord>): ColumnBuilder {
    this.queryOptions.fields = fieldList;
    return this;
  }

  /**
   * Add sorting to the query
   */
  sort(
    sortOptions: Array<{ field: keyof ColumnRecord; order: 'asc' | 'desc' }>
  ): ColumnBuilder {
    this.queryOptions.sort = [
      ...(this.queryOptions.sort || []),
      ...sortOptions,
    ];
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): ColumnBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): ColumnBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set update data
   */
  set(data: ColumnUpdateRequest): ColumnBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute create operation
   */
  async create(
    data: ColumnCreateRequest
  ): Promise<ApiResponse<ColumnRecord[]>> {
    return this.columnResource.create(this.tableName, data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<ApiResponse<ColumnRecord[]> & { pagination?: any }> {
    return this.columnResource.findAll(this.tableName, this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<ColumnRecord | null>> {
    return this.columnResource.findOne(this.tableName, this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<ColumnRecord>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        'Update operation requires column name or ID in where clause'
      );
    }

    const updateOptions: ColumnUpdateOptions = {
      set: this.updateData,
      where: {
        name: this.queryOptions.where.name,
        id: this.queryOptions.where.id,
      },
    };

    return this.columnResource.update(this.tableName, updateOptions);
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        'Delete operation requires column name or ID in where clause'
      );
    }

    return this.columnResource.delete(this.tableName, {
      where: {
        name: this.queryOptions.where.name,
        id: this.queryOptions.where.id,
      },
    });
  }

  /**
   * Reset builder to initial state
   */
  reset(): ColumnBuilder {
    this.queryOptions = {};
    this.updateData = {};
    return this;
  }
}
```

### Task 4: Column Helper Utilities

**Duration**: 1-2 days
**Priority**: High

#### 4.1 Create Column Helper Functions

Create `src/utils/column/helpers.ts`:

````typescript
import { ColumnRecord, ColumnUpdateRequest } from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';

export class ColumnHelpers {
  /**
   * Convert FieldDefinition to ColumnUpdateRequest
   */
  static fieldToUpdateRequest(field: FieldDefinition): ColumnUpdateRequest {
    return {
      name: field.name,
      description: field.description,
      is_nullable: field.is_nullable,
      is_unique: field.is_unique,
      is_indexed: field.is_indexed,
      is_visible: field.is_visible,
      is_readonly: field.is_readonly,
      default_value: field.default_value,
      alignment: field.alignment,
      decimals: field.decimals,
      currency_format: field.currency_format,
      selectable_items: field.selectable_items,
      multiple_selections: field.multiple_selections,
      phone_format: field.phone_format,
      date_format: field.date_format,
      time_format: field.time_format,
      timezone: field.timezone,
      vector_dimension: field.vector_dimension,
    };
  }


  /**
   * Validate column properties for a specific field type
   */
  static validateColumnForType(
    column: Partial<ColumnRecord>,
    type: FieldType
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    switch (type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!column.vector_dimension || column.vector_dimension <= 0) {
          errors.push('Vector fields require a positive vector_dimension');
        }
        break;

      case 'currency':
        if (
          column.currency_format &&
          !/^[A-Z]{3}$/.test(column.currency_format)
        ) {
          errors.push('Currency format must be a 3-letter ISO code');
        }
        break;

      case 'dropdown':
        if (!column.selectable_items || column.selectable_items.length === 0) {
          errors.push('Dropdown fields require selectable_items');
        }
        break;

      case 'phone-number':
        if (
          column.phone_format &&
          !['international', 'national', 'e164'].includes(column.phone_format)
        ) {
          errors.push('Invalid phone format');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }






### Task 5: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 5.1 Update BolticClient for Column Operations

Update `src/client/boltic-client.ts` to add column operations:

```typescript
// Add imports at the top
import { ColumnResource } from './resources/column';
import { ColumnBuilder } from './resources/column-builder';

// Add to the BolticClient class:

export class BolticClient {
  // ... existing code ...

  private columnResource: ColumnResource;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // ... existing initialization code ...

    // Initialize column operations
    this.columnResource = new ColumnResource(this.baseClient);
  }

  // Method 1: Direct column operations
  get column() {
    return {
      create: (tableName: string, data: any) =>
        this.columnResource.create(tableName, data),
      findAll: (tableName: string, options?: any) =>
        this.columnResource.findAll(tableName, options),
      findOne: (tableName: string, options: any) =>
        this.columnResource.findOne(tableName, options),
      update: (tableName: string, options: any) =>
        this.columnResource.update(tableName, options),
      delete: (tableName: string, options: any) =>
        this.columnResource.delete(tableName, options),

    };
  }

  // Method 2: Fluent column operations with table context
  from(tableName: string) {
    return {
      column: () => new ColumnBuilder(this.columnResource, tableName),
      // This will be extended by Record Operations Agent
    };
  }

  // ... rest of existing code ...
}
````

### Task 6: Comprehensive Testing

**Duration**: 2-3 days
**Priority**: High

#### 6.1 Create Column Resource Tests

Create `tests/unit/client/resources/column.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ColumnResource } from '../../../../src/client/resources/column';
import { BaseClient } from '../../../../src/client/core/base-client';
import { ValidationError } from '../../../../src/errors/validation-error';
import { FieldDefinition } from '../../../../src/types/api/table';

vi.mock('../../../../src/client/core/base-client');

describe('ColumnResource', () => {
  let columnResource: ColumnResource;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      makeRequest: vi.fn(),
      getCache: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        generateKey: vi.fn((...parts) => parts.join(':')),
      })),
      table: {
        findOne: vi.fn().mockResolvedValue({
          data: { id: 'table-123', name: 'products' },
        }),
      },
    };

    columnResource = new ColumnResource(mockClient as BaseClient);
  });

  describe('create', () => {
    it('should create columns successfully', async () => {
      const columns: FieldDefinition[] = [
        {
          name: 'description',
          type: 'long-text',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 3,
        },
        {
          name: 'tags',
          type: 'json',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 4,
        },
      ];

      const createData = { columns };

      const expectedResponse = {
        data: [
          {
            id: 'col-1',
            name: 'description',
            type: 'long-text',
            table_id: 'table-123',
            table_name: 'products',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'col-2',
            name: 'tags',
            type: 'json',
            table_id: 'table-123',
            table_name: 'products',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await columnResource.create('products', createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        'POST',
        '/table-123/fields',
        createData
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should validate column definitions', async () => {
      const createData = {
        columns: [
          {
            name: '', // Empty name
            type: 'text' as const,
          },
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate vector field dimensions', async () => {
      const createData = {
        columns: [
          {
            name: 'embedding',
            type: 'vector' as const,
            // Missing vector_dimension
          },
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should detect duplicate column names', async () => {
      const createData = {
        columns: [
          { name: 'field1', type: 'text' as const },
          { name: 'field1', type: 'number' as const }, // Duplicate
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('findAll', () => {
    it('should retrieve columns for a table', async () => {
      const mockResponse = {
        data: {
          fields: [
            { id: 'col-1', name: 'title', type: 'text', table_id: 'table-123' },
            {
              id: 'col-2',
              name: 'price',
              type: 'currency',
              table_id: 'table-123',
            },
          ],
          pagination: { total: 2, page: 1, limit: 10, pages: 1 },
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findAll('products', {
        where: { is_visible: true },
        sort: [{ field: 'field_order', order: 'asc' }],
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a column by name', async () => {
      const updateData = {
        description: 'Updated description',
        is_indexed: true,
      };
      const expectedResponse = {
        data: {
          id: 'col-1',
          name: 'title',
          description: 'Updated description',
          is_indexed: true,
        },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            fields: [{ id: 'col-1', name: 'title', table_id: 'table-123' }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.update('products', {
        set: updateData,
        where: { name: 'title' },
      });

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('delete', () => {
    it('should delete a column by name', async () => {
      const expectedResponse = {
        data: { success: true, message: 'Column deleted successfully' },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            fields: [{ id: 'col-1', name: 'title', table_id: 'table-123' }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.delete('products', {
        where: { name: 'title' },
      });

      expect(result).toEqual(expectedResponse);
    });
  });
});
```

#### 6.2 Create Column Helpers Tests

Create `tests/unit/utils/column/helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ColumnHelpers } from '../../../../src/utils/column/helpers';
import { ColumnRecord } from '../../../../src/types/api/column';

  describe('validateColumnForType', () => {
    it('should validate vector field requirements', () => {
      const column = {
        name: 'embedding',
        type: 'vector' as const,
        vector_dimension: 1536,
      };

      const result = ColumnHelpers.validateColumnForType(column, 'vector');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing vector dimension', () => {
      const column = {
        name: 'embedding',
        type: 'vector' as const,
        // Missing vector_dimension
      };

      const result = ColumnHelpers.validateColumnForType(column, 'vector');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Vector fields require a positive vector_dimension'
      );
    });

    it('should validate dropdown selectable items', () => {
      const column = {
        name: 'category',
        type: 'dropdown' as const,
        selectable_items: ['option1', 'option2'],
      };

      const result = ColumnHelpers.validateColumnForType(column, 'dropdown');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateOptimalOrder', () => {
    it('should order columns by priority', () => {
      const columns: ColumnRecord[] = [
        {
          name: 'description',
          type: 'long-text',
          is_primary_key: false,
          field_order: 3,
        } as ColumnRecord,
        {
          name: 'id',
          type: 'text',
          is_primary_key: true,
          field_order: 1,
        } as ColumnRecord,
        {
          name: 'price',
          type: 'currency',
          is_primary_key: false,
          field_order: 2,
        } as ColumnRecord,
      ];

      const order = ColumnHelpers.generateOptimalOrder(columns);

      expect(order[0]).toBe('id'); // Primary key first
      expect(order.indexOf('price')).toBeLessThan(order.indexOf('description')); // Currency before long-text
    });
  });
});
```

### Task 7: Documentation and Examples

**Duration**: 1 day
**Priority**: Medium

#### 7.1 Create Column Operations Documentation

Create `docs/guides/column-operations.md`:

````markdown
# Column Operations

This guide covers all column/field management operations in the Boltic Tables SDK.

## Adding Columns to Tables

### Method 1: Direct API

```typescript
const { data: columns, error } = await db.column.create('products', {
  columns: [
    {
      name: 'discount_percentage',
      type: 'number',
      decimals: 2,
      default_value: 0,
      is_nullable: false,
    },
    {
      name: 'tags',
      type: 'json',
      description: 'Product tags array',
    },
  ],
});
```
````

### Method 2: Fluent Interface

```typescript
const { data: columns, error } = await db
  .from('products')
  .column()
  .create({
    columns: [
      SchemaHelpers.numberField('discount_percentage', {
        decimals: 2,
        default_value: 0,
        is_nullable: false,
      }),
      SchemaHelpers.jsonField('tags', {
        description: 'Product tags array',
      }),
    ],
  });
```

## Finding Columns

### Method 1: Direct API

```typescript
// Find all columns in a table
const { data: columns } = await db.column.findAll('products', {
  where: { is_visible: true },
  sort: [{ field: 'field_order', order: 'asc' }],
});

// Find specific column
const { data: column } = await db.column.findOne('products', {
  where: { name: 'discount_percentage' },
});
```

### Method 2: Fluent Interface

```typescript
// Find all visible columns
const { data: columns } = await db
  .from('products')
  .column()
  .where({ is_visible: true })
  .sort([{ field: 'field_order', order: 'asc' }])
  .findAll();

// Find specific column
const { data: column } = await db
  .from('products')
  .column()
  .where({ name: 'discount_percentage' })
  .findOne();
```

## Updating Columns

### Method 1: Direct API

```typescript
await db.column.update('products', {
  set: {
    description: 'Updated description',
    is_indexed: true,
    is_unique: true,
  },
  where: {
    name: 'discount_percentage',
  },
});
```

### Method 2: Fluent Interface

```typescript
await db
  .from('products')
  .column()
  .where({ name: 'discount_percentage' })
  .set({
    description: 'Updated description',
    is_indexed: true,
    is_unique: true,
  })
  .update();
```

## Column Management Operations

### Deleting Columns

```typescript
// Method 1
await db.column.delete('products', {
  where: { name: 'discount_percentage' },
});

// Method 2
await db
  .from('products')
  .column()
  .where({ name: 'discount_percentage' })
  .delete();
```

## Column Helper Utilities

### Type Conversion Safety

```typescript
import { ColumnHelpers } from '@boltic/database-js/utils';

// Validate column for specific type
const validation = ColumnHelpers.validateColumnForType(column, 'vector');
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## Error Handling

```typescript
try {
  const result = await db.column.create('products', {
    columns: [
      /* column definitions */
    ],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Column validation errors:', error.failures);
  } else if (error instanceof ApiError) {
    console.log('API error:', error.statusCode, error.message);
  }
}
```

## Best Practices

### Column Design

- Use meaningful, descriptive column names
- Choose appropriate field types for your data
- Add descriptions for complex columns
- Use indexes on frequently queried columns
- Set proper constraints (nullable, unique, etc.)

### Performance Optimization

- Avoid indexing columns that are rarely queried
- Use appropriate field types (don't use text for numbers)
- Consider vector field visibility for UI performance

### Type Safety

- Validate column properties before creation
- Check type conversion safety before updates
- Use schema helpers for consistent field definitions
- Leverage TypeScript types for compile-time safety

```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation
- [x] ColumnResource class with all CRUD operations
- [x] Both Method 1 (direct) and Method 2 (fluent) interfaces working
- [x] Integration with table context management

### ✅ Validation & Error Handling
- [x] Input validation for all column operations
- [x] Field type-specific validation rules
- [x] Type conversion safety checks
- [x] Comprehensive error handling for all scenarios

### ✅ Helper Utilities
- [x] Column helper functions for common operations
- [x] Type conversion validation utilities
- [x] Column analysis and improvement suggestions
- [x] Default value application utilities

### ✅ Integration
- [x] Seamless integration with BolticClient
- [x] Table context awareness for all operations
- [x] Database context support

### ✅ Type Safety
- [x] Complete TypeScript definitions for all operations
- [x] Generic type support for fluent interface
- [x] Type-safe validation and conversion utilities
- [x] IntelliSense support for all column operations

### ✅ Testing
- [x] Unit tests for ColumnResource methods
- [x] Validation and helper utility tests
- [x] Fluent interface functionality tests
- [x] Integration tests with table operations

### ✅ Documentation
- [x] API documentation with column examples
- [x] Helper utility usage guides
- [x] Best practices for column design
- [x] Performance optimization guidelines

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Full error messages, column definitions, and reproduction steps
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:
- **Record Operations Agent** (needs column schema awareness and table context)

## Critical Notes

- **ENSURE** both Method 1 and Method 2 APIs work identically
- **VALIDATE** all field type requirements thoroughly
- **HANDLE** type conversions safely with proper validation

Remember: Column operations directly affect the table schema and data integrity. Validation and safety are paramount for preventing data loss.
```
