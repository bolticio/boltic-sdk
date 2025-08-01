# Table Operations Agent Instructions

## Agent Role and Responsibility

You are the **Table Operations Agent** responsible for implementing all table management operations for the Boltic Tables SDK. Your mission is to create comprehensive table CRUD functionality, support both direct and fluent API styles, handle complex schema definitions, and provide robust error handling and caching for table operations.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Database Operations Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for table operation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known table operation issues

## Dependencies

This agent depends on the **Database Operations Agent** completion. Verify these exist:

- Database context management and selection
- BaseResource class and operation interfaces
- BolticClient with database operations
- Authentication and error handling systems
- Cache infrastructure and TypeScript definitions

## Primary Tasks

### Task 1: Table Type Definitions

**Duration**: 1-2 days
**Priority**: Critical

#### 1.1 Create Field Definition Types

Create `src/types/api/table.ts`:

```typescript
export type FieldType =
  | "text"
  | "long-text"
  | "number"
  | "currency"
  | "checkbox"
  | "dropdown"
  | "email"
  | "phone-number"
  | "link"
  | "json"
  | "date-time"
  | "vector"
  | "halfvec"
  | "sparsevec";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_visible?: boolean;
  is_readonly?: boolean;
  is_indexed?: boolean;
  field_order?: number;
  description?: string;
  default_value?: any;

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

export interface TableCreateRequest {
  table_name: string;
  schema: FieldDefinition[];
  description?: string;
  is_public?: boolean;
}

export interface TableUpdateRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  is_active?: boolean;
}

export interface TableRecord {
  id: string;
  name: string;
  table_name: string; // Display name
  internal_name: string; // Actual database table name
  database_id: string;
  description?: string;
  is_public: boolean;
  is_active: boolean;
  record_count: number;
  field_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_record_added?: string;
  size_mb?: number;
  schema: FieldDefinition[];
}

export interface TableQueryOptions {
  where?: {
    id?: string;
    name?: string;
    database_id?: string;
    is_public?: boolean;
    is_active?: boolean;
    created_by?: string;
    created_at?: {
      $gte?: string;
      $lte?: string;
      $between?: [string, string];
    };
    record_count?: {
      $gt?: number;
      $lt?: number;
      $gte?: number;
      $lte?: number;
    };
  };
  fields?: Array<keyof TableRecord>;
  sort?: Array<{
    field: keyof TableRecord;
    order: "asc" | "desc";
  }>;
  limit?: number;
  offset?: number;
}

export interface TableDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

export interface TableListResponse {
  tables: TableRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TableAccessRequest {
  table_name: string;
  is_public: boolean;
}
```

### Task 2: Table Resource Implementation (Method 1)

**Duration**: 3-4 days
**Priority**: Critical

#### 2.1 Create Table Resource Class

Create `src/client/resources/table.ts`:

```typescript
import { BaseResource, ApiResponse } from "../core/base-resource";
import { BaseClient } from "../core/base-client";
import {
  TableCreateRequest,
  TableUpdateRequest,
  TableRecord,
  TableQueryOptions,
  TableDeleteOptions,
  TableListResponse,
  TableAccessRequest,
  FieldDefinition,
  FieldType,
} from "../../types/api/table";
import { ValidationError } from "../../errors/validation-error";
import { ApiError } from "../../errors/api-error";

export class TableResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, "/v1/tables");
  }

  /**
   * Create a new table with schema
   */
  async create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>> {
    this.validateCreateRequest(data);

    // Get current database context
    const databaseId = this.getCurrentDatabaseId();
    if (!databaseId) {
      throw new ValidationError(
        "No database selected. Use useDatabase() first.",
        [
          {
            field: "database",
            message: "Database context is required for table operations",
          },
        ]
      );
    }

    const requestData = {
      ...data,
      database_id: databaseId,
    };

    try {
      const response = await this.makeRequest<TableRecord>(
        "POST",
        "",
        requestData
      );

      // Cache the created table
      if (this.client.getCache && response.data) {
        const cache = this.client.getCache();
        if (cache) {
          await cache.set(
            cache.generateKey("table", "id", response.data.id),
            response.data,
            300000 // 5 minutes
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        throw new ValidationError("Table already exists", [
          {
            field: "table_name",
            message: "A table with this name already exists in the database",
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
  ): Promise<ApiResponse<TableRecord[]> & { pagination?: any }> {
    // Auto-add current database filter if not specified
    const databaseId = this.getCurrentDatabaseId();
    if (databaseId && !options.where?.database_id) {
      options = {
        ...options,
        where: {
          ...options.where,
          database_id: databaseId,
        },
      };
    }

    const cacheKey = this.generateCacheKey("findAll", options);

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<
          ApiResponse<TableRecord[]> & { pagination?: any }
        >(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const queryParams = this.buildQueryParams(options);
    const response = await this.makeRequest<TableListResponse>(
      "GET",
      "",
      undefined,
      { params: queryParams }
    );

    // Transform response to match expected format
    const result = {
      data: response.data?.tables || [],
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
   * Find a single table
   */
  async findOne(
    options: TableQueryOptions
  ): Promise<ApiResponse<TableRecord | null>> {
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

    // Auto-add current database filter if not specified
    const databaseId = this.getCurrentDatabaseId();
    if (databaseId && !options.where.database_id) {
      options.where.database_id = databaseId;
    }

    // Check cache first if querying by ID
    if (options.where.id && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cacheKey = cache.generateKey("table", "id", options.where.id);
        const cached = await cache.get<TableRecord>(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }
    }

    const queryParams = this.buildQueryParams({ ...options, limit: 1 });
    const response = await this.makeRequest<TableListResponse>(
      "GET",
      "",
      undefined,
      { params: queryParams }
    );

    const table = response.data?.tables?.[0] || null;
    const result = {
      data: table,
      error: response.error,
    };

    // Cache the result if found
    if (table && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(
          cache.generateKey("table", "id", table.id),
          table,
          300000 // 5 minutes
        );
      }
    }

    return result;
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

    if (typeof identifier === "string") {
      // Update by table name
      updateData = data!;

      // Find table by name to get ID
      const findResult = await this.findOne({ where: { name: identifier } });
      if (!findResult.data) {
        throw new ValidationError("Table not found", [
          { field: "identifier", message: `Table '${identifier}' not found` },
        ]);
      }
      tableId = findResult.data.id;
    } else {
      throw new ValidationError(
        "Table updates must specify a table name or ID",
        [
          {
            field: "identifier",
            message: "Table identifier is required for updates",
          },
        ]
      );
    }

    this.validateUpdateRequest(updateData);

    const response = await this.makeRequest<TableRecord>(
      "PUT",
      `/${tableId}`,
      updateData
    );

    // Invalidate cache
    if (this.client.getCache && response.data) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(cache.generateKey("table", "id", response.data.id));
        await this.invalidateListCaches();
      }
    }

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
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>("PATCH", "/access", accessData);

    // Invalidate cache for the affected table
    if (this.client.getCache) {
      await this.invalidateListCaches();
    }

    return response;
  }

  /**
   * Delete a table
   */
  async delete(
    options: TableDeleteOptions | string
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    let whereClause: any;
    let tableId: string | undefined;

    if (typeof options === "string") {
      // Delete by table name
      const findResult = await this.findOne({ where: { name: options } });
      if (!findResult.data) {
        throw new ValidationError("Table not found", [
          { field: "table", message: `Table '${options}' not found` },
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
      throw new ValidationError("Table not found for deletion", [
        { field: "identifier", message: "Could not resolve table identifier" },
      ]);
    }

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>("DELETE", `/${tableId}`);

    // Invalidate cache
    if (this.client.getCache && tableId) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(cache.generateKey("table", "id", tableId));
        await this.invalidateListCaches();
      }
    }

    return response;
  }

  /**
   * Get table metadata including schema
   */
  async getMetadata(tableName: string): Promise<ApiResponse<TableRecord>> {
    const cacheKey = this.generateCacheKey("metadata", { name: tableName });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<ApiResponse<TableRecord>>(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const response = await this.findOne({
      where: { name: tableName },
      fields: [
        "id",
        "name",
        "description",
        "is_public",
        "record_count",
        "schema",
        "created_at",
        "updated_at",
      ],
    });

    if (!response.data) {
      throw new ValidationError("Table not found", [
        { field: "table_name", message: `Table '${tableName}' not found` },
      ]);
    }

    const result = {
      data: response.data,
      error: response.error,
    };

    // Cache metadata for 5 minutes
    if (this.client.getCache && !result.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, result, 300000);
      }
    }

    return result;
  }

  /**
   * Get table statistics
   */
  async getStats(tableName: string): Promise<
    ApiResponse<{
      record_count: number;
      field_count: number;
      size_mb: number;
      last_updated: string;
      last_record_added?: string;
    }>
  > {
    const table = await this.findOne({ where: { name: tableName } });
    if (!table.data) {
      throw new ValidationError("Table not found", [
        { field: "table_name", message: `Table '${tableName}' not found` },
      ]);
    }

    const cacheKey = this.generateCacheKey("stats", { id: table.data.id });

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

    const response = await this.makeRequest("GET", `/${table.data.id}/stats`);

    // Cache stats for 1 minute (frequently changing data)
    if (this.client.getCache && !response.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, response, 60000);
      }
    }

    return response;
  }

  // Private helper methods
  private validateCreateRequest(data: TableCreateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.table_name || data.table_name.trim().length === 0) {
      errors.push({ field: "table_name", message: "Table name is required" });
    } else {
      this.validateTableName(data.table_name);
    }

    if (
      !data.schema ||
      !Array.isArray(data.schema) ||
      data.schema.length === 0
    ) {
      errors.push({
        field: "schema",
        message: "Table schema is required and must contain at least one field",
      });
    } else {
      this.validateSchema(data.schema);
    }

    if (data.description && data.description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 1000 characters",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Table creation validation failed", errors);
    }
  }

  private validateUpdateRequest(data: TableUpdateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: "name", message: "Table name cannot be empty" });
      } else {
        this.validateTableName(data.name);
      }
    }

    if (data.description !== undefined && data.description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 1000 characters",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Table update validation failed", errors);
    }
  }

  private validateTableName(name: string): void {
    // Table name validation rules
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
      throw new ValidationError("Invalid table name", [
        {
          field: "table_name",
          message:
            "Table name must start with a letter and contain only letters, numbers, hyphens, and underscores",
        },
      ]);
    }

    if (name.length > 100) {
      throw new ValidationError("Table name too long", [
        {
          field: "table_name",
          message: "Table name cannot exceed 100 characters",
        },
      ]);
    }

    // Reserved words check
    const reservedWords = [
      "table",
      "index",
      "view",
      "database",
      "schema",
      "select",
      "insert",
      "update",
      "delete",
    ];
    if (reservedWords.includes(name.toLowerCase())) {
      throw new ValidationError("Reserved table name", [
        {
          field: "table_name",
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
          message: "Field name is required",
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message:
            "Field name must start with a letter and contain only letters, numbers, and underscores",
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
          message: "Field type is required",
        });
      } else {
        this.validateFieldType(field, fieldPrefix, errors);
      }
    });

    if (errors.length > 0) {
      throw new ValidationError("Schema validation failed", errors);
    }
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
        break;

      case "email":
        // Email fields don't need additional validation
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
    }
  }

  private getCurrentDatabaseId(): string | null {
    // Get database context from client
    const client = this.client as any; // Type assertion for accessing private client methods
    if (client.getDatabaseContext) {
      const context = client.getDatabaseContext();
      return context?.getDatabaseId() || null;
    }
    return null;
  }

  private generateCacheKey(operation: string, params?: any): string {
    if (!this.client.getCache) return "";
    const cache = this.client.getCache()!;
    const databaseId = this.getCurrentDatabaseId();
    const paramsStr = params ? JSON.stringify(params) : "";
    return cache.generateKey(
      "table",
      databaseId || "no-db",
      operation,
      paramsStr
    );
  }

  private async invalidateListCaches(): Promise<void> {
    if (!this.client.getCache) return;
    const cache = this.client.getCache()!;
    // In a real implementation, you'd have a more sophisticated cache invalidation strategy
    await cache.clear(); // Simple approach - in production, use more targeted invalidation
  }

  protected buildQueryParams(
    options: TableQueryOptions = {}
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
          if (typeof value === "object" && !Array.isArray(value)) {
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
```

