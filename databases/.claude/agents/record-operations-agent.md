# Record Operations Agent Instructions

## Agent Role and Responsibility

You are the **Record Operations Agent** responsible for implementing all record/data operations for the Boltic Tables SDK. Your mission is to create comprehensive record CRUD functionality, support both direct and fluent API styles, implement advanced querying capabilities, SQL interface, vector search, aggregations, and provide robust caching and performance optimization.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Column Operations Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for record operation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known record operation issues

## Dependencies

This agent depends on ALL previous agents completion. Verify these exist:

- Database context management and selection
- Table schema and metadata management
- Column definitions and field type validation
- BaseResource class and operation interfaces
- BolticClient with complete infrastructure
- Authentication, caching, and error handling systems

## Primary Tasks

### Task 1: Record Type Definitions

**Duration**: 1-2 days
**Priority**: Critical

#### 1.1 Create Record API Types

Create `src/types/api/record.ts`:

```typescript
export interface RecordData {
  [fieldName: string]: any;
}

export interface RecordCreateRequest {
  data: RecordData;
}

export interface RecordBulkCreateRequest {
  data: RecordData[];
  batch_size?: number;
  skip_validation?: boolean;
}

export interface RecordUpdateRequest {
  data: Partial<RecordData>;
}

export interface RecordBulkUpdateRequest {
  data: Array<{
    id: string;
    data: Partial<RecordData>;
  }>;
  batch_size?: number;
}

export interface QueryOperator<T = any> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string;
  $ilike?: string;
  $between?: [T, T];
  $null?: boolean;
  $exists?: boolean;
}

export interface WhereCondition {
  [fieldName: string]: any | QueryOperator;
}

export interface RecordQueryOptions {
  where?: WhereCondition;
  fields?: string[];
  sort?: Array<{
    field: string;
    order: "asc" | "desc";
  }>;
  limit?: number;
  offset?: number;
  include_count?: boolean;
}

export interface RecordDeleteOptions {
  where: WhereCondition;
  limit?: number;
}

export interface RecordAggregateOptions {
  groupBy?: string[];
  aggregates: {
    [alias: string]: {
      $sum?: string;
      $avg?: string;
      $count?: string;
      $min?: string;
      $max?: string;
    };
  };
  where?: WhereCondition;
  having?: WhereCondition;
  sort?: Array<{
    field: string;
    order: "asc" | "desc";
  }>;
  limit?: number;
}

export interface VectorSearchOptions {
  vector_field: string;
  query_vector: number[] | string;
  limit?: number;
  distance_metric?: "cosine" | "euclidean" | "dot_product";
  threshold?: number;
  where?: WhereCondition;
}

export interface RecordWithId extends RecordData {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecordListResponse {
  records: RecordWithId[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface RecordAggregateResponse {
  results: Array<{
    [key: string]: any;
  }>;
  total_groups: number;
}

export interface BulkOperationResponse {
  success: RecordWithId[];
  failed: Array<{
    index: number;
    data: RecordData;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface RecordDeleteResponse {
  deleted_count: number;
  deleted_ids: string[];
}
```

#### 1.2 Create SQL Query Types

Create `src/types/api/sql.ts`:

```typescript
export interface SqlQueryRequest {
  query: string;
  params?: any[] | Record<string, any>;
  database_id?: string;
}

export interface SqlQueryResponse {
  columns: Array<{
    name: string;
    type: string;
  }>;
  rows: any[][];
  row_count: number;
  execution_time_ms: number;
}

export interface SqlQueryOptions {
  timeout?: number;
  max_rows?: number;
  include_execution_plan?: boolean;
}
```

### Task 2: Record Resource Implementation (Method 1)

**Duration**: 4-5 days
**Priority**: Critical

#### 2.1 Create Record Resource Class

Create `src/client/resources/record.ts`:

