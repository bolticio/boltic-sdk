# Database Operations Agent Instructions

## Agent Role and Responsibility

You are the **Database Operations Agent** responsible for implementing all database management operations for the Boltic Tables SDK. Your mission is to create comprehensive database CRUD functionality, support both direct and fluent API styles, handle database context switching, and provide robust error handling and caching.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Core Infrastructure Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for database operation requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known database operation issues

## Dependencies

This agent depends on the **Core Infrastructure Agent** completion. Verify these exist:

- BaseResource class and operation interfaces
- BolticClient with HTTP client infrastructure
- Authentication and error handling systems
- Cache infrastructure
- TypeScript type definitions

## Primary Tasks

### Task 1: Database Type Definitions

**Duration**: 1 day
**Priority**: Critical

#### 1.1 Create Database API Types

Create `src/types/api/database.ts`:

```typescript
export interface DatabaseCreateRequest {
  name: string;
  slug: string;
  resource_id?: string;
  description?: string;
}

export interface DatabaseUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

export interface DatabaseRecord {
  id: string;
  name: string;
  slug: string;
  db_name: string; // Internal database name (bt_{account_id}_{slug})
  resource_id?: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  table_count?: number;
  size_mb?: number;
}

export interface DatabaseQueryOptions {
  where?: {
    name?: string;
    slug?: string;
    created_by?: string;
    is_active?: boolean;
    created_at?: {
      $gte?: string;
      $lte?: string;
      $between?: [string, string];
    };
  };
  fields?: Array<keyof DatabaseRecord>;
  sort?: Array<{
    field: keyof DatabaseRecord;
    order: "asc" | "desc";
  }>;
  limit?: number;
  offset?: number;
}

export interface DatabaseDeleteOptions {
  where: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface DatabaseListResponse {
  databases: DatabaseRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

### Task 2: Database Resource Implementation (Method 1)

**Duration**: 2-3 days
**Priority**: Critical

#### 2.1 Create Database Resource Class

Create `src/client/resources/database.ts`:

```typescript
import { BaseResource, ApiResponse, QueryOptions } from "../core/base-resource";
import { BaseClient } from "../core/base-client";
import {
  DatabaseCreateRequest,
  DatabaseUpdateRequest,
  DatabaseRecord,
  DatabaseQueryOptions,
  DatabaseDeleteOptions,
  DatabaseListResponse,
} from "../../types/api/database";
import { ValidationError } from "../../errors/validation-error";
import { ApiError } from "../../errors/api-error";

export class DatabaseResource extends BaseResource {
  constructor(client: BaseClient) {
    super(client, "/v1/tables/databases");
  }