### Task 3: Table Fluent Interface (Method 2)

**Duration**: 2-3 days
**Priority**: Critical

#### 3.1 Create Table Fluent Builder

Create `src/client/resources/table-builder.ts`:

```typescript
import { TableResource } from "./table";
import {
  TableCreateRequest,
  TableUpdateRequest,
  TableRecord,
  TableQueryOptions,
  TableDeleteOptions,
  TableAccessRequest,
} from "../../types/api/table";
import { ApiResponse } from "../core/base-resource";

export class TableBuilder {
  private tableResource: TableResource;
  private queryOptions: TableQueryOptions = {};
  private updateData: TableUpdateRequest = {};

  constructor(tableResource: TableResource) {
    this.tableResource = tableResource;
  }

  /**
   * Add where conditions to the query
   */
  where(conditions: TableQueryOptions["where"]): TableBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Specify fields to select
   */
  fields(fieldList: Array<keyof TableRecord>): TableBuilder {
    this.queryOptions.fields = fieldList;
    return this;
  }

  /**
   * Add sorting to the query
   */
  sort(
    sortOptions: Array<{ field: keyof TableRecord; order: "asc" | "desc" }>
  ): TableBuilder {
    this.queryOptions.sort = [
      ...(this.queryOptions.sort || []),
      ...sortOptions,
    ];
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): TableBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): TableBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set update data
   */
  set(data: TableUpdateRequest): TableBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute create operation
   */
  async create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>> {
    return this.tableResource.create(data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<ApiResponse<TableRecord[]> & { pagination?: any }> {
    return this.tableResource.findAll(this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<TableRecord | null>> {
    return this.tableResource.findOne(this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<TableRecord>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        "Update operation requires table name or ID in where clause"
      );
    }

    const identifier =
      this.queryOptions.where.name || this.queryOptions.where.id!;
    return this.tableResource.update(identifier, this.updateData);
  }

  /**
   * Execute rename operation
   */
  async rename(): Promise<ApiResponse<TableRecord>> {
    if (!this.queryOptions.where?.name) {
      throw new Error("Rename operation requires table name in where clause");
    }

    if (!this.updateData.name) {
      throw new Error("Rename operation requires new name in set data");
    }

    return this.tableResource.rename(
      this.queryOptions.where.name,
      this.updateData.name
    );
  }

  /**
   * Execute setAccess operation
   */
  async setAccess(): Promise<
    ApiResponse<{ success: boolean; message?: string }>
  > {
    if (!this.queryOptions.where?.name) {
      throw new Error(
        "setAccess operation requires table name in where clause"
      );
    }

    if (this.updateData.is_public === undefined) {
      throw new Error("setAccess operation requires is_public in set data");
    }

    return this.tableResource.setAccess({
      table_name: this.queryOptions.where.name,
      is_public: this.updateData.is_public,
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        "Delete operation requires table name or ID in where clause"
      );
    }

    return this.tableResource.delete({
      where: {
        name: this.queryOptions.where.name,
        id: this.queryOptions.where.id,
      },
    });
  }

  /**
   * Reset builder to initial state
   */
  reset(): TableBuilder {
    this.queryOptions = {};
    this.updateData = {};
    return this;
  }
}
```