```typescript
import { BaseResource, ApiResponse } from "../core/base-resource";
import { BaseClient } from "../core/base-client";
import {
  RecordCreateRequest,
  RecordBulkCreateRequest,
  RecordUpdateRequest,
  RecordBulkUpdateRequest,
  RecordQueryOptions,
  RecordDeleteOptions,
  RecordAggregateOptions,
  VectorSearchOptions,
  RecordWithId,
  RecordData,
  RecordListResponse,
  RecordAggregateResponse,
  BulkOperationResponse,
  RecordDeleteResponse,
  WhereCondition,
} from "../../types/api/record";
import { ValidationError } from "../../errors/validation-error";
import { ApiError } from "../../errors/api-error";

export class RecordResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, "/v1/tables");
  }

  /**
   * Insert a single record
   */
  async insert(
    tableName: string,
    data: RecordData
  ): Promise<ApiResponse<RecordWithId>> {
    this.validateRecordData(data);

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
      const response = await this.makeRequest<RecordWithId>(
        "POST",
        `/${tableId}/records`,
        { data }
      );

      // Cache the created record
      if (this.client.getCache && response.data) {
        const cache = this.client.getCache();
        if (cache) {
          await cache.set(
            cache.generateKey("record", tableId, response.data.id),
            response.data,
            180000 // 3 minutes
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 422) {
        throw new ValidationError("Record validation failed", [
          { field: "data", message: "Record data does not match table schema" },
        ]);
      }
      throw error;
    }
  }

  /**
   * Insert multiple records (bulk operation)
   */
  async bulkInsert(
    tableName: string,
    request: RecordBulkCreateRequest
  ): Promise<ApiResponse<BulkOperationResponse>> {
    if (
      !request.data ||
      !Array.isArray(request.data) ||
      request.data.length === 0
    ) {
      throw new ValidationError("Bulk insert requires data array", [
        { field: "data", message: "Data must be a non-empty array of records" },
      ]);
    }

    // Validate each record
    if (!request.skip_validation) {
      request.data.forEach((record, index) => {
        try {
          this.validateRecordData(record);
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ValidationError(
              `Record at index ${index} validation failed`,
              error.failures
            );
          }
          throw error;
        }
      });
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

    const response = await this.makeRequest<BulkOperationResponse>(
      "POST",
      `/${tableId}/records/bulk`,
      request
    );

    // Cache successful records
    if (this.client.getCache && response.data?.success) {
      const cache = this.client.getCache();
      if (cache) {
        for (const record of response.data.success) {
          await cache.set(
            cache.generateKey("record", tableId, record.id),
            record,
            180000 // 3 minutes
          );
        }
      }
    }

    return response;
  }

  /**
   * Find records with advanced querying
   */
  async findAll(
    tableName: string,
    options: RecordQueryOptions = {}
  ): Promise<ApiResponse<RecordWithId[]> & { pagination?: any }> {
    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    this.validateQueryOptions(options);

    const cacheKey = this.generateCacheKey("findAll", {
      table: tableName,
      ...options,
    });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<
          ApiResponse<RecordWithId[]> & { pagination?: any }
        >(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const queryParams = this.buildQueryParams(options);
    const response = await this.makeRequest<RecordListResponse>(
      "GET",
      `/${tableId}/records`,
      undefined,
      { params: queryParams }
    );

    // Transform response to match expected format
    const result = {
      data: response.data?.records || [],
      pagination: response.data?.pagination,
      error: response.error,
    };

    // Cache the result for 1 minute (frequently changing data)
    if (this.client.getCache && !result.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, result, 60000);
      }
    }

    return result;
  }

  /**
   * Find a single record
   */
  async findOne(
    tableName: string,
    options: RecordQueryOptions
  ): Promise<ApiResponse<RecordWithId | null>> {
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
        const cacheKey = cache.generateKey("record", tableId, options.where.id);
        const cached = await cache.get<RecordWithId>(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }
    }

    const queryOptions = { ...options, limit: 1 };
    const queryParams = this.buildQueryParams(queryOptions);
    const response = await this.makeRequest<RecordListResponse>(
      "GET",
      `/${tableId}/records`,
      undefined,
      { params: queryParams }
    );

    const record = response.data?.records?.[0] || null;
    const result = {
      data: record,
      error: response.error,
    };

    // Cache the result if found
    if (record && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(
          cache.generateKey("record", tableId, record.id),
          record,
          180000 // 3 minutes
        );
      }
    }

    return result;
  }

  /**
   * Update records
   */
  async update(
    tableName: string,
    options: { set: Partial<RecordData>; where: WhereCondition; limit?: number }
  ): Promise<ApiResponse<RecordWithId[]>> {
    this.validateRecordData(options.set);
    this.validateWhereCondition(options.where);

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const requestData = {
      data: options.set,
      where: options.where,
      limit: options.limit,
    };

    const response = await this.makeRequest<RecordWithId[]>(
      "PATCH",
      `/${tableId}/records`,
      requestData
    );

    // Invalidate cache for updated records
    if (this.client.getCache && response.data) {
      const cache = this.client.getCache();
      if (cache) {
        for (const record of response.data) {
          await cache.delete(cache.generateKey("record", tableId, record.id));
        }
        await this.invalidateListCaches(tableName);
      }
    }

    return response;
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(
    tableName: string,
    request: RecordBulkUpdateRequest
  ): Promise<ApiResponse<BulkOperationResponse>> {
    if (
      !request.data ||
      !Array.isArray(request.data) ||
      request.data.length === 0
    ) {
      throw new ValidationError("Bulk update requires data array", [
        {
          field: "data",
          message: "Data must be a non-empty array of update operations",
        },
      ]);
    }

    // Validate each update operation
    request.data.forEach((update, index) => {
      if (!update.id) {
        throw new ValidationError(`Update at index ${index} missing ID`, [
          {
            field: `data[${index}].id`,
            message: "Record ID is required for updates",
          },
        ]);
      }
      this.validateRecordData(update.data);
    });

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const response = await this.makeRequest<BulkOperationResponse>(
      "PATCH",
      `/${tableId}/records/bulk`,
      request
    );

    // Invalidate cache for updated records
    if (this.client.getCache && response.data?.success) {
      const cache = this.client.getCache();
      if (cache) {
        for (const record of response.data.success) {
          await cache.delete(cache.generateKey("record", tableId, record.id));
        }
        await this.invalidateListCaches(tableName);
      }
    }

    return response;
  }

  /**
   * Delete records
   */
  async delete(
    tableName: string,
    options: RecordDeleteOptions
  ): Promise<ApiResponse<RecordDeleteResponse>> {
    this.validateWhereCondition(options.where);

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const queryParams = {
      where: JSON.stringify(options.where),
      limit: options.limit,
    };

    const response = await this.makeRequest<RecordDeleteResponse>(
      "DELETE",
      `/${tableId}/records`,
      undefined,
      { params: queryParams }
    );

    // Invalidate cache for deleted records
    if (this.client.getCache && response.data?.deleted_ids) {
      const cache = this.client.getCache();
      if (cache) {
        for (const recordId of response.data.deleted_ids) {
          await cache.delete(cache.generateKey("record", tableId, recordId));
        }
        await this.invalidateListCaches(tableName);
      }
    }

    return response;
  }

  /**
   * Perform aggregation queries
   */
  async aggregate(
    tableName: string,
    options: RecordAggregateOptions
  ): Promise<ApiResponse<RecordAggregateResponse>> {
    this.validateAggregateOptions(options);

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const cacheKey = this.generateCacheKey("aggregate", {
      table: tableName,
      ...options,
    });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<ApiResponse<RecordAggregateResponse>>(
          cacheKey
        );
        if (cached) {
          return cached;
        }
      }
    }

    const response = await this.makeRequest<RecordAggregateResponse>(
      "POST",
      `/${tableId}/records/aggregate`,
      options
    );

    // Cache aggregate results for 2 minutes
    if (this.client.getCache && !response.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, response, 120000);
      }
    }

    return response;
  }

  /**
   * Vector similarity search
   */
  async vectorSearch(
    tableName: string,
    options: VectorSearchOptions
  ): Promise<ApiResponse<RecordWithId[]>> {
    this.validateVectorSearchOptions(options);

    const tableId = await this.getTableId(tableName);
    if (!tableId) {
      throw new ValidationError("Table not found", [
        {
          field: "table",
          message: `Table '${tableName}' not found in current database`,
        },
      ]);
    }

    const cacheKey = this.generateCacheKey("vectorSearch", {
      table: tableName,
      ...options,
    });

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<ApiResponse<RecordWithId[]>>(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const response = await this.makeRequest<RecordWithId[]>(
      "POST",
      `/${tableId}/records/vector-search`,
      options
    );

    // Cache vector search results for 5 minutes
    if (this.client.getCache && !response.error) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, response, 300000);
      }
    }

    return response;
  }

  // Private helper methods
  private validateRecordData(data: Partial<RecordData>): void {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new ValidationError("Invalid record data", [
        { field: "data", message: "Record data must be a non-null object" },
      ]);
    }

    // Validate reserved field names
    const reservedFields = ["id", "created_at", "updated_at"];
    const errors: Array<{ field: string; message: string }> = [];

    Object.keys(data).forEach((fieldName) => {
      if (reservedFields.includes(fieldName)) {
        errors.push({
          field: fieldName,
          message: `'${fieldName}' is a reserved field name and cannot be set manually`,
        });
      }

      // Basic field name validation
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName)) {
        errors.push({
          field: fieldName,
          message:
            "Field names must start with a letter and contain only letters, numbers, and underscores",
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError("Record data validation failed", errors);
    }
  }

  private validateWhereCondition(where: WhereCondition): void {
    if (!where || typeof where !== "object" || Array.isArray(where)) {
      throw new ValidationError("Invalid where condition", [
        {
          field: "where",
          message: "Where condition must be a non-null object",
        },
      ]);
    }

    if (Object.keys(where).length === 0) {
      throw new ValidationError("Empty where condition", [
        { field: "where", message: "Where condition cannot be empty" },
      ]);
    }
  }

  private validateQueryOptions(options: RecordQueryOptions): void {
    if (
      options.limit !== undefined &&
      (options.limit < 1 || options.limit > 1000)
    ) {
      throw new ValidationError("Invalid limit", [
        { field: "limit", message: "Limit must be between 1 and 1000" },
      ]);
    }

    if (options.offset !== undefined && options.offset < 0) {
      throw new ValidationError("Invalid offset", [
        { field: "offset", message: "Offset must be non-negative" },
      ]);
    }
  }

  private validateAggregateOptions(options: RecordAggregateOptions): void {
    if (!options.aggregates || Object.keys(options.aggregates).length === 0) {
      throw new ValidationError("Missing aggregates", [
        {
          field: "aggregates",
          message: "At least one aggregate function is required",
        },
      ]);
    }

    const validAggregates = ["$sum", "$avg", "$count", "$min", "$max"];
    Object.entries(options.aggregates).forEach(([alias, aggregate]) => {
      const aggregateKeys = Object.keys(aggregate);
      if (aggregateKeys.length !== 1) {
        throw new ValidationError("Invalid aggregate", [
          {
            field: `aggregates.${alias}`,
            message: "Each aggregate must have exactly one function",
          },
        ]);
      }

      const aggregateFunction = aggregateKeys[0];
      if (!validAggregates.includes(aggregateFunction)) {
        throw new ValidationError("Invalid aggregate function", [
          {
            field: `aggregates.${alias}`,
            message: `Invalid aggregate function: ${aggregateFunction}`,
          },
        ]);
      }
    });
  }

  private validateVectorSearchOptions(options: VectorSearchOptions): void {
    if (!options.vector_field) {
      throw new ValidationError("Missing vector field", [
        { field: "vector_field", message: "Vector field name is required" },
      ]);
    }

    if (!options.query_vector) {
      throw new ValidationError("Missing query vector", [
        { field: "query_vector", message: "Query vector is required" },
      ]);
    }

    if (Array.isArray(options.query_vector)) {
      if (options.query_vector.length === 0) {
        throw new ValidationError("Empty query vector", [
          { field: "query_vector", message: "Query vector cannot be empty" },
        ]);
      }

      // Validate vector values
      const invalidValues = options.query_vector.filter(
        (val) => typeof val !== "number" || !isFinite(val)
      );
      if (invalidValues.length > 0) {
        throw new ValidationError("Invalid vector values", [
          {
            field: "query_vector",
            message: "All vector values must be finite numbers",
          },
        ]);
      }
    }

    if (
      options.distance_metric &&
      !["cosine", "euclidean", "dot_product"].includes(options.distance_metric)
    ) {
      throw new ValidationError("Invalid distance metric", [
        {
          field: "distance_metric",
          message:
            "Distance metric must be one of: cosine, euclidean, dot_product",
        },
      ]);
    }

    if (
      options.threshold !== undefined &&
      (options.threshold < 0 || options.threshold > 1)
    ) {
      throw new ValidationError("Invalid threshold", [
        { field: "threshold", message: "Threshold must be between 0 and 1" },
      ]);
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
    return cache.generateKey("record", operation, paramsStr);
  }

  private async invalidateListCaches(tableName: string): Promise<void> {
    if (!this.client.getCache) return;
    const cache = this.client.getCache()!;
    // In a real implementation, you'd have more sophisticated cache invalidation
    await cache.clear(); // Simple approach
  }

  protected buildQueryParams(
    options: RecordQueryOptions = {}
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

    if (options.include_count !== undefined) {
      params.include_count = options.include_count;
    }

    if (options.where) {
      params.where = JSON.stringify(options.where);
    }

    return params;
  }
}
```