  /**
   * Create a new database
   */
  async create(
    data: DatabaseCreateRequest
  ): Promise<ApiResponse<DatabaseRecord>> {
    this.validateCreateRequest(data);

    try {
      const response = await this.makeRequest<DatabaseRecord>("POST", "", data);

      // Cache the created database
      if (this.client.getCache && response.data) {
        const cache = this.client.getCache();
        if (cache) {
          await cache.set(
            cache.generateKey("database", "id", response.data.id),
            response.data,
            300000 // 5 minutes
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        throw new ValidationError("Database already exists", [
          {
            field: "slug",
            message: "A database with this slug already exists",
          },
        ]);
      }
      throw error;
    }
  }

  /**
   * Find multiple databases with filtering and pagination
   */
  async findAll(
    options: DatabaseQueryOptions = {}
  ): Promise<ApiResponse<DatabaseRecord[]> & { pagination?: any }> {
    const cacheKey = this.generateCacheKey("findAll", options);

    // Check cache first
    if (this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cached = await cache.get<
          ApiResponse<DatabaseRecord[]> & { pagination?: any }
        >(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    const queryParams = this.buildQueryParams(options);
    const response = await this.makeRequest<DatabaseListResponse>(
      "GET",
      "",
      undefined,
      { params: queryParams }
    );

    // Transform response to match expected format
    const result = {
      data: response.data?.databases || [],
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
   * Find a single database
   */
  async findOne(
    options: DatabaseQueryOptions
  ): Promise<ApiResponse<DatabaseRecord | null>> {
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

    // Check cache first if querying by ID
    if (options.where.id && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        const cacheKey = cache.generateKey("database", "id", options.where.id);
        const cached = await cache.get<DatabaseRecord>(cacheKey);
        if (cached) {
          return { data: cached };
        }
      }
    }

    const queryParams = this.buildQueryParams({ ...options, limit: 1 });
    const response = await this.makeRequest<DatabaseListResponse>(
      "GET",
      "",
      undefined,
      { params: queryParams }
    );

    const database = response.data?.databases?.[0] || null;
    const result = {
      data: database,
      error: response.error,
    };

    // Cache the result if found
    if (database && this.client.getCache) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.set(
          cache.generateKey("database", "id", database.id),
          database,
          300000 // 5 minutes
        );
      }
    }

    return result;
  }

  /**
   * Update a database
   */
  async update(
    identifier: string | DatabaseQueryOptions,
    data?: DatabaseUpdateRequest
  ): Promise<ApiResponse<DatabaseRecord>> {
    let updateData: DatabaseUpdateRequest;
    let whereClause: any;

    if (typeof identifier === "string") {
      // Update by ID
      updateData = data!;
      whereClause = { id: identifier };
    } else {
      // Update with where clause (not typically used for databases)
      throw new ValidationError("Database updates must specify a database ID", [
        { field: "identifier", message: "Database ID is required for updates" },
      ]);
    }

    this.validateUpdateRequest(updateData);

    const response = await this.makeRequest<DatabaseRecord>(
      "PUT",
      `/${whereClause.id}`,
      updateData
    );

    // Invalidate cache
    if (this.client.getCache && response.data) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(
          cache.generateKey("database", "id", response.data.id)
        );
        // Also clear list caches
        await this.invalidateListCaches();
      }
    }

    return response;
  }

  /**
   * Delete a database
   */
  async delete(
    options: DatabaseDeleteOptions | string
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    let whereClause: any;

    if (typeof options === "string") {
      whereClause = { id: options };
    } else {
      whereClause = options.where;
    }

    if (!whereClause.id && !whereClause.name && !whereClause.slug) {
      throw new ValidationError(
        "Delete operation requires database ID, name, or slug",
        [
          {
            field: "where",
            message: "At least one identifier (id, name, or slug) is required",
          },
        ]
      );
    }

    // Find the database first to get the ID for cache invalidation
    let databaseId: string | undefined;
    if (whereClause.id) {
      databaseId = whereClause.id;
    } else {
      const findResult = await this.findOne({ where: whereClause });
      databaseId = findResult.data?.id;
    }

    const endpoint = whereClause.id ? `/${whereClause.id}` : "";
    const params = whereClause.id ? {} : whereClause;

    const response = await this.makeRequest<{
      success: boolean;
      message?: string;
    }>("DELETE", endpoint, undefined, { params });

    // Invalidate cache
    if (this.client.getCache && databaseId) {
      const cache = this.client.getCache();
      if (cache) {
        await cache.delete(cache.generateKey("database", "id", databaseId));
        await this.invalidateListCaches();
      }
    }

    return response;
  }

  /**
   * Get database statistics
   */
  async getStats(databaseId: string): Promise<
    ApiResponse<{
      table_count: number;
      total_records: number;
      size_mb: number;
      last_updated: string;
    }>
  > {
    const cacheKey = this.generateCacheKey("stats", { id: databaseId });

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

    const response = await this.makeRequest("GET", `/${databaseId}/stats`);

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
  private validateCreateRequest(data: DatabaseCreateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: "name", message: "Database name is required" });
    }

