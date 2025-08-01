# Column Operations Agent Instructions

## Agent Role and Responsibility

You are the **Column Operations Agent** responsible for implementing all column/field management operations for the Boltic Tables SDK. Your mission is to create comprehensive column CRUD functionality, support both direct and fluent API styles, handle field type modifications, and provide robust validation and caching for column operations.

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
import { FieldDefinition, FieldType } from "./table";

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
  alignment?: "left" | "center" | "right";
  decimals?: number | string;
  currency_format?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;
  date_format?: string;
  time_format?: string;
  timezone?: string;
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
  alignment?: "left" | "center" | "right";
  timezone?: string;
  date_format?: string;
  time_format?: string;
  decimals?: number | string;
  currency_format?: string;
  selection_source?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;
  button_type?: string;
  button_label?: string;
  button_additional_labels?: string[];
  button_state?: string;
  disable_on_click?: boolean;
  vector_dimension?: number;
}

export interface ColumnQueryOptions {
  where?: {
    id?: string;
    name?: string;
    table_id?: string;
    table_name?: string;
    type?: FieldType;
    is_nullable?: boolean;
    is_unique?: boolean;
    is_indexed?: boolean;
    is_visible?: boolean;
    is_readonly?: boolean;
    is_primary_key?: boolean;
  };
  fields?: Array<keyof ColumnRecord>;
  sort?: Array<{
    field: keyof ColumnRecord;
    order: "asc" | "desc";
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
  fields: ColumnRecord[];
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
import { BaseResource, ApiResponse } from "../core/base-resource";
import { BaseClient } from "../core/base-client";
import {
  ColumnCreateRequest,
  ColumnUpdateRequest,
  ColumnRecord,
  ColumnQueryOptions,
  ColumnDeleteOptions,
  ColumnListResponse,
  ColumnUpdateOptions,
} from "../../types/api/column";
import { FieldDefinition, FieldType } from "../../types/api/table";
import { ValidationError } from "../../errors/validation-error";
import { ApiError } from "../../errors/api-error";

export class ColumnResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, "/v1/tables");
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
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    try {
      const response = await this.makeRequest<ColumnRecord[]>(
        "POST",
        `/${tableId}/fields`,
        data
      );

      // Cache the created columns
      if (this.client.getCache && response.data) {
        const cache = this.client.getCache();
        if (cache) {
          for (const column of response.data) {
            await cache.set(
              cache.generateKey("column", "id", column.id),
              column,
              300000 // 5 minutes
            );
          }
          // Invalidate table cache to refresh schema
          await this.invalidateTableCache(tableId);
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        throw new ValidationError("Column already exists", [
          {
            field: "columns",
            message: "One or more columns already exist in the table",
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
      throw new ValidationError("Table not found", [
        {
          field: "table",
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

    const cacheKey = this.generateCacheKey("findAll", {
      table: tableName,
      ...queryOptions,
    });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<
          ApiResponse<ColumnRecord[]> & { pagination?: any }
        >(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const queryParams = this.buildQueryParams(queryOptions);
    const response = await this.makeRequest<ColumnListResponse>(
      "GET",
      `/${tableId}/fields`,
      undefined,
      { params: queryParams }
    );

    // Transform response to match expected format
    const result = {
      data: response.data?.fields || [],
      pagination: response.data?.pagination,
      error: response.error,
    };

    // Cache the result
    if (this.client.getCache && !result.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, result, 180000); // 3 minutes
      }
    }

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
        "findOne requires at least one where condition",
        [
          {
            field: "where",
            message: "Where clause is required for findOne operation",
          },
        ]
      );
    }

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    // Check cache first if querying by ID
    if (options.where.id && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cacheKey = cache.generateKey("column", "id", options.where.id);
        const cached = await cache.get<ColumnRecord>(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }
    }

    const queryOptions = { ...options, limit: 1 };
    queryOptions.where!.table_id = tableId;

    const queryParams = this.buildQueryParams(queryOptions);
    const response = await this.makeRequest<ColumnListResponse>(
      "GET",
      `/${tableId}/fields`,
      undefined,
      { params: queryParams }
    );

    const column = response.data?.fields?.[0] || null;
    const result = {
      data: column,
      error: response.error,
    };

    // Cache the result if found
    if (column && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(
          cache.generateKey("column", "id", column.id),
          column,
          300000 // 5 minutes
        );
      }
    }

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
      throw new ValidationError("Table not found", [
        {
          field: "table",
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
        throw new ValidationError("Column not found", [
          {
            field: "column",
            message: `Column '${options.where.name}' not found in table '${tableName}'`,
          },
        ]);
      }
      columnId = findResult.data.id;
    } else {
      throw new ValidationError("Column identifier required", [
        {
          field: "where",
          message: "Column ID or name is required for update operation",
        },
      ]);
    }

    const response = await this.makeRequest<ColumnRecord>(
      "PUT",
      `/${tableId}/fields/${columnId}`,
      options.set
    );

    // Invalidate cache
    if (this.client.getCache && response.data) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(cache.generateKey("column", "id", response.data.id));
        await this.invalidateTableCache(tableId);
        await this.invalidateListCaches(tableName);
      }
    }

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
      throw new ValidationError("Table not found", [
        {
          field: "table",
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
        throw new ValidationError("Column not found", [
          {
            field: "column",
            message: `Column '${options.where.name}' not found in table '${tableName}'`,
          },
        ]);
      }
      columnId = findResult.data.id;
    } else {
      throw new ValidationError("Column identifier required", [
        {
          field: "where",
          message: "Column ID or name is required for delete operation",
        },
      ]);
    }

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>("DELETE", `/${tableId}/fields/${columnId}`);

    // Invalidate cache
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(cache.generateKey("column", "id", columnId));
        await this.invalidateTableCache(tableId);
        await this.invalidateListCaches(tableName);
      }
    }

    return response;
  }

  /**
   * Reorder columns in a table
   */
  async reorder(
    tableName: string,
    columnOrder: string[]
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    if (!Array.isArray(columnOrder) || columnOrder.length === 0) {
      throw new ValidationError("Invalid column order", [
        {
          field: "columnOrder",
          message: "Column order must be a non-empty array of column names",
        },
      ]);
    }

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>("PATCH", `/${tableId}/fields/reorder`, { column_order: columnOrder });

    // Invalidate cache
    if (this.client.getCache) {
      await this.invalidateTableCache(tableId);
      await this.invalidateListCaches(tableName);
    }

    return response;
  }

  /**
   * Get column statistics and usage information
   */
  async getStats(
    tableName: string,
    columnName: string
  ): Promise<
    ApiResponse<{
      name: string;
      type: FieldType;
      null_count: number;
      unique_count: number;
      min_value?: any;
      max_value?: any;
      avg_value?: number;
      sample_values: any[];
    }>
  > {
    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const column = await this.findOne(tableName, {
      where: { name: columnName },
    });
    if (!column.data) {
      throw new ValidationError("Column not found", [
        {
          field: "column",
          message: `Column '${columnName}' not found in table '${tableName}'`,
        },
      ]);
    }

    const cacheKey = this.generateCacheKey("stats", {
      table: tableName,
      column: columnName,
    });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const response = await this.makeRequest(
      "GET",
      `/${tableId}/fields/${column.data.id}/stats`
    );

    // Cache stats for 5 minutes (can change frequently)
    if (this.client.getCache && !response.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, response, 300000);
      }
    }

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
        field: "columns",
        message: "At least one column definition is required",
      });
    } else {
      this.validateColumnsArray(data.columns, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError("Column creation validation failed", errors);
    }
  }

  private validateUpdateRequest(data: ColumnUpdateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: "name", message: "Column name cannot be empty" });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
        errors.push({
          field: "name",
          message:
            "Column name must start with a letter and contain only letters, numbers, and underscores",
        });
      }
    }

    if (data.description !== undefined && data.description.length > 500) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 500 characters",
      });
    }

    // Validate type-specific properties
    this.validateTypeSpecificProperties(data, errors);

    if (errors.length > 0) {
      throw new ValidationError("Column update validation failed", errors);
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
          message: "Column name is required",
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message:
            "Column name must start with a letter and contain only letters, numbers, and underscores",
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
          message: "Column type is required",
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
          message: "Field order must be a positive integer",
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
      "text",
      "long-text",
      "number",
      "currency",
      "checkbox",
      "dropdown",
      "email",
      "phone-number",
      "link",
      "json",
      "date-time",
      "vector",
      "halfvec",
      "sparsevec",
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
      case "vector":
      case "halfvec":
      case "sparsevec":
        if (!field.vector_dimension || field.vector_dimension <= 0) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: "Vector fields require a positive vector_dimension",
          });
        }
        if (field.vector_dimension && field.vector_dimension > 10000) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: "Vector dimension cannot exceed 10,000",
          });
        }
        break;

      case "currency":
        if (
          field.currency_format &&
          !/^[A-Z]{3}$/.test(field.currency_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.currency_format`,
            message: "Currency format must be a 3-letter ISO code (e.g., USD)",
          });
        }
        if (field.decimals !== undefined) {
          const decimals = Number(field.decimals);
          if (isNaN(decimals) || decimals < 0 || decimals > 10) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message: "Decimals must be a number between 0 and 10",
            });
          }
        }
        break;

      case "number":
        if (field.decimals !== undefined) {
          const decimals = Number(field.decimals);
          if (isNaN(decimals) || decimals < 0 || decimals > 10) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message: "Decimals must be a number between 0 and 10",
            });
          }
        }
        break;

      case "dropdown":
        if (
          !field.selectable_items ||
          !Array.isArray(field.selectable_items) ||
          field.selectable_items.length === 0
        ) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: "Dropdown fields require selectable_items array",
          });
        }
        if (field.selectable_items && field.selectable_items.length > 100) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: "Dropdown cannot have more than 100 options",
          });
        }
        break;

      case "phone-number":
        if (
          field.phone_format &&
          !["international", "national", "e164"].includes(field.phone_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.phone_format`,
            message:
              "Phone format must be one of: international, national, e164",
          });
        }
        break;

      case "date-time":
        if (field.date_format && !/^[YMD\-\/\s]+$/.test(field.date_format)) {
          errors.push({
            field: `${fieldPrefix}.date_format`,
            message: "Invalid date format pattern",
          });
        }
        if (field.time_format && !/^[Hms:\s]+$/.test(field.time_format)) {
          errors.push({
            field: `${fieldPrefix}.time_format`,
            message: "Invalid time format pattern",
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
          field: "decimals",
          message: "Decimals must be a number between 0 and 10",
        });
      }
    }

    if (data.currency_format && !/^[A-Z]{3}$/.test(data.currency_format)) {
      errors.push({
        field: "currency_format",
        message: "Currency format must be a 3-letter ISO code (e.g., USD)",
      });
    }

    if (data.selectable_items) {
      if (
        !Array.isArray(data.selectable_items) ||
        data.selectable_items.length === 0
      ) {
        errors.push({
          field: "selectable_items",
          message: "Selectable items must be a non-empty array",
        });
      } else if (data.selectable_items.length > 100) {
        errors.push({
          field: "selectable_items",
          message: "Cannot have more than 100 selectable items",
        });
      }
    }

    if (
      data.phone_format &&
      !["international", "national", "e164"].includes(data.phone_format)
    ) {
      errors.push({
        field: "phone_format",
        message: "Phone format must be one of: international, national, e164",
      });
    }

    if (
      data.alignment &&
      !["left", "center", "right"].includes(data.alignment)
    ) {
      errors.push({
        field: "alignment",
        message: "Alignment must be one of: left, center, right",
      });
    }
  }

  private async getTableId(tableName: string): Promise<string | null> {
    try {
      // Use the table resource to find the table
      const client = this.client as any;
      if (client.table) {
        const tableResult = await client.table.findOne({
          where: { name: tableName },
        });
        return tableResult.data?.id || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateCacheKey(operation: string, params?: any): string {
    if (!this.client.getCache) return "";
    const cache = this.client.getCache()!;
    const paramsStr = params ? JSON.stringify(params) : "";
    return cache.generateKey("column", operation, paramsStr);
  }

  private async invalidateTableCache(tableId: string): Promise<void> {
    if (!this.client.getCache) return;
    const cache = this.client.getCache()!;
    // Invalidate table metadata cache since schema changed
    await cache.delete(cache.generateKey("table", "id", tableId));
  }

  private async invalidateListCaches(tableName: string): Promise<void> {
    if (!this.client.getCache) return;
    const cache = this.client.getCache()!;
    // In a real implementation, you'd have more sophisticated cache invalidation
    await cache.clear(); // Simple approach
  }

  protected buildQueryParams(
    options: ColumnQueryOptions = {}
  ): Record<string, any> {
    const params: Record<string, any> = {};

    if (options.fields?.length) {
      params.fields = options.fields.join(",");
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(",");
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
import { ColumnResource } from "./column";
import {
  ColumnCreateRequest,
  ColumnUpdateRequest,
  ColumnRecord,
  ColumnQueryOptions,
  ColumnDeleteOptions,
  ColumnUpdateOptions,
} from "../../types/api/column";
import { ApiResponse } from "../core/base-resource";

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
  where(conditions: ColumnQueryOptions["where"]): ColumnBuilder {
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
    sortOptions: Array<{ field: keyof ColumnRecord; order: "asc" | "desc" }>
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
        "Update operation requires column name or ID in where clause"
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
        "Delete operation requires column name or ID in where clause"
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
   * Execute reorder operation
   */
  async reorder(
    columnOrder: string[]
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.columnResource.reorder(this.tableName, columnOrder);
  }

  /**
   * Get column statistics
   */
  async getStats(): Promise<ApiResponse<any>> {
    if (!this.queryOptions.where?.name) {
      throw new Error(
        "getStats operation requires column name in where clause"
      );
    }

    return this.columnResource.getStats(
      this.tableName,
      this.queryOptions.where.name
    );
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

```typescript
import { ColumnRecord, ColumnUpdateRequest } from "../../types/api/column";
import { FieldDefinition, FieldType } from "../../types/api/table";

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
    };
  }

  /**
   * Check if a column type can be changed to another type
   */
  static canChangeType(fromType: FieldType, toType: FieldType): boolean {
    // Define safe type conversions
    const safeConversions: Record<FieldType, FieldType[]> = {
      text: ["long-text", "email", "phone-number", "link"],
      "long-text": ["text"],
      number: ["currency", "text"],
      currency: ["number", "text"],
      checkbox: ["text"],
      dropdown: ["text"],
      email: ["text"],
      "phone-number": ["text"],
      link: ["text"],
      json: ["text", "long-text"],
      "date-time": ["text"],
      vector: ["text"],
      halfvec: ["vector", "text"],
      sparsevec: ["vector", "text"],
    };

    return safeConversions[fromType]?.includes(toType) || fromType === toType;
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
      case "vector":
      case "halfvec":
      case "sparsevec":
        if (!column.vector_dimension || column.vector_dimension <= 0) {
          errors.push("Vector fields require a positive vector_dimension");
        }
        break;

      case "currency":
        if (
          column.currency_format &&
          !/^[A-Z]{3}$/.test(column.currency_format)
        ) {
          errors.push("Currency format must be a 3-letter ISO code");
        }
        break;

      case "dropdown":
        if (!column.selectable_items || column.selectable_items.length === 0) {
          errors.push("Dropdown fields require selectable_items");
        }
        break;

      case "phone-number":
        if (
          column.phone_format &&
          !["international", "national", "e164"].includes(column.phone_format)
        ) {
          errors.push("Invalid phone format");
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generate column ordering based on field types and importance
   */
  static generateOptimalOrder(columns: ColumnRecord[]): string[] {
    // Define type priorities (lower number = higher priority)
    const typePriorities: Record<FieldType, number> = {
      text: 1,
      email: 2,
      "phone-number": 2,
      number: 3,
      currency: 3,
      "date-time": 4,
      checkbox: 5,
      dropdown: 5,
      link: 6,
      "long-text": 7,
      json: 8,
      vector: 9,
      halfvec: 9,
      sparsevec: 9,
    };

    return columns
      .sort((a, b) => {
        // Primary keys first
        if (a.is_primary_key && !b.is_primary_key) return -1;
        if (!a.is_primary_key && b.is_primary_key) return 1;

        // Then by type priority
        const aPriority = typePriorities[a.type] || 10;
        const bPriority = typePriorities[b.type] || 10;
        if (aPriority !== bPriority) return aPriority - bPriority;

        // Then by current field order
        if (a.field_order !== b.field_order)
          return a.field_order - b.field_order;

        // Finally by name
        return a.name.localeCompare(b.name);
      })
      .map((col) => col.name);
  }

  /**
   * Create a column summary for display
   */
  static summarizeColumn(column: ColumnRecord): {
    name: string;
    type: string;
    constraints: string[];
    properties: Record<string, any>;
  } {
    const constraints: string[] = [];
    const properties: Record<string, any> = {};

    // Build constraints list
    if (column.is_primary_key) constraints.push("PRIMARY KEY");
    if (column.is_unique) constraints.push("UNIQUE");
    if (column.is_indexed) constraints.push("INDEXED");
    if (!column.is_nullable) constraints.push("NOT NULL");
    if (column.is_readonly) constraints.push("READONLY");

    // Build properties object
    if (column.default_value !== undefined)
      properties.default = column.default_value;
    if (column.vector_dimension) properties.dimension = column.vector_dimension;
    if (column.currency_format) properties.currency = column.currency_format;
    if (column.decimals !== undefined) properties.decimals = column.decimals;
    if (column.selectable_items?.length)
      properties.options = column.selectable_items;
    if (column.phone_format) properties.phoneFormat = column.phone_format;
    if (column.date_format) properties.dateFormat = column.date_format;
    if (column.time_format) properties.timeFormat = column.time_format;

    return {
      name: column.name,
      type: column.type.toUpperCase(),
      constraints,
      properties,
    };
  }

  /**
   * Find columns that depend on this column (foreign keys, references, etc.)
   */
  static findDependentColumns(
    targetColumn: ColumnRecord,
    allColumns: ColumnRecord[]
  ): ColumnRecord[] {
    // This is a simplified implementation
    // In a real scenario, you'd check for foreign key relationships
    return allColumns.filter(
      (col) =>
        col.id !== targetColumn.id && col.name.includes(targetColumn.name) // Simple name-based dependency
    );
  }

  /**
   * Suggest column improvements based on usage patterns
   */
  static suggestImprovements(
    column: ColumnRecord,
    stats?: {
      null_count: number;
      unique_count: number;
      total_count: number;
    }
  ): string[] {
    const suggestions: string[] = [];

    if (stats) {
      // Suggest indexing for frequently queried columns
      if (!column.is_indexed && stats.unique_count > stats.total_count * 0.8) {
        suggestions.push("Consider adding an index - high uniqueness detected");
      }

      // Suggest making column not nullable if it never has null values
      if (
        column.is_nullable &&
        stats.null_count === 0 &&
        stats.total_count > 100
      ) {
        suggestions.push(
          "Consider making this column NOT NULL - no null values found"
        );
      }

      // Suggest unique constraint for highly unique columns
      if (
        !column.is_unique &&
        stats.unique_count === stats.total_count &&
        stats.total_count > 10
      ) {
        suggestions.push(
          "Consider adding UNIQUE constraint - all values are unique"
        );
      }
    }

    // Type-specific suggestions
    switch (column.type) {
      case "text":
        if (!column.is_indexed && column.name.toLowerCase().includes("email")) {
          suggestions.push(
            'Consider changing type to "email" for better validation'
          );
        }
        break;

      case "long-text":
        if (column.is_indexed) {
          suggestions.push(
            "Consider removing index from long-text field for better performance"
          );
        }
        break;

      case "vector":
        if (column.is_visible) {
          suggestions.push(
            "Consider hiding vector fields in UI for better user experience"
          );
        }
        break;
    }

    return suggestions;
  }
}
```

### Task 5: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 5.1 Update BolticClient for Column Operations

Update `src/client/boltic-client.ts` to add column operations:

```typescript
// Add imports at the top
import { ColumnResource } from "./resources/column";
import { ColumnBuilder } from "./resources/column-builder";

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
      reorder: (tableName: string, order: string[]) =>
        this.columnResource.reorder(tableName, order),
      getStats: (tableName: string, columnName: string) =>
        this.columnResource.getStats(tableName, columnName),
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
```

### Task 6: Comprehensive Testing

**Duration**: 2-3 days
**Priority**: High

#### 6.1 Create Column Resource Tests

Create `tests/unit/client/resources/column.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ColumnResource } from "../../../../src/client/resources/column";
import { BaseClient } from "../../../../src/client/core/base-client";
import { ValidationError } from "../../../../src/errors/validation-error";
import { FieldDefinition } from "../../../../src/types/api/table";

vi.mock("../../../../src/client/core/base-client");

describe("ColumnResource", () => {
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
        generateKey: vi.fn((...parts) => parts.join(":")),
      })),
      table: {
        findOne: vi.fn().mockResolvedValue({
          data: { id: "table-123", name: "products" },
        }),
      },
    };

    columnResource = new ColumnResource(mockClient as BaseClient);
  });

  describe("create", () => {
    it("should create columns successfully", async () => {
      const columns: FieldDefinition[] = [
        {
          name: "description",
          type: "long-text",
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 3,
        },
        {
          name: "tags",
          type: "json",
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
            id: "col-1",
            name: "description",
            type: "long-text",
            table_id: "table-123",
            table_name: "products",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "col-2",
            name: "tags",
            type: "json",
            table_id: "table-123",
            table_name: "products",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await columnResource.create("products", createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "POST",
        "/table-123/fields",
        createData
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should validate column definitions", async () => {
      const createData = {
        columns: [
          {
            name: "", // Empty name
            type: "text" as const,
          },
        ],
      };

      await expect(
        columnResource.create("products", createData)
      ).rejects.toThrow(ValidationError);
    });

    it("should validate vector field dimensions", async () => {
      const createData = {
        columns: [
          {
            name: "embedding",
            type: "vector" as const,
            // Missing vector_dimension
          },
        ],
      };

      await expect(
        columnResource.create("products", createData)
      ).rejects.toThrow(ValidationError);
    });

    it("should detect duplicate column names", async () => {
      const createData = {
        columns: [
          { name: "field1", type: "text" as const },
          { name: "field1", type: "number" as const }, // Duplicate
        ],
      };

      await expect(
        columnResource.create("products", createData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("findAll", () => {
    it("should retrieve columns for a table", async () => {
      const mockResponse = {
        data: {
          fields: [
            { id: "col-1", name: "title", type: "text", table_id: "table-123" },
            {
              id: "col-2",
              name: "price",
              type: "currency",
              table_id: "table-123",
            },
          ],
          pagination: { total: 2, page: 1, limit: 10, pages: 1 },
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findAll("products", {
        where: { is_visible: true },
        sort: [{ field: "field_order", order: "asc" }],
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a column by name", async () => {
      const updateData = {
        description: "Updated description",
        is_indexed: true,
      };
      const expectedResponse = {
        data: {
          id: "col-1",
          name: "title",
          description: "Updated description",
          is_indexed: true,
        },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            fields: [{ id: "col-1", name: "title", table_id: "table-123" }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.update("products", {
        set: updateData,
        where: { name: "title" },
      });

      expect(result).toEqual(expectedResponse);
    });
  });

  describe("delete", () => {
    it("should delete a column by name", async () => {
      const expectedResponse = {
        data: { success: true, message: "Column deleted successfully" },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            fields: [{ id: "col-1", name: "title", table_id: "table-123" }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.delete("products", {
        where: { name: "title" },
      });

      expect(result).toEqual(expectedResponse);
    });
  });
});
```

#### 6.2 Create Column Helpers Tests

Create `tests/unit/utils/column/helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ColumnHelpers } from "../../../../src/utils/column/helpers";
import { ColumnRecord } from "../../../../src/types/api/column";

describe("ColumnHelpers", () => {
  describe("canChangeType", () => {
    it("should allow safe type conversions", () => {
      expect(ColumnHelpers.canChangeType("text", "email")).toBe(true);
      expect(ColumnHelpers.canChangeType("number", "currency")).toBe(true);
      expect(ColumnHelpers.canChangeType("vector", "text")).toBe(true);
    });

    it("should prevent unsafe type conversions", () => {
      expect(ColumnHelpers.canChangeType("email", "vector")).toBe(false);
      expect(ColumnHelpers.canChangeType("json", "number")).toBe(false);
      expect(ColumnHelpers.canChangeType("currency", "checkbox")).toBe(false);
    });

    it("should allow same type", () => {
      expect(ColumnHelpers.canChangeType("text", "text")).toBe(true);
      expect(ColumnHelpers.canChangeType("vector", "vector")).toBe(true);
    });
  });

  describe("validateColumnForType", () => {
    it("should validate vector field requirements", () => {
      const column = {
        name: "embedding",
        type: "vector" as const,
        vector_dimension: 1536,
      };

      const result = ColumnHelpers.validateColumnForType(column, "vector");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing vector dimension", () => {
      const column = {
        name: "embedding",
        type: "vector" as const,
        // Missing vector_dimension
      };

      const result = ColumnHelpers.validateColumnForType(column, "vector");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Vector fields require a positive vector_dimension"
      );
    });

    it("should validate dropdown selectable items", () => {
      const column = {
        name: "category",
        type: "dropdown" as const,
        selectable_items: ["option1", "option2"],
      };

      const result = ColumnHelpers.validateColumnForType(column, "dropdown");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("generateOptimalOrder", () => {
    it("should order columns by priority", () => {
      const columns: ColumnRecord[] = [
        {
          name: "description",
          type: "long-text",
          is_primary_key: false,
          field_order: 3,
        } as ColumnRecord,
        {
          name: "id",
          type: "text",
          is_primary_key: true,
          field_order: 1,
        } as ColumnRecord,
        {
          name: "price",
          type: "currency",
          is_primary_key: false,
          field_order: 2,
        } as ColumnRecord,
      ];

      const order = ColumnHelpers.generateOptimalOrder(columns);

      expect(order[0]).toBe("id"); // Primary key first
      expect(order.indexOf("price")).toBeLessThan(order.indexOf("description")); // Currency before long-text
    });
  });

  describe("summarizeColumn", () => {
    it("should create a comprehensive column summary", () => {
      const column: ColumnRecord = {
        id: "col-1",
        name: "price",
        type: "currency",
        is_primary_key: false,
        is_unique: false,
        is_indexed: true,
        is_nullable: false,
        is_visible: true,
        is_readonly: false,
        currency_format: "USD",
        decimals: 2,
        field_order: 1,
        table_id: "table-1",
        table_name: "products",
        original_name: "price",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const summary = ColumnHelpers.summarizeColumn(column);

      expect(summary.name).toBe("price");
      expect(summary.type).toBe("CURRENCY");
      expect(summary.constraints).toContain("INDEXED");
      expect(summary.constraints).toContain("NOT NULL");
      expect(summary.properties.currency).toBe("USD");
      expect(summary.properties.decimals).toBe(2);
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
const { data: columns, error } = await db.column.create("products", {
  columns: [
    {
      name: "discount_percentage",
      type: "number",
      decimals: 2,
      default_value: 0,
      is_nullable: false,
    },
    {
      name: "tags",
      type: "json",
      description: "Product tags array",
    },
  ],
});
```
````

### Method 2: Fluent Interface

```typescript
const { data: columns, error } = await db
  .from("products")
  .column()
  .create({
    columns: [
      SchemaHelpers.numberField("discount_percentage", {
        decimals: 2,
        default_value: 0,
        is_nullable: false,
      }),
      SchemaHelpers.jsonField("tags", {
        description: "Product tags array",
      }),
    ],
  });
```

## Finding Columns

### Method 1: Direct API

```typescript
// Find all columns in a table
const { data: columns } = await db.column.findAll("products", {
  where: { is_visible: true },
  sort: [{ field: "field_order", order: "asc" }],
});

// Find specific column
const { data: column } = await db.column.findOne("products", {
  where: { name: "discount_percentage" },
});
```

### Method 2: Fluent Interface

```typescript
// Find all visible columns
const { data: columns } = await db
  .from("products")
  .column()
  .where({ is_visible: true })
  .sort([{ field: "field_order", order: "asc" }])
  .findAll();

// Find specific column
const { data: column } = await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .findOne();
```

## Updating Columns

### Method 1: Direct API

```typescript
await db.column.update("products", {
  set: {
    description: "Updated description",
    is_indexed: true,
    is_unique: true,
  },
  where: {
    name: "discount_percentage",
  },
});
```

### Method 2: Fluent Interface

```typescript
await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .set({
    description: "Updated description",
    is_indexed: true,
    is_unique: true,
  })
  .update();
```

## Column Management Operations

### Reordering Columns

```typescript
// Method 1
await db.column.reorder("products", [
  "id",
  "title",
  "price",
  "discount_percentage",
  "description",
]);

// Method 2
await db
  .from("products")
  .column()
  .reorder(["id", "title", "price", "discount_percentage", "description"]);
```

### Deleting Columns

```typescript
// Method 1
await db.column.delete("products", {
  where: { name: "discount_percentage" },
});

// Method 2
await db
  .from("products")
  .column()
  .where({ name: "discount_percentage" })
  .delete();
```

### Column Statistics

```typescript
// Method 1
const { data: stats } = await db.column.getStats("products", "price");

// Method 2
const { data: stats } = await db
  .from("products")
  .column()
  .where({ name: "price" })
  .getStats();

console.log(stats);
// {
//   name: "price",
//   type: "currency",
//   null_count: 0,
//   unique_count: 150,
//   min_value: 9.99,
//   max_value: 2499.99,
//   avg_value: 299.99,
//   sample_values: [9.99, 19.99, 49.99, ...]
// }
```

## Column Helper Utilities

### Type Conversion Safety

```typescript
import { ColumnHelpers } from "@boltic/database-js/utils";

// Check if type conversion is safe
const canConvert = ColumnHelpers.canChangeType("text", "email");
console.log(canConvert); // true

// Validate column for specific type
const validation = ColumnHelpers.validateColumnForType(column, "vector");
if (!validation.isValid) {
  console.log("Validation errors:", validation.errors);
}
```

### Optimal Column Ordering

```typescript
// Generate optimal column order
const optimalOrder = ColumnHelpers.generateOptimalOrder(columns);
await db.column.reorder("products", optimalOrder);
```

### Column Analysis

```typescript
// Get column summary
const summary = ColumnHelpers.summarizeColumn(column);
console.log(summary);
// {
//   name: "price",
//   type: "CURRENCY",
//   constraints: ["INDEXED", "NOT NULL"],
//   properties: { currency: "USD", decimals: 2 }
// }

// Get improvement suggestions
const suggestions = ColumnHelpers.suggestImprovements(column, stats);
console.log(suggestions);
// ["Consider adding an index - high uniqueness detected"]
```

## Error Handling

```typescript
try {
  const result = await db.column.create("products", {
    columns: [
      /* column definitions */
    ],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Column validation errors:", error.failures);
  } else if (error instanceof ApiError) {
    console.log("API error:", error.statusCode, error.message);
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
- Reorder columns logically for better user experience

### Type Safety

- Validate column properties before creation
- Check type conversion safety before updates
- Use schema helpers for consistent field definitions
- Leverage TypeScript types for compile-time safety

```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation
- [ ] ColumnResource class with all CRUD operations
- [ ] Both Method 1 (direct) and Method 2 (fluent) interfaces working
- [ ] Column reordering and statistics functionality
- [ ] Integration with table context management

### ✅ Validation & Error Handling
- [ ] Input validation for all column operations
- [ ] Field type-specific validation rules
- [ ] Type conversion safety checks
- [ ] Comprehensive error handling for all scenarios

### ✅ Helper Utilities
- [ ] Column helper functions for common operations
- [ ] Type conversion validation utilities
- [ ] Column analysis and improvement suggestions
- [ ] Optimal ordering algorithms

### ✅ Integration
- [ ] Seamless integration with BolticClient
- [ ] Table context awareness for all operations
- [ ] Cache integration with proper invalidation
- [ ] Database context support

### ✅ Type Safety
- [ ] Complete TypeScript definitions for all operations
- [ ] Generic type support for fluent interface
- [ ] Type-safe validation and conversion utilities
- [ ] IntelliSense support for all column operations

### ✅ Testing
- [ ] Unit tests for ColumnResource methods
- [ ] Validation and helper utility tests
- [ ] Fluent interface functionality tests
- [ ] Integration tests with table operations

### ✅ Documentation
- [ ] API documentation with column examples
- [ ] Helper utility usage guides
- [ ] Best practices for column design
- [ ] Performance optimization guidelines

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
- **TEST** column reordering and statistics functionality
- **CACHE** column metadata efficiently with table context
- **HANDLE** type conversions safely with proper validation

Remember: Column operations directly affect the table schema and data integrity. Validation and safety are paramount for preventing data loss.
```