### Task 3: SQL Query Resource Implementation

**Duration**: 2-3 days
**Priority**: High

#### 3.1 Create SQL Resource Class

Create `src/client/resources/sql.ts`:

```typescript
import { BaseResource, ApiResponse } from "../core/base-resource";
import { BaseClient } from "../core/base-client";
import {
  SqlQueryRequest,
  SqlQueryResponse,
  SqlQueryOptions,
} from "../../types/api/sql";
import { ValidationError } from "../../errors/validation-error";

export class SqlResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, "/v1/tables/query");
  }

  /**
   * Execute SQL query
   */
  async execute(
    request: SqlQueryRequest,
    options: SqlQueryOptions = {}
  ): Promise<ApiResponse<SqlQueryResponse>> {
    this.validateSqlQuery(request);

    // Get current database context if not provided
    if (!request.database_id) {
      const databaseId = this.getCurrentDatabaseId();
      if (!databaseId) {
        throw new ValidationError("Database context required", [
          {
            field: "database",
            message:
              "No database selected. Use useDatabase() first or provide database_id",
          },
        ]);
      }
      request.database_id = databaseId;
    }

    const cacheKey = this.generateCacheKey("execute", {
      ...request,
      ...options,
    });

    // Check cache for SELECT queries only
    if (this.isCacheableQuery(request.query) && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<ApiResponse<SqlQueryResponse>>(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const requestData = {
      ...request,
      timeout: options.timeout,
      max_rows: options.max_rows,
      include_execution_plan: options.include_execution_plan,
    };

    const response = await this.makeRequest<SqlQueryResponse>(
      "POST",
      "",
      requestData
    );

    // Cache SELECT query results for 1 minute
    if (
      this.isCacheableQuery(request.query) &&
      this.client.getCache &&
      !response.error
    ) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(cacheKey, response, 60000);
      }
    }

    return response;
  }

  /**
   * Execute raw SQL query (convenience method)
   */
  async query(
    sql: string,
    params?: any[]
  ): Promise<ApiResponse<SqlQueryResponse>> {
    return this.execute({ query: sql, params });
  }

  /**
   * Execute parameterized SQL query with named parameters
   */
  async queryWithParams(
    sql: string,
    params: Record<string, any>
  ): Promise<ApiResponse<SqlQueryResponse>> {
    return this.execute({ query: sql, params });
  }

  // Private helper methods
  private validateSqlQuery(request: SqlQueryRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (
      !request.query ||
      typeof request.query !== "string" ||
      request.query.trim().length === 0
    ) {
      errors.push({
        field: "query",
        message: "SQL query is required and must be a non-empty string",
      });
    } else {
      // Basic SQL injection prevention
      this.validateQuerySafety(request.query, errors);
    }

    if (request.params !== undefined) {
      if (
        !Array.isArray(request.params) &&
        typeof request.params !== "object"
      ) {
        errors.push({
          field: "params",
          message: "Parameters must be an array or object",
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("SQL query validation failed", errors);
    }
  }

  private validateQuerySafety(
    query: string,
    errors: Array<{ field: string; message: string }>
  ): void {
    // Remove comments and normalize whitespace
    const normalizedQuery = query
      .replace(/--.*$/gm, "") // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    // Check for dangerous patterns
    const dangerousPatterns = [
      /\b(drop|truncate|delete|alter|create|insert|update)\s+(table|database|schema|index|view)/,
      /\b(exec|execute|sp_|xp_)/,
      /\b(grant|revoke|deny)\b/,
      /\b(backup|restore)\b/,
      /\b(shutdown|kill)\b/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(normalizedQuery)) {
        errors.push({
          field: "query",
          message:
            "Query contains potentially dangerous operations. Only SELECT queries are recommended.",
        });
        break;
      }
    }

    // Warn about non-SELECT queries
    if (
      !normalizedQuery.startsWith("select") &&
      !normalizedQuery.startsWith("with")
    ) {
      errors.push({
        field: "query",
        message: "Only SELECT and WITH queries are recommended for safety",
      });
    }
  }

  private isCacheableQuery(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    return (
      normalizedQuery.startsWith("select") || normalizedQuery.startsWith("with")
    );
  }

  private getCurrentDatabaseId(): string | null {
    // Get database context from client
    const client = this.client as any;
    if (client.getDatabaseContext) {
      const context = client.getDatabaseContext();
      return context?.getDatabaseId() || null;
    }
    return null;
  }

  private generateCacheKey(operation: string, params?: any): string {
    if (!this.client.getCache) return "";
    const cache = this.client.getCache()!;
    const paramsStr = params ? JSON.stringify(params) : "";
    return cache.generateKey("sql", operation, paramsStr);
  }
}
```