### Task 4: Schema Helper Utilities

**Duration**: 1-2 days
**Priority**: High

#### 4.1 Create Schema Helper Functions

Create `src/utils/table/schema-helpers.ts`:

```typescript
import { FieldDefinition, FieldType } from "../../types/api/table";

export class SchemaHelpers {
  /**
   * Create a text field definition
   */
  static textField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "text",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a number field definition
   */
  static numberField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "number",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      decimals: 2,
      ...options,
    };
  }

  /**
   * Create a currency field definition
   */
  static currencyField(
    name: string,
    currency: string = "USD",
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "currency",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      decimals: 2,
      currency_format: currency,
      ...options,
    };
  }

  /**
   * Create a dropdown field definition
   */
  static dropdownField(
    name: string,
    items: string[],
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "dropdown",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      selectable_items: items,
      multiple_selections: false,
      ...options,
    };
  }

  /**
   * Create a vector field definition
   */
  static vectorField(
    name: string,
    dimension: number,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "vector",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      vector_dimension: dimension,
      ...options,
    };
  }

  /**
   * Create a JSON field definition
   */
  static jsonField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "json",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a date-time field definition
   */
  static dateTimeField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "date-time",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      date_format: "YYYY-MM-DD",
      time_format: "HH:mm:ss",
      ...options,
    };
  }

  /**
   * Create an email field definition
   */
  static emailField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: "email",
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Validate a complete schema
   */
  static validateSchema(schema: FieldDefinition[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(schema) || schema.length === 0) {
      errors.push("Schema must be a non-empty array");
      return { isValid: false, errors };
    }

    const fieldNames = new Set<string>();

    schema.forEach((field, index) => {
      // Check for duplicate field names
      if (fieldNames.has(field.name.toLowerCase())) {
        errors.push(`Duplicate field name at index ${index}: ${field.name}`);
      } else {
        fieldNames.add(field.name.toLowerCase());
      }

      // Validate field name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(`Invalid field name at index ${index}: ${field.name}`);
      }

      // Type-specific validations
      if (
        field.type === "vector" &&
        (!field.vector_dimension || field.vector_dimension <= 0)
      ) {
        errors.push(
          `Vector field at index ${index} requires positive vector_dimension`
        );
      }

      if (
        field.type === "dropdown" &&
        (!field.selectable_items || field.selectable_items.length === 0)
      ) {
        errors.push(
          `Dropdown field at index ${index} requires selectable_items`
        );
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generate a basic schema from field names and types
   */
  static createBasicSchema(
    fields: Array<{ name: string; type: FieldType }>
  ): FieldDefinition[] {
    return fields.map((field, index) => ({
      name: field.name,
      type: field.type,
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: index + 1,
    }));
  }

  /**
   * Compare two schemas for differences
   */
  static compareSchemas(
    oldSchema: FieldDefinition[],
    newSchema: FieldDefinition[]
  ): {
    added: FieldDefinition[];
    removed: FieldDefinition[];
    modified: Array<{ old: FieldDefinition; new: FieldDefinition }>;
  } {
    const oldFields = new Map(oldSchema.map((f) => [f.name, f]));
    const newFields = new Map(newSchema.map((f) => [f.name, f]));

    const added: FieldDefinition[] = [];
    const removed: FieldDefinition[] = [];
    const modified: Array<{ old: FieldDefinition; new: FieldDefinition }> = [];

    // Find added and modified fields
    for (const [name, newField] of newFields) {
      const oldField = oldFields.get(name);
      if (!oldField) {
        added.push(newField);
      } else if (JSON.stringify(oldField) !== JSON.stringify(newField)) {
        modified.push({ old: oldField, new: newField });
      }
    }

    // Find removed fields
    for (const [name, oldField] of oldFields) {
      if (!newFields.has(name)) {
        removed.push(oldField);
      }
    }

    return { added, removed, modified };
  }
}
```