    if (!data.slug || data.slug.trim().length === 0) {
      errors.push({ field: "slug", message: "Database slug is required" });
    } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
      errors.push({
        field: "slug",
        message:
          "Slug can only contain lowercase letters, numbers, hyphens, and underscores",
      });
    }

    if (data.description && data.description.length > 500) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 500 characters",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Database creation validation failed", errors);
    }
  }

  private validateUpdateRequest(data: DatabaseUpdateRequest): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (
      data.name !== undefined &&
      (!data.name || data.name.trim().length === 0)
    ) {
      errors.push({ field: "name", message: "Database name cannot be empty" });
    }

    if (
      data.slug !== undefined &&
      (!data.slug || !/^[a-z0-9-_]+$/.test(data.slug))
    ) {
      errors.push({
        field: "slug",
        message:
          "Slug can only contain lowercase letters, numbers, hyphens, and underscores",
      });
    }

    if (data.description !== undefined && data.description.length > 500) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 500 characters",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Database update validation failed", errors);
    }
  }

  private generateCacheKey(operation: string, params?: any): string {
    if (!this.client.getCache) return "";
    const cache = this.client.getCache()!;
    const paramsStr = params ? JSON.stringify(params) : "";
    return cache.generateKey("database", operation, paramsStr);
  }

  private async invalidateListCaches(): Promise<void> {
    if (!this.client.getCache) return;
    const cache = this.client.getCache()!;
    // In a real implementation, you'd have a more sophisticated cache invalidation strategy
    // For now, we'll just clear all findAll caches by pattern
    await cache.clear(); // This is a simple approach - in production, use more targeted invalidation
  }

  protected buildQueryParams(
    options: DatabaseQueryOptions = {}
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
            // Handle complex operators like $gte, $lte, etc.
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

### Task 3: Database Fluent Interface (Method 2)

**Duration**: 2-3 days
**Priority**: Critical

#### 3.1 Create Database Fluent Builder

Create `src/client/resources/database-builder.ts`:

```typescript
import { DatabaseResource } from "./database";
import {
  DatabaseCreateRequest,
  DatabaseUpdateRequest,
  DatabaseRecord,
  DatabaseQueryOptions,
  DatabaseDeleteOptions,
} from "../../types/api/database";
import { ApiResponse } from "../core/base-resource";

export class DatabaseBuilder {
  private databaseResource: DatabaseResource;
  private queryOptions: DatabaseQueryOptions = {};
  private updateData: DatabaseUpdateRequest = {};

  constructor(databaseResource: DatabaseResource) {
    this.databaseResource = databaseResource;
  }

  /**
   * Add where conditions to the query
   */
  where(conditions: DatabaseQueryOptions["where"]): DatabaseBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Specify fields to select
   */
  fields(fieldList: Array<keyof DatabaseRecord>): DatabaseBuilder {
    this.queryOptions.fields = fieldList;
    return this;
  }

  /**
   * Add sorting to the query
   */
  sort(
    sortOptions: Array<{ field: keyof DatabaseRecord; order: "asc" | "desc" }>
  ): DatabaseBuilder {
    this.queryOptions.sort = [
      ...(this.queryOptions.sort || []),
      ...sortOptions,
    ];
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): DatabaseBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): DatabaseBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set update data
   */
  set(data: DatabaseUpdateRequest): DatabaseBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute create operation
   */
  async create(
    data: DatabaseCreateRequest
  ): Promise<ApiResponse<DatabaseRecord>> {
    return this.databaseResource.create(data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<
    ApiResponse<DatabaseRecord[]> & { pagination?: any }
  > {
    return this.databaseResource.findAll(this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<DatabaseRecord | null>> {
    return this.databaseResource.findOne(this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<DatabaseRecord>> {
    if (
      !this.queryOptions.where ||
      Object.keys(this.queryOptions.where).length === 0
    ) {
      throw new Error("Update operation requires where conditions");
    }

    // For database updates, we typically need an ID
    const idCondition = this.queryOptions.where.id;
    if (!idCondition) {
      throw new Error("Database updates require an ID in the where clause");
    }

    return this.databaseResource.update(idCondition, this.updateData);
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    if (
      !this.queryOptions.where ||
      Object.keys(this.queryOptions.where).length === 0
    ) {
      throw new Error("Delete operation requires where conditions");
    }

    return this.databaseResource.delete({ where: this.queryOptions.where });
  }

  /**
   * Reset builder to initial state
   */
  reset(): DatabaseBuilder {
    this.queryOptions = {};
    this.updateData = {};
    return this;
  }
}
```

### Task 4: Database Context Management

**Duration**: 1-2 days
**Priority**: High

#### 4.1 Create Database Context Manager

Create `src/client/core/database-context.ts`:

```typescript
import { DatabaseRecord } from "../../types/api/database";
import { BolticClient } from "../boltic-client";

export class DatabaseContext {
  private selectedDatabase: DatabaseRecord | null = null;
  private client: BolticClient;

  constructor(client: BolticClient) {
    this.client = client;
  }

  /**
   * Select a database by ID, name, or slug
   */
  async useDatabase(identifier: string): Promise<DatabaseContext> {
    const databaseResource = new (
      await import("./resources/database")
    ).DatabaseResource(this.client.getHttpClient());

    // Try to find the database
    let database: DatabaseRecord | null = null;

    // First try by ID (UUID format)
    if (this.isUUID(identifier)) {
      const result = await databaseResource.findOne({
        where: { id: identifier },
      });
      database = result.data;
    }

    // If not found, try by name or slug
    if (!database) {
      const nameResult = await databaseResource.findOne({
        where: { name: identifier },
      });
      if (nameResult.data) {
        database = nameResult.data;
      } else {
        const slugResult = await databaseResource.findOne({
          where: { slug: identifier },
        });
        database = slugResult.data;
      }
    }

    if (!database) {
      throw new Error(`Database not found: ${identifier}`);
    }

    this.selectedDatabase = database;
    return this;
  }

  /**
   * Get the currently selected database
   */
  getCurrentDatabase(): DatabaseRecord | null {
    return this.selectedDatabase ? { ...this.selectedDatabase } : null;
  }

  /**
   * Check if a database is currently selected
   */
  hasSelectedDatabase(): boolean {
    return this.selectedDatabase !== null;
  }

  /**
   * Clear the selected database
   */
  clearSelection(): void {
    this.selectedDatabase = null;
  }

  /**
   * Get the database ID for API calls
   */
  getDatabaseId(): string | null {
    return this.selectedDatabase?.id || null;
  }

  /**
   * Get the internal database name (bt_{account_id}_{slug})
   */
  getInternalDatabaseName(): string | null {
    return this.selectedDatabase?.db_name || null;
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
```

### Task 5: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 5.1 Update BolticClient for Database Operations

Update `src/client/boltic-client.ts` to add database operations:

```typescript
// Add imports at the top
import { DatabaseResource } from "./resources/database";
import { DatabaseBuilder } from "./resources/database-builder";
import { DatabaseContext } from "./core/database-context";

// Add to the BolticClient class:

export class BolticClient {
  // ... existing code ...

  private databaseResource: DatabaseResource;
  private databaseContext: DatabaseContext;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // ... existing initialization code ...

    // Initialize database operations
    this.databaseResource = new DatabaseResource(this.baseClient);
    this.databaseContext = new DatabaseContext(this);
  }

  // Method 1: Direct database operations
  get database() {
    return {
      create: (data: any) => this.databaseResource.create(data),
      findAll: (options?: any) => this.databaseResource.findAll(options),
      findOne: (options: any) => this.databaseResource.findOne(options),
      update: (identifier: any, data?: any) =>
        this.databaseResource.update(identifier, data),
      delete: (options: any) => this.databaseResource.delete(options),
      getStats: (id: string) => this.databaseResource.getStats(id),
    };
  }

  // Method 2: Fluent database operations
  database(): DatabaseBuilder {
    return new DatabaseBuilder(this.databaseResource);
  }

  // Database context management
  async useDatabase(identifier: string): Promise<BolticClient> {
    await this.databaseContext.useDatabase(identifier);
    return this;
  }

  getCurrentDatabase() {
    return this.databaseContext.getCurrentDatabase();
  }

  getDatabaseContext(): DatabaseContext {
    return this.databaseContext;
  }

  // ... rest of existing code ...
}
```

### Task 6: Database Utilities and Helpers

**Duration**: 1 day
**Priority**: Medium

#### 6.1 Create Database Utilities

Create `src/utils/database/helpers.ts`:

```typescript
import { DatabaseRecord } from "../../types/api/database";

export class DatabaseHelpers {
  /**
   * Generate internal database name from account ID and slug
   */
  static generateInternalName(accountId: string, slug: string): string {
    return `bt_${accountId}_${slug}`;
  }

  /**
   * Extract account ID from internal database name
   */
  static extractAccountId(internalName: string): string | null {
    const match = internalName.match(/^bt_([^_]+)_/);
    return match ? match[1] : null;
  }

  /**
   * Extract slug from internal database name
   */
  static extractSlug(internalName: string): string | null {
    const match = internalName.match(/^bt_[^_]+_(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * Validate database slug format
   */
  static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-_]+$/.test(slug);
  }

  /**
   * Format database for display
   */
  static formatForDisplay(database: DatabaseRecord): {
    id: string;
    name: string;
    slug: string;
    status: "active" | "inactive";
    createdAt: Date;
    tableCount: number;
    sizeMB: number;
  } {
    return {
      id: database.id,
      name: database.name,
      slug: database.slug,
      status: database.is_active ? "active" : "inactive",
      createdAt: new Date(database.created_at),
      tableCount: database.table_count || 0,
      sizeMB: database.size_mb || 0,
    };
  }

  /**
   * Sort databases by various criteria
   */
  static sortDatabases(
    databases: DatabaseRecord[],
    criteria: "name" | "created_at" | "size" | "table_count",
    order: "asc" | "desc" = "asc"
  ): DatabaseRecord[] {
    const sorted = [...databases].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (criteria) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "size":
          aValue = a.size_mb || 0;
          bValue = b.size_mb || 0;
          break;
        case "table_count":
          aValue = a.table_count || 0;
          bValue = b.table_count || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }
}
```

### Task 7: Comprehensive Testing

**Duration**: 2-3 days
**Priority**: High

#### 7.1 Create Database Resource Tests

Create `tests/unit/client/resources/database.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DatabaseResource } from "../../../../src/client/resources/database";
import { BaseClient } from "../../../../src/client/core/base-client";
import { ValidationError } from "../../../../src/errors/validation-error";

// Mock the BaseClient
vi.mock("../../../../src/client/core/base-client");

describe("DatabaseResource", () => {
  let databaseResource: DatabaseResource;
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
    };

    databaseResource = new DatabaseResource(mockClient as BaseClient);
  });

  describe("create", () => {
    it("should create a database successfully", async () => {
      const createData = {
        name: "Test Database",
        slug: "test-database",
        description: "A test database",
      };

      const expectedResponse = {
        data: {
          id: "db-123",
          name: "Test Database",
          slug: "test-database",
          db_name: "bt_account_test-database",
          description: "A test database",
          is_active: true,
          created_by: "user@example.com",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      };

      mockClient.makeRequest = vi.fn().mockResolvedValue(expectedResponse);

      const result = await databaseResource.create(createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "POST",
        "",
        createData
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        name: "",
        slug: "test-database",
      };

      await expect(databaseResource.create(invalidData as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("should validate slug format", async () => {
      const invalidData = {
        name: "Test Database",
        slug: "Invalid Slug!",
      };

      await expect(databaseResource.create(invalidData)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("findAll", () => {
    it("should retrieve databases with pagination", async () => {
      const mockResponse = {
        data: {
          databases: [
            { id: "db-1", name: "Database 1", slug: "db-1" },
            { id: "db-2", name: "Database 2", slug: "db-2" },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1,
          },
        },
      };

      mockClient.makeRequest = vi.fn().mockResolvedValue(mockResponse);

      const result = await databaseResource.findAll({
        where: { is_active: true },
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should find a single database", async () => {
      const mockResponse = {
        data: {
          databases: [{ id: "db-1", name: "Database 1", slug: "db-1" }],
        },
      };

      mockClient.makeRequest = vi.fn().mockResolvedValue(mockResponse);

      const result = await databaseResource.findOne({
        where: { id: "db-1" },
      });

      expect(result.data).toEqual(mockResponse.data.databases[0]);
    });

    it("should require where conditions", async () => {
      await expect(databaseResource.findOne({} as any)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("update", () => {
    it("should update a database", async () => {
      const updateData = { name: "Updated Database Name" };
      const expectedResponse = {
        data: {
          id: "db-123",
          name: "Updated Database Name",
          slug: "test-database",
        },
      };

      mockClient.makeRequest = vi.fn().mockResolvedValue(expectedResponse);

      const result = await databaseResource.update("db-123", updateData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "PUT",
        "/db-123",
        updateData
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe("delete", () => {
    it("should delete a database by ID", async () => {
      const expectedResponse = {
        data: { success: true, message: "Database deleted successfully" },
      };

      mockClient.makeRequest = vi.fn().mockResolvedValue(expectedResponse);

      const result = await databaseResource.delete("db-123");

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "DELETE",
        "/db-123",
        undefined,
        { params: {} }
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
```

#### 7.2 Create Database Builder Tests

Create `tests/unit/client/resources/database-builder.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DatabaseBuilder } from "../../../../src/client/resources/database-builder";
import { DatabaseResource } from "../../../../src/client/resources/database";

vi.mock("../../../../src/client/resources/database");

describe("DatabaseBuilder", () => {
  let builder: DatabaseBuilder;
  let mockDatabaseResource: any;

  beforeEach(() => {
    mockDatabaseResource = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    builder = new DatabaseBuilder(mockDatabaseResource as DatabaseResource);
  });

  describe("fluent interface", () => {
    it("should chain where conditions", () => {
      const result = builder.where({ name: "test" }).where({ is_active: true });

      expect(result).toBe(builder);
    });

    it("should chain multiple operations", () => {
      const result = builder
        .where({ is_active: true })
        .fields(["id", "name", "slug"])
        .sort([{ field: "name", order: "asc" }])
        .limit(10)
        .offset(5);

      expect(result).toBe(builder);
    });
  });

  describe("execute operations", () => {
    it("should execute findAll with built query options", async () => {
      const expectedOptions = {
        where: { is_active: true },
        fields: ["id", "name"],
        limit: 10,
      };

      builder.where({ is_active: true }).fields(["id", "name"]).limit(10);

      await builder.findAll();

      expect(mockDatabaseResource.findAll).toHaveBeenCalledWith(
        expectedOptions
      );
    });

    it("should execute update with where conditions and data", async () => {
      builder.where({ id: "db-123" }).set({ name: "Updated Name" });

      await builder.update();

      expect(mockDatabaseResource.update).toHaveBeenCalledWith("db-123", {
        name: "Updated Name",
      });
    });
  });
});
```

#### 7.3 Create Integration Tests

Create `tests/integration/database-operations.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createTestClient } from "../../src/testing/test-client";
import { BolticClient } from "../../src/client/boltic-client";

describe("Database Operations Integration", () => {
  let client: BolticClient;

  beforeEach(() => {
    client = createTestClient({
      apiKey: "test-api-key",
      environment: "local",
    });
  });

  describe("Method 1: Direct operations", () => {
    it("should support direct database operations", async () => {
      // This test would require actual API mocking or test server
      expect(client.database).toBeDefined();
      expect(client.database.create).toBeTypeOf("function");
      expect(client.database.findAll).toBeTypeOf("function");
      expect(client.database.findOne).toBeTypeOf("function");
      expect(client.database.update).toBeTypeOf("function");
      expect(client.database.delete).toBeTypeOf("function");
    });
  });

  describe("Method 2: Fluent interface", () => {
    it("should support fluent database operations", () => {
      const builder = client.database();
      expect(builder).toBeDefined();
      expect(builder.where).toBeTypeOf("function");
      expect(builder.fields).toBeTypeOf("function");
      expect(builder.sort).toBeTypeOf("function");
      expect(builder.limit).toBeTypeOf("function");
      expect(builder.offset).toBeTypeOf("function");
    });
  });

  describe("Database context management", () => {
    it("should support database selection", async () => {
      expect(client.useDatabase).toBeTypeOf("function");
      expect(client.getCurrentDatabase).toBeTypeOf("function");
      expect(client.getDatabaseContext).toBeTypeOf("function");
    });
  });
});
```

### Task 8: Documentation and Examples

**Duration**: 1 day
**Priority**: Medium

#### 8.1 Create Database Operations Documentation

Create `docs/guides/database-operations.md`:

````markdown
# Database Operations

This guide covers all database management operations in the Boltic Tables SDK.

## Creating Databases

### Method 1: Direct API

```typescript
const { data: database, error } = await boltic.database.create({
  name: "Analytics Database",
  slug: "analytics-db",
  description: "Database for analytics data",
  resource_id: "connector_123", // Optional
});
```
````

### Method 2: Fluent Interface

```typescript
const { data: database, error } = await boltic.database().create({
  name: "Analytics Database",
  slug: "analytics-db",
  description: "Database for analytics data",
});
```

## Listing Databases

### Method 1: Direct API

```typescript
const { data: databases, pagination } = await boltic.database.findAll({
  where: { is_active: true },
  fields: ["id", "name", "slug", "created_at"],
  sort: [{ field: "created_at", order: "desc" }],
  limit: 20,
  offset: 0,
});
```

### Method 2: Fluent Interface

```typescript
const { data: databases, pagination } = await boltic
  .database()
  .where({ is_active: true })
  .fields(["id", "name", "slug", "created_at"])
  .sort([{ field: "created_at", order: "desc" }])
  .limit(20)
  .offset(0)
  .findAll();
```

## Finding Single Database

### Method 1: Direct API

```typescript
const { data: database } = await boltic.database.findOne({
  where: { slug: "analytics-db" },
});
```

### Method 2: Fluent Interface

```typescript
const { data: database } = await boltic
  .database()
  .where({ slug: "analytics-db" })
  .findOne();
```

## Database Context Switching

```typescript
// Select a database for subsequent operations
await boltic.useDatabase("analytics-db");

// Get current database
const currentDb = boltic.getCurrentDatabase();

// All subsequent table/record operations will use this database
```

## Error Handling

```typescript
try {
  const result = await boltic.database.create({
    name: "Test DB",
    slug: "test-db",
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation errors:", error.failures);
  } else if (error instanceof ApiError) {
    console.log("API error:", error.statusCode, error.message);
  }
}
```

Remember: Database operations are the foundation for all other table and record operations. Reliability and performance are critical.