### Task 4: Record Fluent Interface (Method 2)

**Duration**: 3-4 days
**Priority**: Critical

#### 4.1 Create Record Fluent Builder

Create `src/client/resources/record-builder.ts`:

```typescript
import { RecordResource } from "./record";
import { SqlResource } from "./sql";
import {
  RecordData,
  RecordQueryOptions,
  RecordAggregateOptions,
  VectorSearchOptions,
  RecordWithId,
  WhereCondition,
  QueryOperator,
} from "../../types/api/record";
import { ApiResponse } from "../core/base-resource";

export class RecordBuilder {
  private recordResource: RecordResource;
  private sqlResource: SqlResource;
  private tableName: string;
  private queryOptions: RecordQueryOptions = {};
  private updateData: Partial<RecordData> = {};
  private aggregateOptions: Partial<RecordAggregateOptions> = {};

  constructor(
    recordResource: RecordResource,
    sqlResource: SqlResource,
    tableName: string
  ) {
    this.recordResource = recordResource;
    this.sqlResource = sqlResource;
    this.tableName = tableName;
  }

  /**
   * Add where conditions to the query
   */
  where(field: string, operator: string | any, value?: any): RecordBuilder;
  where(conditions: WhereCondition): RecordBuilder;
  where(
    fieldOrConditions: string | WhereCondition,
    operator?: string | any,
    value?: any
  ): RecordBuilder {
    if (typeof fieldOrConditions === "string") {
      // Handle individual field conditions
      if (value === undefined) {
        // where('field', value) syntax
        this.queryOptions.where = {
          ...this.queryOptions.where,
          [fieldOrConditions]: operator,
        };
      } else {
        // where('field', 'operator', value) syntax
        const condition = this.buildOperatorCondition(operator, value);
        this.queryOptions.where = {
          ...this.queryOptions.where,
          [fieldOrConditions]: condition,
        };
      }
    } else {
      // Handle object conditions
      this.queryOptions.where = {
        ...this.queryOptions.where,
        ...fieldOrConditions,
      };
    }
    return this;
  }

  /**
   * Add OR where conditions
   */
  orWhere(field: string, operator: string | any, value?: any): RecordBuilder;
  orWhere(conditions: WhereCondition): RecordBuilder;
  orWhere(
    fieldOrConditions: string | WhereCondition,
    operator?: string | any,
    value?: any
  ): RecordBuilder {
    // For simplicity, we'll add OR conditions as $or operator
    // This would need more sophisticated handling in a real implementation
    const newCondition =
      typeof fieldOrConditions === "string"
        ? {
            [fieldOrConditions]:
              value === undefined
                ? operator
                : this.buildOperatorCondition(operator, value),
          }
        : fieldOrConditions;

    if (this.queryOptions.where?.$or) {
      this.queryOptions.where.$or.push(newCondition);
    } else {
      this.queryOptions.where = {
        ...this.queryOptions.where,
        $or: [newCondition],
      };
    }
    return this;
  }

  /**
   * Specify fields to select
   */
  select(fields: string[]): RecordBuilder {
    this.queryOptions.fields = fields;
    return this;
  }

  /**
   * Add sorting to the query
   */
  orderBy(field: string, order: "asc" | "desc" = "asc"): RecordBuilder {
    if (!this.queryOptions.sort) {
      this.queryOptions.sort = [];
    }
    this.queryOptions.sort.push({ field, order });
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): RecordBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): RecordBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Include total count in results
   */
  withCount(): RecordBuilder {
    this.queryOptions.include_count = true;
    return this;
  }

  /**
   * Set update data
   */
  set(data: Partial<RecordData>): RecordBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Add group by fields for aggregation
   */
  groupBy(fields: string[]): RecordBuilder {
    this.aggregateOptions.groupBy = fields;
    return this;
  }

  /**
   * Add aggregate functions
   */
  aggregate(aggregates: RecordAggregateOptions["aggregates"]): RecordBuilder {
    this.aggregateOptions.aggregates = {
      ...this.aggregateOptions.aggregates,
      ...aggregates,
    };
    return this;
  }

  /**
   * Add having conditions for aggregation
   */
  having(conditions: WhereCondition): RecordBuilder {
    this.aggregateOptions.having = conditions;
    return this;
  }

  /**
   * Execute insert operation
   */
  async insert(data: RecordData): Promise<ApiResponse<RecordWithId>> {
    return this.recordResource.insert(this.tableName, data);
  }

  /**
   * Execute bulk insert operation
   */
  async bulkInsert(
    data: RecordData[],
    options?: { batch_size?: number; skip_validation?: boolean }
  ): Promise<ApiResponse<any>> {
    return this.recordResource.bulkInsert(this.tableName, { data, ...options });
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<ApiResponse<RecordWithId[]> & { pagination?: any }> {
    return this.recordResource.findAll(this.tableName, this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<RecordWithId | null>> {
    return this.recordResource.findOne(this.tableName, this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<RecordWithId[]>> {
    if (
      !this.queryOptions.where ||
      Object.keys(this.queryOptions.where).length === 0
    ) {
      throw new Error("Update operation requires where conditions");
    }

    return this.recordResource.update(this.tableName, {
      set: this.updateData,
      where: this.queryOptions.where,
      limit: this.queryOptions.limit,
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<any>> {
    if (
      !this.queryOptions.where ||
      Object.keys(this.queryOptions.where).length === 0
    ) {
      throw new Error("Delete operation requires where conditions");
    }

    return this.recordResource.delete(this.tableName, {
      where: this.queryOptions.where,
      limit: this.queryOptions.limit,
    });
  }

  /**
   * Execute aggregation query
   */
  async aggregateQuery(): Promise<ApiResponse<any>> {
    if (
      !this.aggregateOptions.aggregates ||
      Object.keys(this.aggregateOptions.aggregates).length === 0
    ) {
      throw new Error("Aggregate operation requires aggregate functions");
    }

    const options: RecordAggregateOptions = {
      groupBy: this.aggregateOptions.groupBy,
      aggregates: this.aggregateOptions.aggregates!,
      where: this.queryOptions.where,
      having: this.aggregateOptions.having,
      sort: this.queryOptions.sort,
      limit: this.queryOptions.limit,
    };

    return this.recordResource.aggregate(this.tableName, options);
  }

  /**
   * Execute vector similarity search
   */
  async vectorSearch(
    vectorField: string,
    queryVector: number[] | string,
    options?: {
      distance_metric?: "cosine" | "euclidean" | "dot_product";
      threshold?: number;
    }
  ): Promise<ApiResponse<RecordWithId[]>> {
    const searchOptions: VectorSearchOptions = {
      vector_field: vectorField,
      query_vector: queryVector,
      limit: this.queryOptions.limit,
      where: this.queryOptions.where,
      ...options,
    };

    return this.recordResource.vectorSearch(this.tableName, searchOptions);
  }

  /**
   * Reset builder to initial state
   */
  reset(): RecordBuilder {
    this.queryOptions = {};
    this.updateData = {};
    this.aggregateOptions = {};
    return this;
  }

  // Private helper methods
  private buildOperatorCondition(operator: string, value: any): QueryOperator {
    switch (operator.toLowerCase()) {
      case "=":
      case "eq":
        return { $eq: value };
      case "!=":
      case "<>":
      case "ne":
        return { $ne: value };
      case ">":
      case "gt":
        return { $gt: value };
      case ">=":
      case "gte":
        return { $gte: value };
      case "<":
      case "lt":
        return { $lt: value };
      case "<=":
      case "lte":
        return { $lte: value };
      case "in":
        return { $in: Array.isArray(value) ? value : [value] };
      case "not in":
      case "nin":
        return { $nin: Array.isArray(value) ? value : [value] };
      case "like":
        return { $like: value };
      case "ilike":
        return { $ilike: value };
      case "between":
        return { $between: value };
      case "is null":
        return { $null: true };
      case "is not null":
        return { $null: false };
      case "exists":
        return { $exists: true };
      case "not exists":
        return { $exists: false };
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
}

export class SqlBuilder {
  private sqlResource: SqlResource;

  constructor(sqlResource: SqlResource) {
    this.sqlResource = sqlResource;
  }

  /**
   * Execute SQL query with parameters
   */
  async query(sql: string): Promise<ApiResponse<any>> {
    return this.sqlResource.query(sql);
  }

  /**
   * Execute parameterized SQL query
   */
  async params(parameters: any[]): Promise<SqlQueryBuilder> {
    return new SqlQueryBuilder(this.sqlResource, parameters);
  }
}

export class SqlQueryBuilder {
  private sqlResource: SqlResource;
  private parameters: any[];

  constructor(sqlResource: SqlResource, parameters: any[]) {
    this.sqlResource = sqlResource;
    this.parameters = parameters;
  }

  /**
   * Execute the SQL query
   */
  async execute(sql: string): Promise<ApiResponse<any>> {
    return this.sqlResource.execute({ query: sql, params: this.parameters });
  }
}
```