### Task 5: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 5.1 Update BolticClient for Table Operations

Update `src/client/boltic-client.ts` to add table operations:

```typescript
// Add imports at the top
import { TableResource } from "./resources/table";
import { TableBuilder } from "./resources/table-builder";

// Add to the BolticClient class:

export class BolticClient {
  // ... existing code ...

  private tableResource: TableResource;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // ... existing initialization code ...

    // Initialize table operations
    this.tableResource = new TableResource(this.baseClient);
  }

  // Method 1: Direct table operations
  get table() {
    return {
      create: (data: any) => this.tableResource.create(data),
      findAll: (options?: any) => this.tableResource.findAll(options),
      findOne: (options: any) => this.tableResource.findOne(options),
      update: (identifier: any, data?: any) =>
        this.tableResource.update(identifier, data),
      rename: (oldName: string, newName: string) =>
        this.tableResource.rename(oldName, newName),
      setAccess: (data: any) => this.tableResource.setAccess(data),
      delete: (options: any) => this.tableResource.delete(options),
      getMetadata: (name: string) => this.tableResource.getMetadata(name),
      getStats: (name: string) => this.tableResource.getStats(name),
    };
  }

  // Method 2: Fluent table operations
  table(): TableBuilder {
    return new TableBuilder(this.tableResource);
  }

  // ... rest of existing code ...
}
```