### Task 5: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 5.1 Update BolticClient for Record Operations

Update `src/client/boltic-client.ts` to add record operations:

```typescript
// Add imports at the top
import { RecordResource } from "./resources/record";
import { SqlResource } from "./resources/sql";
import { RecordBuilder, SqlBuilder } from "./resources/record-builder";

// Add to the BolticClient class:

export class BolticClient {
  // ... existing code ...

  private recordResource: RecordResource;
  private sqlResource: SqlResource;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // ... existing initialization code ...

    // Initialize record and SQL operations
    this.recordResource = new RecordResource(this.baseClient);
    this.sqlResource = new SqlResource(this.baseClient);
  }

  // Method 1: Direct record operations
  get record() {
    return {
      insert: (tableName: string, data: any) =>
        this.recordResource.insert(tableName, data),
      bulkInsert: (tableName: string, request: any) =>
        this.recordResource.bulkInsert(tableName, request),
      findAll: (tableName: string, options?: any) =>
        this.recordResource.findAll(tableName, options),
      findOne: (tableName: string, options: any) =>
        this.recordResource.findOne(tableName, options),
      update: (tableName: string, options: any) =>
        this.recordResource.update(tableName, options),
      bulkUpdate: (tableName: string, request: any) =>
        this.recordResource.bulkUpdate(tableName, request),
      delete: (tableName: string, options: any) =>
        this.recordResource.delete(tableName, options),
      aggregate: (tableName: string, options: any) =>
        this.recordResource.aggregate(tableName, options),
      vectorSearch: (tableName: string, options: any) =>
        this.recordResource.vectorSearch(tableName, options),
    };
  }

  // Method 1: Direct SQL operations
  get sql() {
    return {
      execute: (request: any, options?: any) =>
        this.sqlResource.execute(request, options),
      query: (sql: string, params?: any[]) =>
        this.sqlResource.query(sql, params),
      queryWithParams: (sql: string, params: any) =>
        this.sqlResource.queryWithParams(sql, params),
    };
  }

  // Method 2: Fluent SQL operations
  sql(): SqlBuilder {
    return new SqlBuilder(this.sqlResource);
  }

  // Update the existing from() method to include record operations
  from(tableName: string) {
    return {
      column: () => new ColumnBuilder(this.columnResource, tableName),
      // Add record operations
      insert: (data: any) =>
        new RecordBuilder(
          this.recordResource,
          this.sqlResource,
          tableName
        ).insert(data),
      select: (fields?: string[]) => {
        const builder = new RecordBuilder(
          this.recordResource,
          this.sqlResource,
          tableName
        );
        return fields ? builder.select(fields) : builder;
      },
      where: (field: any, operator?: any, value?: any) =>
        new RecordBuilder(
          this.recordResource,
          this.sqlResource,
          tableName
        ).where(field, operator, value),
      update: (data: any) =>
        new RecordBuilder(this.recordResource, this.sqlResource, tableName).set(
          data
        ),
      delete: () =>
        new RecordBuilder(this.recordResource, this.sqlResource, tableName),
    };
  }

  // ... rest of existing code ...
}
```

### Task 6: Performance Optimization Utilities

**Duration**: 1-2 days
**Priority**: Medium

#### 6.1 Create Record Helper Utilities

Create `src/utils/record/helpers.ts`:

```typescript
import {
  RecordData,
  RecordWithId,
  WhereCondition,
} from "../../types/api/record";

export class RecordHelpers {
  /**
   * Batch records into chunks for bulk operations
   */
  static batchRecords<T>(records: T[], batchSize: number = 100): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Sanitize record data by removing invalid fields
   */
  static sanitizeRecord(record: RecordData): RecordData {
    const sanitized: RecordData = {};
    const reservedFields = ["id", "created_at", "updated_at"];

    Object.entries(record).forEach(([key, value]) => {
      // Skip reserved fields
      if (reservedFields.includes(key)) {
        return;
      }

      // Skip undefined values
      if (value === undefined) {
        return;
      }

      // Validate field name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        return;
      }

      sanitized[key] = value;
    });

    return sanitized;
  }

  /**
   * Convert query conditions to SQL-friendly format
   */
  static buildWhereClause(conditions: WhereCondition): string {
    const clauses: string[] = [];

    Object.entries(conditions).forEach(([field, condition]) => {
      if (
        typeof condition === "object" &&
        condition !== null &&
        !Array.isArray(condition)
      ) {
        // Handle operator conditions
        Object.entries(condition).forEach(([operator, value]) => {
          switch (operator) {
            case "$eq":
              clauses.push(`${field} = ${this.formatValue(value)}`);
              break;
            case "$ne":
              clauses.push(`${field} != ${this.formatValue(value)}`);
              break;
            case "$gt":
              clauses.push(`${field} > ${this.formatValue(value)}`);
              break;
            case "$gte":
              clauses.push(`${field} >= ${this.formatValue(value)}`);
              break;
            case "$lt":
              clauses.push(`${field} < ${this.formatValue(value)}`);
              break;
            case "$lte":
              clauses.push(`${field} <= ${this.formatValue(value)}`);
              break;
            case "$in":
              const inValues = Array.isArray(value) ? value : [value];
              clauses.push(
                `${field} IN (${inValues
                  .map((v) => this.formatValue(v))
                  .join(", ")})`
              );
              break;
            case "$nin":
              const ninValues = Array.isArray(value) ? value : [value];
              clauses.push(
                `${field} NOT IN (${ninValues
                  .map((v) => this.formatValue(v))
                  .join(", ")})`
              );
              break;
            case "$like":
              clauses.push(`${field} LIKE ${this.formatValue(value)}`);
              break;
            case "$ilike":
              clauses.push(`${field} ILIKE ${this.formatValue(value)}`);
              break;
            case "$between":
              if (Array.isArray(value) && value.length === 2) {
                clauses.push(
                  `${field} BETWEEN ${this.formatValue(
                    value[0]
                  )} AND ${this.formatValue(value[1])}`
                );
              }
              break;
            case "$null":
              clauses.push(value ? `${field} IS NULL` : `${field} IS NOT NULL`);
              break;
          }
        });
      } else {
        // Handle direct value conditions
        clauses.push(`${field} = ${this.formatValue(condition)}`);
      }
    });

    return clauses.join(" AND ");
  }

  /**
   * Format value for SQL query
   */
  private static formatValue(value: any): string {
    if (value === null) return "NULL";
    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  /**
   * Optimize query for better performance
   */
  static optimizeQuery(options: any): any {
    const optimized = { ...options };

    // Limit very large queries
    if (!optimized.limit || optimized.limit > 1000) {
      optimized.limit = 1000;
    }

    // Add indexes suggestion for where conditions
    if (optimized.where) {
      const suggestedIndexes = Object.keys(optimized.where);
      optimized._suggestedIndexes = suggestedIndexes;
    }

    return optimized;
  }

  /**
   * Calculate similarity between records (for deduplication)
   */
  static calculateRecordSimilarity(
    record1: RecordData,
    record2: RecordData
  ): number {
    const keys1 = Object.keys(record1);
    const keys2 = Object.keys(record2);
    const allKeys = new Set([...keys1, ...keys2]);

    let matches = 0;
    let total = allKeys.size;

    allKeys.forEach((key) => {
      const val1 = record1[key];
      const val2 = record2[key];

      if (val1 === val2) {
        matches++;
      } else if (typeof val1 === "string" && typeof val2 === "string") {
        // Simple string similarity
        const similarity = this.stringSimilarity(val1, val2);
        matches += similarity;
      }
    });

    return matches / total;
  }

  /**
   * Simple string similarity calculation
   */
  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Convert records to CSV format
   */
  static recordsToCSV(records: RecordWithId[]): string {
    if (records.length === 0) return "";

    const headers = Object.keys(records[0]);
    const csvHeaders = headers.join(",");

    const csvRows = records.map((record) =>
      headers
        .map((header) => {
          const value = record[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",")
    );

    return [csvHeaders, ...csvRows].join("\n");
  }

  /**
   * Parse CSV data to records
   */
  static csvToRecords(csvData: string): RecordData[] {
    const lines = csvData.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const records: RecordData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const record: RecordData = {};
      headers.forEach((header, index) => {
        const value = values[index];
        record[header] = this.parseCSVValue(value);
      });

      records.push(record);
    }

    return records;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse CSV value to appropriate type
   */
  private static parseCSVValue(value: string): any {
    if (value === "") return null;

    // Try to parse as number
    if (/^-?\d*\.?\d+$/.test(value)) {
      return Number(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Try to parse as date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    // Return as string
    return value;
  }
}
```

### Task 7: Comprehensive Testing

**Duration**: 3-4 days
**Priority**: High

#### 7.1 Create Record Resource Tests

Create `tests/unit/client/resources/record.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecordResource } from "../../../../src/client/resources/record";
import { BaseClient } from "../../../../src/client/core/base-client";
import { ValidationError } from "../../../../src/errors/validation-error";

vi.mock("../../../../src/client/core/base-client");

describe("RecordResource", () => {
  let recordResource: RecordResource;
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

    recordResource = new RecordResource(mockClient as BaseClient);
  });

  describe("insert", () => {
    it("should insert a record successfully", async () => {
      const recordData = {
        title: "MacBook Pro",
        price: 2499.99,
        category_id: 1,
        metadata: { color: "silver", storage: "512GB" },
      };

      const expectedResponse = {
        data: {
          id: "record-123",
          title: "MacBook Pro",
          price: 2499.99,
          category_id: 1,
          metadata: { color: "silver", storage: "512GB" },
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await recordResource.insert("products", recordData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "POST",
        "/table-123/records",
        { data: recordData }
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should validate record data", async () => {
      const invalidData = {
        id: "should-not-be-set", // Reserved field
        title: "Test Product",
      };

      await expect(
        recordResource.insert("products", invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it("should require table context", async () => {
      mockClient.table.findOne.mockResolvedValue({ data: null });

      const recordData = { title: "Test Product" };

      await expect(
        recordResource.insert("nonexistent", recordData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("findAll", () => {
    it("should retrieve records with pagination", async () => {
      const mockResponse = {
        data: {
          records: [
            { id: "rec-1", title: "Product 1", price: 99.99 },
            { id: "rec-2", title: "Product 2", price: 199.99 },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1,
            has_next: false,
            has_prev: false,
          },
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await recordResource.findAll("products", {
        where: { price: { $gt: 50 } },
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("bulkInsert", () => {
    it("should insert multiple records", async () => {
      const recordsData = [
        { title: "Product 1", price: 99.99 },
        { title: "Product 2", price: 199.99 },
      ];

      const expectedResponse = {
        data: {
          success: [
            { id: "rec-1", title: "Product 1", price: 99.99 },
            { id: "rec-2", title: "Product 2", price: 199.99 },
          ],
          failed: [],
          summary: { total: 2, successful: 2, failed: 0 },
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await recordResource.bulkInsert("products", {
        data: recordsData,
      });

      expect(result.data.summary.successful).toBe(2);
      expect(result.data.failed).toHaveLength(0);
    });

    it("should validate bulk insert data", async () => {
      await expect(
        recordResource.bulkInsert("products", { data: [] })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("should update records with where condition", async () => {
      const updateData = { price: 2299.99, updated_at: new Date() };
      const whereCondition = { id: "record-123" };

      const expectedResponse = {
        data: [
          {
            id: "record-123",
            title: "MacBook Pro",
            price: 2299.99,
            updated_at: "2024-01-01T12:00:00Z",
          },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await recordResource.update("products", {
        set: updateData,
        where: whereCondition,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBe(2299.99);
    });
  });

  describe("vectorSearch", () => {
    it("should perform vector similarity search", async () => {
      const searchOptions = {
        vector_field: "embedding",
        query_vector: [0.1, 0.2, 0.3, 0.4],
        limit: 5,
        distance_metric: "cosine" as const,
      };

      const expectedResponse = {
        data: [
          { id: "rec-1", title: "Similar Product 1", similarity: 0.95 },
          { id: "rec-2", title: "Similar Product 2", similarity: 0.89 },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await recordResource.vectorSearch(
        "products",
        searchOptions
      );

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "POST",
        "/table-123/records/vector-search",
        searchOptions
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should validate vector search options", async () => {
      const invalidOptions = {
        vector_field: "", // Empty field name
        query_vector: [],
      };

      await expect(
        recordResource.vectorSearch("products", invalidOptions)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("aggregate", () => {
    it("should perform aggregation queries", async () => {
      const aggregateOptions = {
        groupBy: ["category_id"],
        aggregates: {
          total_price: { $sum: "price" },
          avg_price: { $avg: "price" },
          count: { $count: "*" },
        },
        where: { price: { $gt: 100 } },
      };

      const expectedResponse = {
        data: {
          results: [
            { category_id: 1, total_price: 1000, avg_price: 333.33, count: 3 },
            { category_id: 2, total_price: 500, avg_price: 250, count: 2 },
          ],
          total_groups: 2,
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await recordResource.aggregate(
        "products",
        aggregateOptions
      );

      expect(result.data.results).toHaveLength(2);
      expect(result.data.total_groups).toBe(2);
    });
  });
});
```

#### 7.2 Create Record Builder Tests

Create `tests/unit/client/resources/record-builder.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecordBuilder } from "../../../../src/client/resources/record-builder";
import { RecordResource } from "../../../../src/client/resources/record";
import { SqlResource } from "../../../../src/client/resources/sql";

vi.mock("../../../../src/client/resources/record");
vi.mock("../../../../src/client/resources/sql");

describe("RecordBuilder", () => {
  let builder: RecordBuilder;
  let mockRecordResource: any;
  let mockSqlResource: any;

  beforeEach(() => {
    mockRecordResource = {
      insert: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
      vectorSearch: vi.fn(),
    };

    mockSqlResource = {
      execute: vi.fn(),
      query: vi.fn(),
    };

    builder = new RecordBuilder(
      mockRecordResource,
      mockSqlResource,
      "products"
    );
  });

  describe("fluent interface", () => {
    it("should chain where conditions", () => {
      const result = builder.where("price", ">", 100).where({ category_id: 1 });

      expect(result).toBe(builder);
    });

    it("should chain multiple operations", () => {
      const result = builder
        .where("price", ">", 100)
        .select(["id", "title", "price"])
        .orderBy("price", "desc")
        .limit(10)
        .offset(5);

      expect(result).toBe(builder);
    });

    it("should build complex where conditions", () => {
      builder
        .where("price", "between", [100, 500])
        .where("category_id", "in", [1, 2, 3])
        .orWhere("featured", "=", true);

      // Verify internal query options are built correctly
      expect(builder).toBeDefined();
    });
  });

  describe("execute operations", () => {
    it("should execute findAll with built query options", async () => {
      const expectedOptions = {
        where: { price: { $gt: 100 } },
        fields: ["id", "title"],
        limit: 10,
      };

      builder.where("price", ">", 100).select(["id", "title"]).limit(10);

      await builder.findAll();

      expect(mockRecordResource.findAll).toHaveBeenCalledWith(
        "products",
        expectedOptions
      );
    });

    it("should execute update with where conditions and data", async () => {
      builder.where("id", "=", "rec-123").set({ price: 299.99 });

      await builder.update();

      expect(mockRecordResource.update).toHaveBeenCalledWith("products", {
        set: { price: 299.99 },
        where: { id: { $eq: "rec-123" } },
        limit: undefined,
      });
    });

    it("should execute vector search", async () => {
      const queryVector = [0.1, 0.2, 0.3];

      builder.where("category_id", "=", 1).limit(5);

      await builder.vectorSearch("embedding", queryVector, {
        distance_metric: "cosine",
        threshold: 0.8,
      });

      expect(mockRecordResource.vectorSearch).toHaveBeenCalledWith("products", {
        vector_field: "embedding",
        query_vector: queryVector,
        limit: 5,
        where: { category_id: { $eq: 1 } },
        distance_metric: "cosine",
        threshold: 0.8,
      });
    });
  });
});
```

### Task 8: Documentation and Examples

**Duration**: 1-2 days
**Priority**: Medium

#### 8.1 Create Record Operations Documentation

Create `docs/guides/record-operations.md`:

````markdown
# Record Operations

This guide covers all record/data operations in the Boltic Tables SDK.

## Inserting Records

### Single Record Insert

#### Method 1: Direct API

```typescript
const { data: record, error } = await db.record.insert("products", {
  title: "MacBook Pro",
  price: 2499.99,
  category_id: 1,
  metadata: { color: "silver", storage: "512GB" },
});
```
````

#### Method 2: Fluent Interface

```typescript
const { data: record, error } = await db.from("products").insert({
  title: "MacBook Pro",
  price: 2499.99,
  category_id: 1,
  metadata: { color: "silver", storage: "512GB" },
});
```

### Bulk Insert

#### Method 1: Direct API

```typescript
const { data: result, error } = await db.record.bulkInsert("products", {
  data: [
    { title: "iPhone 15", price: 999.99 },
    { title: "iPad Air", price: 599.99 },
  ],
  batch_size: 100,
  skip_validation: false,
});
```

#### Method 2: Fluent Interface

```typescript
const { data: result, error } = await db.from("products").bulkInsert(
  [
    { title: "iPhone 15", price: 999.99 },
    { title: "iPad Air", price: 599.99 },
  ],
  { batch_size: 100 }
);
```

## Querying Records

### Simple Queries

#### Method 1: Direct API

```typescript
const { data: products, pagination } = await db.record.findAll("products", {
  where: {
    price: { $between: [500, 2000] },
    category_id: { $in: [1, 2, 3] },
    title: { $like: "%MacBook%" },
  },
  fields: ["id", "title", "price", "created_at"],
  sort: [
    { field: "price", order: "desc" },
    { field: "created_at", order: "asc" },
  ],
  limit: 10,
  offset: 5,
});
```

#### Method 2: Fluent Interface

```typescript
const { data: products, pagination } = await db
  .from("products")
  .where("price", "between", [500, 2000])
  .where("category_id", "in", [1, 2, 3])
  .where("title", "like", "%MacBook%")
  .select(["id", "title", "price", "created_at"])
  .orderBy("price", "desc")
  .orderBy("created_at", "asc")
  .limit(10)
  .offset(5)
  .findAll();
```

### Complex Queries with OR Conditions

```typescript
const { data: products } = await db
  .from("products")
  .where("price", ">", 1000)
  .orWhere("featured", "=", true)
  .orWhere({ category_id: 1, discount: { $gt: 0.2 } })
  .findAll();
```

### Single Record Query

```typescript
// Method 1
const { data: product } = await db.record.findOne("products", {
  where: { id: "record_uuid" },
});

// Method 2
const { data: product } = await db
  .from("products")
  .where("id", "=", "record_uuid")
  .findOne();
```

## Updating Records

### Update with Conditions

#### Method 1: Direct API

```typescript
await db.record.update("products", {
  set: { price: 2299.99, updated_at: new Date() },
  where: { id: "record_uuid" },
  limit: 1,
});
```

#### Method 2: Fluent Interface

```typescript
await db
  .from("products")
  .where("id", "=", "record_uuid")
  .set({ price: 2299.99, updated_at: new Date() })
  .update();
```

### Bulk Updates