### Task 6: Comprehensive Testing

**Duration**: 2-3 days
**Priority**: High

#### 6.1 Create Table Resource Tests

Create `tests/unit/client/resources/table.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TableResource } from "../../../../src/client/resources/table";
import { BaseClient } from "../../../../src/client/core/base-client";
import { ValidationError } from "../../../../src/errors/validation-error";
import { FieldDefinition } from "../../../../src/types/api/table";

vi.mock("../../../../src/client/core/base-client");

describe("TableResource", () => {
  let tableResource: TableResource;
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
      getDatabaseContext: vi.fn(() => ({
        getDatabaseId: () => "db-123",
      })),
    };

    tableResource = new TableResource(mockClient as BaseClient);
  });

  describe("create", () => {
    it("should create a table with valid schema", async () => {
      const schema: FieldDefinition[] = [
        {
          name: "title",
          type: "text",
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 1,
        },
        {
          name: "price",
          type: "currency",
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 2,
          currency_format: "USD",
        },
      ];

      const createData = {
        table_name: "products",
        schema,
        description: "Product catalog table",
      };

      const expectedResponse = {
        data: {
          id: "table-123",
          name: "products",
          table_name: "products",
          internal_name: "products_123",
          database_id: "db-123",
          description: "Product catalog table",
          is_public: false,
          is_active: true,
          record_count: 0,
          field_count: 2,
          created_by: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          schema,
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await tableResource.create(createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("POST", "", {
        ...createData,
        database_id: "db-123",
      });
      expect(result).toEqual(expectedResponse);
    });

    it("should validate table name format", async () => {
      const createData = {
        table_name: "123invalid",
        schema: [{ name: "field1", type: "text" as const }],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it("should validate schema is not empty", async () => {
      const createData = {
        table_name: "valid_table",
        schema: [],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it("should require database context", async () => {
      mockClient.getDatabaseContext.mockReturnValue({
        getDatabaseId: () => null,
      });

      const createData = {
        table_name: "valid_table",
        schema: [{ name: "field1", type: "text" as const }],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("schema validation", () => {
    it("should validate vector field dimensions", async () => {
      const createData = {
        table_name: "vectors",
        schema: [
          {
            name: "embedding",
            type: "vector" as const,
            // Missing vector_dimension
          },
        ],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it("should validate dropdown selectable items", async () => {
      const createData = {
        table_name: "categories",
        schema: [
          {
            name: "category",
            type: "dropdown" as const,
            // Missing selectable_items
          },
        ],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it("should detect duplicate field names", async () => {
      const createData = {
        table_name: "duplicates",
        schema: [
          { name: "field1", type: "text" as const },
          { name: "field1", type: "number" as const }, // Duplicate
        ],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
```