```typescript
await db.record.bulkUpdate("products", {
  data: [
    { id: "rec-1", data: { price: 999.99 } },
    { id: "rec-2", data: { price: 1299.99 } },
  ],
  batch_size: 50,
});
```

## Deleting Records

### Delete with Conditions

#### Method 1: Direct API

```typescript
await db.record.delete("products", {
  where: { id: "record_uuid" },
});
```

#### Method 2: Fluent Interface

```typescript
await db.from("products").where("id", "=", "record_uuid").delete();
```

### Bulk Delete

```typescript
await db.from("products").where("price", "<", 10).delete();
```

## Advanced Queries

### Aggregation Queries

#### Method 1: Direct API

```typescript
const { data: stats } = await db.record.aggregate("orders", {
  groupBy: ["status"],
  aggregates: {
    total_amount: { $sum: "amount" },
    avg_amount: { $avg: "amount" },
    order_count: { $count: "*" },
  },
  where: { created_at: { $gte: "2024-01-01" } },
});
```

#### Method 2: Fluent Interface

```typescript
const { data: stats } = await db
  .from("orders")
  .where("created_at", ">=", "2024-01-01")
  .groupBy(["status"])
  .aggregate({
    total_amount: { $sum: "amount" },
    avg_amount: { $avg: "amount" },
    order_count: { $count: "*" },
  })
  .aggregateQuery();
```

### Vector Similarity Search

#### Method 1: Direct API

```typescript
const { data: similarProducts } = await db.record.vectorSearch(
  "recommendations",
  {
    vector_field: "embedding",
    query_vector: [0.1, 0.2, 0.3 /* ... 1536 dimensions */],
    distance_metric: "cosine",
    threshold: 0.8,
    limit: 10,
  }
);
```

#### Method 2: Fluent Interface

```typescript
const { data: similarProducts } = await db
  .from("recommendations")
  .where("category_id", "=", 1)
  .limit(10)
  .vectorSearch("embedding", queryVector, {
    distance_metric: "cosine",
    threshold: 0.8,
  });
```

## SQL Queries

### Direct SQL Execution

#### Method 1: Direct API

```typescript
const { data: results } = await db.sql.execute({
  query: "SELECT * FROM products WHERE price > $1",
  params: [1000],
});
```

#### Method 2: Fluent Interface

```typescript
const { data: results } = await db
  .sql()
  .query("SELECT * FROM products WHERE price > $1")
  .params([1000])
  .execute();
```

### Complex Analytical Queries

```typescript
const { data: analytics } = await db.sql.execute({
  query: `
    SELECT
      DATE_TRUNC('month', created_at) as month,
      category_id,
      COUNT(*) as product_count,
      AVG(price) as avg_price
    FROM products
    WHERE created_at >= $1
    GROUP BY month, category_id
    ORDER BY month DESC, avg_price DESC
  `,
  params: ["2024-01-01"],
});
```

### Named Parameters

```typescript
const { data: userOrders } = await db.sql.queryWithParams(
  `
  SELECT o.*, p.title as product_title
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.user_id = :userId
    AND o.status = :status
    AND o.created_at >= :startDate
`,
  {
    userId: "user123",
    status: "completed",
    startDate: "2024-01-01",
  }
);
```

## Performance Optimization

### Using Helper Utilities

```typescript
import { RecordHelpers } from "@boltic/database-js/utils";

// Batch large operations
const batches = RecordHelpers.batchRecords(largeDataset, 100);
for (const batch of batches) {
  await db.record.bulkInsert("products", { data: batch });
}

// Sanitize record data
const cleanData = RecordHelpers.sanitizeRecord(userInput);

// Optimize queries
const optimizedQuery = RecordHelpers.optimizeQuery(queryOptions);
```

### Caching Strategies

```typescript
// Enable result counting for pagination
const { data: products, pagination } = await db
  .from("products")
  .withCount()
  .limit(20)
  .findAll();

// Cache expensive aggregations
const cacheKey = "monthly_sales_stats";
let stats = await cache.get(cacheKey);
if (!stats) {
  stats = await db.record.aggregate("orders", {
    groupBy: ["month"],
    aggregates: { total: { $sum: "amount" } },
  });
  await cache.set(cacheKey, stats, 300000); // 5 minutes
}
```

## Error Handling

```typescript
try {
  const result = await db.record.insert("products", recordData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation errors:", error.failures);
  } else if (error instanceof ApiError) {
    console.log("API error:", error.statusCode, error.message);
  }
}
```

## Best Practices

### Data Validation

- Always validate record data before insertion
- Use schema helpers for consistent field definitions
- Sanitize user input to prevent injection attacks

### Performance

- Use bulk operations for large datasets
- Implement proper pagination for large result sets
- Cache frequently accessed data
- Use appropriate indexes for where conditions

### Query Optimization

- Limit result sets to necessary data
- Use field selection to reduce payload size
- Implement proper sorting and filtering
- Use aggregations for statistical queries

### Vector Search

- Ensure vector dimensions match field definitions
- Use appropriate distance metrics for your use case
- Implement proper error handling for vector operations
- Cache vector search results when appropriate

```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation
- [ ] RecordResource class with all CRUD operations
- [ ] SqlResource class with query execution
- [ ] Both Method 1 (direct) and Method 2 (fluent) interfaces working
- [ ] Vector search and aggregation functionality

### ✅ Advanced Features
- [ ] Bulk operations (insert, update, delete)
- [ ] Complex query building with operators
- [ ] SQL query interface with parameter binding
- [ ] Vector similarity search implementation
- [ ] Aggregation queries with grouping

### ✅ Validation & Error Handling
- [ ] Input validation for all record operations
- [ ] SQL injection prevention
- [ ] Type-safe query building
- [ ] Comprehensive error handling for all scenarios

### ✅ Performance & Caching
- [ ] Intelligent caching for queries and results
- [ ] Bulk operation optimization
- [ ] Query performance optimization
- [ ] Helper utilities for data processing

### ✅ Integration
- [ ] Seamless integration with BolticClient
- [ ] Table and database context awareness
- [ ] Cache integration with proper invalidation
- [ ] Full fluent interface support

### ✅ Type Safety
- [ ] Complete TypeScript definitions for all operations
- [ ] Generic type support for record data
- [ ] Type-safe query operators and conditions
- [ ] IntelliSense support for all record operations

### ✅ Testing
- [ ] Unit tests for RecordResource and SqlResource
- [ ] Fluent interface functionality tests
- [ ] Helper utility tests
- [ ] Integration tests with full workflow

### ✅ Documentation
- [ ] API documentation with comprehensive examples
- [ ] Query building guides and best practices
- [ ] Performance optimization recommendations
- [ ] Vector search and aggregation guides

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Full error messages, query examples, and reproduction steps
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:
- **API Integration Agent** (can start mapping all SDK methods to actual API endpoints)
- **Testing Infrastructure Agent** (can begin comprehensive testing)
- **Documentation Agent** (can start generating complete documentation)

## Critical Notes

- **ENSURE** both Method 1 and Method 2 APIs work identically
- **VALIDATE** all data input and SQL queries for security
- **TEST** all query operators and complex conditions
- **OPTIMIZE** performance for large datasets
- **CACHE** intelligently with proper invalidation strategies

Remember: Record operations are the primary interface users will interact with. Performance, security, and usability are critical for success.
```