#### 6.2 Create Schema Helpers Tests

Create `tests/unit/utils/table/schema-helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { SchemaHelpers } from "../../../../src/utils/table/schema-helpers";

describe("SchemaHelpers", () => {
  describe("field creation helpers", () => {
    it("should create text field with defaults", () => {
      const field = SchemaHelpers.textField("title");

      expect(field).toEqual({
        name: "title",
        type: "text",
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        is_indexed: false,
        field_order: 1,
      });
    });

    it("should create currency field with currency format", () => {
      const field = SchemaHelpers.currencyField("price", "EUR");

      expect(field.type).toBe("currency");
      expect(field.currency_format).toBe("EUR");
      expect(field.decimals).toBe(2);
    });

    it("should create vector field with dimension", () => {
      const field = SchemaHelpers.vectorField("embedding", 1536);

      expect(field.type).toBe("vector");
      expect(field.vector_dimension).toBe(1536);
    });

    it("should create dropdown field with items", () => {
      const items = ["option1", "option2", "option3"];
      const field = SchemaHelpers.dropdownField("category", items);

      expect(field.type).toBe("dropdown");
      expect(field.selectable_items).toEqual(items);
      expect(field.multiple_selections).toBe(false);
    });
  });

  describe("schema validation", () => {
    it("should validate correct schema", () => {
      const schema = [
        SchemaHelpers.textField("title"),
        SchemaHelpers.numberField("price"),
        SchemaHelpers.emailField("email"),
      ];

      const result = SchemaHelpers.validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect duplicate field names", () => {
      const schema = [
        SchemaHelpers.textField("title"),
        SchemaHelpers.textField("title"), // Duplicate
      ];

      const result = SchemaHelpers.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Duplicate field name at index 1: title");
    });

    it("should validate vector field requirements", () => {
      const schema = [
        {
          name: "embedding",
          type: "vector" as const,
          // Missing vector_dimension
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("vector_dimension"))).toBe(
        true
      );
    });
  });

  describe("schema comparison", () => {
    it("should detect added fields", () => {
      const oldSchema = [SchemaHelpers.textField("title")];
      const newSchema = [
        SchemaHelpers.textField("title"),
        SchemaHelpers.numberField("price"),
      ];

      const diff = SchemaHelpers.compareSchemas(oldSchema, newSchema);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].name).toBe("price");
      expect(diff.removed).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
    });

    it("should detect removed fields", () => {
      const oldSchema = [
        SchemaHelpers.textField("title"),
        SchemaHelpers.numberField("price"),
      ];
      const newSchema = [SchemaHelpers.textField("title")];

      const diff = SchemaHelpers.compareSchemas(oldSchema, newSchema);

      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].name).toBe("price");
      expect(diff.modified).toHaveLength(0);
    });
  });
});
```

### Task 7: Documentation and Examples

**Duration**: 1 day
**Priority**: Medium

#### 7.1 Create Table Operations Documentation

Create `docs/guides/table-management.md`:

````markdown
# Table Management

This guide covers all table management operations in the Boltic Tables SDK.

## Creating Tables

### Method 1: Direct API

```typescript
const { data: table, error } = await db.table.create({
  table_name: "products",
  schema: [
    {
      name: "title",
      type: "text",
      is_nullable: true,
      is_visible: true,
    },
    {
      name: "price",
      type: "currency",
      is_nullable: false,
      currency_format: "USD",
      decimals: 2,
    },
    {
      name: "embedding",
      type: "vector",
      vector_dimension: 1536,
      is_visible: false,
    },
  ],
  description: "Product catalog table",
});
```
````

### Method 2: Fluent Interface

```typescript
const { data: table, error } = await db.table().create({
  table_name: "products",
  schema: [
    SchemaHelpers.textField("title"),
    SchemaHelpers.currencyField("price", "USD"),
    SchemaHelpers.vectorField("embedding", 1536),
  ],
  description: "Product catalog table",
});
```

## Schema Helper Functions

Use schema helpers for easier field creation:

```typescript
import { SchemaHelpers } from "@boltic/database-js/utils";

const schema = [
  SchemaHelpers.textField("title", { is_unique: true }),
  SchemaHelpers.numberField("quantity"),
  SchemaHelpers.currencyField("price", "USD"),
  SchemaHelpers.dropdownField("category", ["electronics", "books", "clothing"]),
  SchemaHelpers.vectorField("embedding", 1536),
  SchemaHelpers.jsonField("metadata"),
  SchemaHelpers.dateTimeField("created_at"),
  SchemaHelpers.emailField("contact_email"),
];
```

## Listing Tables

### Method 1: Direct API

```typescript
const { data: tables, pagination } = await db.table.findAll({
  where: { is_public: true },
  fields: ["id", "name", "record_count", "created_at"],
  sort: [{ field: "name", order: "asc" }],
  limit: 50,
});
```

### Method 2: Fluent Interface

```typescript
const { data: tables, pagination } = await db
  .table()
  .where({ is_public: true })
  .fields(["id", "name", "record_count", "created_at"])
  .sort([{ field: "name", order: "asc" }])
  .limit(50)
  .findAll();
```

## Table Updates and Management

### Renaming Tables

```typescript
// Method 1
await db.table.rename("old_table_name", "new_table_name");

// Method 2
await db
  .table()
  .where({ name: "old_table_name" })
  .set({ name: "new_table_name" })
  .rename();
```

### Setting Access Permissions

```typescript
// Method 1
await db.table.setAccess({
  table_name: "products",
  is_public: true,
});

// Method 2
await db
  .table()
  .where({ name: "products" })
  .set({ is_public: true })
  .setAccess();
```

## Error Handling

```typescript
try {
  const result = await db.table.create({
    table_name: "test_table",
    schema: [
      /* schema definition */
    ],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Schema validation errors:", error.failures);
  } else if (error instanceof ApiError) {
    console.log("API error:", error.statusCode, error.message);
  }
}
```

```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation
- [ ] TableResource class with all CRUD operations
- [ ] Both Method 1 (direct) and Method 2 (fluent) interfaces working
- [ ] Schema validation and field type support
- [ ] Integration with database context management

### ✅ Schema Management
- [ ] Complete field type definitions and validation
- [ ] Schema helper utilities for easy field creation
- [ ] Schema comparison and validation utilities
- [ ] Support for all field types from PRD (text, number, vector, etc.)

### ✅ Validation & Error Handling
- [ ] Input validation for table creation and updates
- [ ] Schema validation with detailed error messages
- [ ] Field type-specific validation rules
- [ ] Comprehensive error handling for all scenarios

### ✅ Caching & Performance
- [ ] Cache integration for table metadata
- [ ] Cache invalidation on table modifications
- [ ] Performance optimizations for large table lists
- [ ] Database context-aware caching

### ✅ Type Safety
- [ ] Complete TypeScript definitions for all operations
- [ ] Generic type support for fluent interface
- [ ] IntelliSense support for schema definitions
- [ ] Type-safe field definition helpers

### ✅ Testing
- [ ] Unit tests for TableResource methods
- [ ] Schema validation testing
- [ ] Fluent interface functionality tests
- [ ] Integration tests with database context

### ✅ Documentation
- [ ] API documentation with schema examples
- [ ] Schema helper usage guides
- [ ] Error handling documentation
- [ ] Best practices for table design

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Full error messages, schema definitions, and reproduction steps
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:
- **Column Operations Agent** (can use table context and schema utilities)
- **Record Operations Agent** (needs table schema awareness)

## Critical Notes

- **ENSURE** both Method 1 and Method 2 APIs work identically
- **VALIDATE** all schema definitions thoroughly
- **TEST** all field types and their specific requirements
- **CACHE** table metadata efficiently
- **HANDLE** database context switching properly

Remember: Table operations are fundamental to all record operations. Schema validation and performance are critical for user experience.
```
