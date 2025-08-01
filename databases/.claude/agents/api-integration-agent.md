# API Integration Agent Instructions

## Agent Role and Responsibility

You are the **API Integration Agent** responsible for implementing the actual HTTP communication layer that connects the Boltic Tables SDK to the real Boltic Tables API endpoints. Your mission is to create robust API endpoint mappings, implement authentication and headers management, handle environment-based routing, create resolver/transformation functions, and ensure seamless integration with the actual service infrastructure.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Record Operations Agent has completed ALL tasks
2. **Consult Documentation**: Read `/Docs/Implementation.md` for API integration requirements
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known API integration issues
5. **Review PRD**: Study the API endpoints and authentication details in `PRD.md`

## Dependencies

This agent depends on ALL previous agents completion. Verify these exist:

- Complete SDK client infrastructure (BaseClient, HTTP adapters)
- All resource classes (Database, Table, Column, Record, SQL)
- Authentication and configuration management
- Error handling and caching systems
- Type definitions for all API operations

## Primary Tasks

### Task 1: API Endpoint Mapping and Configuration

**Duration**: 2-3 days
**Priority**: Critical

#### 1.1 Create API Endpoint Registry

Create `src/api/endpoints.ts`:

```typescript
export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  authenticated: boolean;
  cached?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface ApiEndpoints {
  // Database endpoints
  databases: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    find: ApiEndpoint;
    update: ApiEndpoint;
    delete: ApiEndpoint;
  };

  // Table endpoints
  tables: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    find: ApiEndpoint;
    update: ApiEndpoint;
    rename: ApiEndpoint;
    setAccess: ApiEndpoint;
    delete: ApiEndpoint;
  };

  // Column/Field endpoints
  fields: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    find: ApiEndpoint;
    update: ApiEndpoint;
    delete: ApiEndpoint;
  };

  // Record endpoints
  records: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    bulkCreate: ApiEndpoint;
    find: ApiEndpoint;
    update: ApiEndpoint;
    bulkUpdate: ApiEndpoint;
    delete: ApiEndpoint;
    aggregate: ApiEndpoint;
    vectorSearch: ApiEndpoint;
  };

  // SQL endpoints
  sql: {
    execute: ApiEndpoint;
  };

  // Transfer endpoints
  transfer: {
    export: ApiEndpoint;
    import: ApiEndpoint;
  };
}

export const API_ENDPOINTS: ApiEndpoints = {
  databases: {
    list: {
      path: "/v1/tables/databases",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 100, window: 60000 },
    },
    create: {
      path: "/v1/tables/databases",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    find: {
      path: "/v1/tables/databases",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 200, window: 60000 },
    },
    update: {
      path: "/v1/tables/databases/{id}",
      method: "PATCH",
      authenticated: true,
      cached: false,
    },
    delete: {
      path: "/v1/tables/databases/{id}",
      method: "DELETE",
      authenticated: true,
      cached: false,
    },
  },

  tables: {
    list: {
      path: "/v1/tables",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 200, window: 60000 },
    },
    create: {
      path: "/v1/tables",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    find: {
      path: "/v1/tables/{id}",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 300, window: 60000 },
    },
    update: {
      path: "/v1/tables/{id}",
      method: "PATCH",
      authenticated: true,
      cached: false,
    },
    rename: {
      path: "/v1/tables/{id}/rename",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    setAccess: {
      path: "/v1/tables/{id}/access",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    delete: {
      path: "/v1/tables/{id}",
      method: "DELETE",
      authenticated: true,
      cached: false,
    },
  },

  fields: {
    list: {
      path: "/v1/tables/{table_id}/fields",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 300, window: 60000 },
    },
    create: {
      path: "/v1/tables/{table_id}/fields",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    find: {
      path: "/v1/tables/{table_id}/fields/{field_id}",
      method: "GET",
      authenticated: true,
      cached: true,
    },
    update: {
      path: "/v1/tables/{table_id}/fields/{field_id}",
      method: "PATCH",
      authenticated: true,
      cached: false,
    },
    delete: {
      path: "/v1/tables/{table_id}/fields/{field_id}",
      method: "DELETE",
      authenticated: true,
      cached: false,
    },
  },

  records: {
    list: {
      path: "/v1/tables/{table_id}/records",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 500, window: 60000 },
    },
    create: {
      path: "/v1/tables/{table_id}/records",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    bulkCreate: {
      path: "/v1/tables/{table_id}/records/bulk",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    find: {
      path: "/v1/tables/{table_id}/records/{record_id}",
      method: "GET",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 1000, window: 60000 },
    },
    update: {
      path: "/v1/tables/{table_id}/records",
      method: "PATCH",
      authenticated: true,
      cached: false,
    },
    bulkUpdate: {
      path: "/v1/tables/{table_id}/records/bulk",
      method: "PATCH",
      authenticated: true,
      cached: false,
    },
    delete: {
      path: "/v1/tables/{table_id}/records",
      method: "DELETE",
      authenticated: true,
      cached: false,
    },
    aggregate: {
      path: "/v1/tables/{table_id}/records/aggregate",
      method: "POST",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 100, window: 60000 },
    },
    vectorSearch: {
      path: "/v1/tables/{table_id}/records/vector-search",
      method: "POST",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 200, window: 60000 },
    },
  },

  sql: {
    execute: {
      path: "/v1/tables/query",
      method: "POST",
      authenticated: true,
      cached: true,
      rateLimit: { requests: 50, window: 60000 },
    },
  },

  transfer: {
    export: {
      path: "/v1/tables/transfer/export",
      method: "POST",
      authenticated: true,
      cached: false,
    },
    import: {
      path: "/v1/tables/transfer/import",
      method: "POST",
      authenticated: true,
      cached: false,
    },
  },
};

export const getEndpoint = (
  category: keyof ApiEndpoints,
  operation: string
): ApiEndpoint => {
  const categoryEndpoints = API_ENDPOINTS[category] as any;
  const endpoint = categoryEndpoints[operation];

  if (!endpoint) {
    throw new Error(`Endpoint not found: ${category}.${operation}`);
  }

  return endpoint;
};

export const buildEndpointPath = (
  endpoint: ApiEndpoint,
  params: Record<string, string> = {}
): string => {
  let path = endpoint.path;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  });

  // Check for unreplaced parameters
  const unreplacedParams = path.match(/\{([^}]+)\}/g);
  if (unreplacedParams) {
    throw new Error(`Missing path parameters: ${unreplacedParams.join(", ")}`);
  }

  return path;
};
```

#### 1.2 Create Environment Configuration

Create `src/api/environments.ts`:

```typescript
export interface EnvironmentConfig {
  name: string;
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  features: {
    vectorSearch: boolean;
    aggregations: boolean;
    bulkOperations: boolean;
    sqlQueries: boolean;
  };
  rateLimit: {
    enabled: boolean;
    globalLimit: number;
    windowMs: number;
  };
}

export type Environment = "local" | "sit" | "uat" | "prod";

export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: {
    name: "Local Development",
    baseURL: "http://localhost:8000",
    timeout: 30000,
    retryAttempts: 1,
    retryDelay: 1000,
    features: {
      vectorSearch: true,
      aggregations: true,
      bulkOperations: true,
      sqlQueries: true,
    },
    rateLimit: {
      enabled: false,
      globalLimit: 10000,
      windowMs: 60000,
    },
  },

  sit: {
    name: "System Integration Testing",
    baseURL: "https://asia-south1.api.fcz0.de/service/panel/boltic-tables",
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 1500,
    features: {
      vectorSearch: true,
      aggregations: true,
      bulkOperations: true,
      sqlQueries: true,
    },
    rateLimit: {
      enabled: true,
      globalLimit: 1000,
      windowMs: 60000,
    },
  },

  uat: {
    name: "User Acceptance Testing",
    baseURL: "https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables",
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 1500,
    features: {
      vectorSearch: true,
      aggregations: true,
      bulkOperations: true,
      sqlQueries: true,
    },
    rateLimit: {
      enabled: true,
      globalLimit: 2000,
      windowMs: 60000,
    },
  },

  prod: {
    name: "Production",
    baseURL: "https://asia-south1.api.boltic.io/service/panel/boltic-tables",
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 2000,
    features: {
      vectorSearch: true,
      aggregations: true,
      bulkOperations: true,
      sqlQueries: true,
    },
    rateLimit: {
      enabled: true,
      globalLimit: 5000,
      windowMs: 60000,
    },
  },
};

export const getEnvironmentConfig = (env: Environment): EnvironmentConfig => {
  const config = ENVIRONMENT_CONFIGS[env];
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  return config;
};

export const isFeatureEnabled = (
  env: Environment,
  feature: keyof EnvironmentConfig["features"]
): boolean => {
  const config = getEnvironmentConfig(env);
  return config.features[feature];
};
```

### Task 2: API Request/Response Transformers

**Duration**: 3-4 days
**Priority**: Critical

#### 2.1 Create Request Transformers

Create `src/api/transformers/request.ts`:

```typescript
import {
  DatabaseCreateRequest,
  DatabaseQueryOptions,
  TableCreateRequest,
  TableQueryOptions,
  ColumnCreateRequest,
  ColumnQueryOptions,
  RecordCreateRequest,
  RecordQueryOptions,
  SqlQueryRequest,
} from "../../types/api";
import { ApiEndpoint } from "../endpoints";

export interface TransformedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export class RequestTransformer {
  /**
   * Transform database creation request
   */
  static transformDatabaseCreate(
    endpoint: ApiEndpoint,
    baseURL: string,
    request: DatabaseCreateRequest,
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    return {
      url: `${baseURL}${endpoint.path}`,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      body: {
        name: request.name,
        slug: request.slug,
        description: request.description,
        resource_id: request.resource_id,
      },
    };
  }

  /**
   * Transform database query request
   */
  static transformDatabaseQuery(
    endpoint: ApiEndpoint,
    baseURL: string,
    options: DatabaseQueryOptions = {},
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    const params: Record<string, string> = {};

    if (options.where) {
      params.filter = JSON.stringify(options.where);
    }

    if (options.fields?.length) {
      params.fields = options.fields.join(",");
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(",");
    }

    if (options.limit !== undefined) {
      params.limit = options.limit.toString();
    }

    if (options.offset !== undefined) {
      params.offset = options.offset.toString();
    }

    return {
      url: `${baseURL}${endpoint.path}`,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      params,
    };
  }

  /**
   * Transform table creation request
   */
  static transformTableCreate(
    endpoint: ApiEndpoint,
    baseURL: string,
    request: TableCreateRequest,
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    // Transform schema fields to match API format
    const transformedSchema = request.schema?.map((field) => ({
      name: field.name,
      type: field.type,
      is_nullable: field.is_nullable ?? true,
      is_primary_key: field.is_primary_key ?? false,
      is_unique: field.is_unique ?? false,
      is_visible: field.is_visible ?? true,
      is_readonly: field.is_readonly ?? false,
      field_order: field.field_order ?? 1,
      alignment: field.alignment ?? null,
      timezone: field.timezone ?? null,
      date_format: field.date_format ?? null,
      time_format: field.time_format ?? null,
      decimals: field.decimals ?? null,
      currency_format: field.currency_format ?? null,
      selection_source: field.selection_source ?? null,
      selectable_items: field.selectable_items ?? null,
      multiple_selections: field.multiple_selections ?? false,
      phone_format: field.phone_format ?? null,
      button_type: field.button_type ?? null,
      button_label: field.button_label ?? null,
      button_additional_labels: field.button_additional_labels ?? null,
      button_state: field.button_state ?? null,
      disable_on_click: field.disable_on_click ?? null,
      vector_dimension: field.vector_dimension ?? null,
    }));

    return {
      url: `${baseURL}${endpoint.path}`,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      body: {
        table_name: request.table_name,
        schema: transformedSchema,
        description: request.description,
      },
    };
  }

  /**
   * Transform record creation request
   */
  static transformRecordCreate(
    endpoint: ApiEndpoint,
    baseURL: string,
    tableId: string,
    request: RecordCreateRequest,
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    const url = `${baseURL}${endpoint.path.replace("{table_id}", tableId)}`;

    return {
      url,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      body: {
        data: this.sanitizeRecordData(request.data),
      },
    };
  }

  /**
   * Transform record query request
   */
  static transformRecordQuery(
    endpoint: ApiEndpoint,
    baseURL: string,
    tableId: string,
    options: RecordQueryOptions = {},
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    const url = `${baseURL}${endpoint.path.replace("{table_id}", tableId)}`;
    const params: Record<string, string> = {};

    if (options.where) {
      params.where = JSON.stringify(
        this.transformWhereCondition(options.where)
      );
    }

    if (options.fields?.length) {
      params.fields = options.fields.join(",");
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(",");
    }

    if (options.limit !== undefined) {
      params.limit = options.limit.toString();
    }

    if (options.offset !== undefined) {
      params.offset = options.offset.toString();
    }

    if (options.include_count !== undefined) {
      params.include_count = options.include_count.toString();
    }

    return {
      url,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      params,
    };
  }

  /**
   * Transform SQL query request
   */
  static transformSqlQuery(
    endpoint: ApiEndpoint,
    baseURL: string,
    request: SqlQueryRequest,
    context: { apiKey: string; databaseId?: string }
  ): TransformedRequest {
    const body: any = {
      query: request.query,
      db_id: request.database_id || context.databaseId,
    };

    if (request.params) {
      if (Array.isArray(request.params)) {
        body.params = request.params;
      } else {
        body.named_params = request.params;
      }
    }

    return {
      url: `${baseURL}${endpoint.path}`,
      method: endpoint.method,
      headers: this.buildHeaders(context.apiKey, context.databaseId),
      body,
    };
  }

  // Private helper methods
  private static buildHeaders(
    apiKey: string,
    databaseId?: string,
    additionalHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-boltic-token": apiKey,
      "User-Agent": `@boltic/database-js/${
        process.env.npm_package_version || "1.0.0"
      }`,
      ...additionalHeaders,
    };

    // Add database context if available
    if (databaseId) {
      headers["x-boltic-database"] = databaseId;
    }

    return headers;
  }

  private static sanitizeRecordData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized: any = {};
    const reservedFields = ["id", "created_at", "updated_at"];

    Object.entries(data).forEach(([key, value]) => {
      // Skip reserved fields
      if (reservedFields.includes(key)) {
        return;
      }

      // Skip undefined values
      if (value === undefined) {
        return;
      }

      sanitized[key] = value;
    });

    return sanitized;
  }

  private static transformWhereCondition(where: any): any {
    if (!where || typeof where !== "object") {
      return where;
    }

    const transformed: any = {};

    Object.entries(where).forEach(([field, condition]) => {
      if (
        condition &&
        typeof condition === "object" &&
        !Array.isArray(condition)
      ) {
        // Transform query operators to API format
        const transformedCondition: any = {};

        Object.entries(condition).forEach(([operator, value]) => {
          switch (operator) {
            case "$eq":
              transformedCondition.eq = value;
              break;
            case "$ne":
              transformedCondition.ne = value;
              break;
            case "$gt":
              transformedCondition.gt = value;
              break;
            case "$gte":
              transformedCondition.gte = value;
              break;
            case "$lt":
              transformedCondition.lt = value;
              break;
            case "$lte":
              transformedCondition.lte = value;
              break;
            case "$in":
              transformedCondition.in = value;
              break;
            case "$nin":
              transformedCondition.nin = value;
              break;
            case "$like":
              transformedCondition.like = value;
              break;
            case "$ilike":
              transformedCondition.ilike = value;
              break;
            case "$between":
              transformedCondition.between = value;
              break;
            case "$null":
              transformedCondition.is_null = value;
              break;
            case "$exists":
              transformedCondition.exists = value;
              break;
            default:
              transformedCondition[operator] = value;
          }
        });

        transformed[field] = transformedCondition;
      } else {
        // Direct value condition
        transformed[field] = { eq: condition };
      }
    });

    return transformed;
  }
}
```

#### 2.2 Create Response Transformers

Create `src/api/transformers/response.ts`:

```typescript
import {
  DatabaseWithId,
  TableWithId,
  ColumnWithId,
  RecordWithId,
  RecordListResponse,
  RecordAggregateResponse,
  SqlQueryResponse,
} from "../../types/api";
import { ApiResponse } from "../../client/core/base-resource";

export interface ApiResponseData {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    execution_time?: number;
    [key: string]: any;
  };
}

export class ResponseTransformer {
  /**
   * Transform raw API response to SDK format
   */
  static transformResponse<T>(
    rawResponse: any,
    transformer?: (data: any) => T
  ): ApiResponse<T> {
    try {
      // Handle different response formats
      const responseData = this.normalizeResponseData(rawResponse);

      if (!responseData.success && responseData.error) {
        return {
          data: undefined as any,
          error: {
            code: responseData.error.code || "UNKNOWN_ERROR",
            message: responseData.error.message || "An unknown error occurred",
            details: responseData.error.details,
          },
        };
      }

      const transformedData = transformer
        ? transformer(responseData.data)
        : responseData.data;

      const result: ApiResponse<T> = {
        data: transformedData,
      };

      // Add pagination if present
      if (responseData.meta?.pagination) {
        (result as any).pagination = responseData.meta.pagination;
      }

      return result;
    } catch (error) {
      return {
        data: undefined as any,
        error: {
          code: "TRANSFORMATION_ERROR",
          message: "Failed to transform API response",
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        },
      };
    }
  }

  /**
   * Transform database response
   */
  static transformDatabaseResponse(
    rawResponse: any
  ): ApiResponse<DatabaseWithId> {
    return this.transformResponse(rawResponse, (data) => ({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      resource_id: data.resource_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      is_public: data.is_public,
      table_count: data.table_count,
    }));
  }

  /**
   * Transform database list response
   */
  static transformDatabaseListResponse(
    rawResponse: any
  ): ApiResponse<DatabaseWithId[]> & { pagination?: any } {
    const transformed = this.transformResponse(rawResponse, (data) => {
      if (Array.isArray(data)) {
        return data.map((db) => ({
          id: db.id,
          name: db.name,
          slug: db.slug,
          description: db.description,
          resource_id: db.resource_id,
          created_at: db.created_at,
          updated_at: db.updated_at,
          created_by: db.created_by,
          is_public: db.is_public,
          table_count: db.table_count,
        }));
      }
      return data;
    });

    return transformed as ApiResponse<DatabaseWithId[]> & { pagination?: any };
  }

  /**
   * Transform table response
   */
  static transformTableResponse(rawResponse: any): ApiResponse<TableWithId> {
    return this.transformResponse(rawResponse, (data) => ({
      id: data.id,
      name: data.name,
      table_name: data.table_name,
      description: data.description,
      schema: data.schema ? this.transformSchemaFields(data.schema) : [],
      record_count: data.record_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      is_public: data.is_public,
      database_id: data.database_id,
    }));
  }

  /**
   * Transform table list response
   */
  static transformTableListResponse(
    rawResponse: any
  ): ApiResponse<TableWithId[]> & { pagination?: any } {
    const transformed = this.transformResponse(rawResponse, (data) => {
      if (Array.isArray(data)) {
        return data.map((table) => ({
          id: table.id,
          name: table.name,
          table_name: table.table_name,
          description: table.description,
          schema: table.schema ? this.transformSchemaFields(table.schema) : [],
          record_count: table.record_count || 0,
          created_at: table.created_at,
          updated_at: table.updated_at,
          created_by: table.created_by,
          is_public: table.is_public,
          database_id: table.database_id,
        }));
      }
      return data;
    });

    return transformed as ApiResponse<TableWithId[]> & { pagination?: any };
  }

  /**
   * Transform column/field response
   */
  static transformColumnResponse(rawResponse: any): ApiResponse<ColumnWithId> {
    return this.transformResponse(rawResponse, (data) => ({
      id: data.id,
      name: data.name,
      type: data.type,
      is_nullable: data.is_nullable,
      is_primary_key: data.is_primary_key,
      is_unique: data.is_unique,
      is_visible: data.is_visible,
      is_readonly: data.is_readonly,
      field_order: data.field_order,
      alignment: data.alignment,
      timezone: data.timezone,
      date_format: data.date_format,
      time_format: data.time_format,
      decimals: data.decimals,
      currency_format: data.currency_format,
      selection_source: data.selection_source,
      selectable_items: data.selectable_items,
      multiple_selections: data.multiple_selections,
      phone_format: data.phone_format,
      button_type: data.button_type,
      button_label: data.button_label,
      button_additional_labels: data.button_additional_labels,
      button_state: data.button_state,
      disable_on_click: data.disable_on_click,
      vector_dimension: data.vector_dimension,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      table_id: data.table_id,
    }));
  }

  /**
   * Transform column list response
   */
  static transformColumnListResponse(
    rawResponse: any
  ): ApiResponse<ColumnWithId[]> {
    return this.transformResponse(rawResponse, (data) => {
      if (Array.isArray(data)) {
        return data.map((column) => this.transformSingleColumn(column));
      }
      return data;
    });
  }

  /**
   * Transform record response
   */
  static transformRecordResponse(rawResponse: any): ApiResponse<RecordWithId> {
    return this.transformResponse(rawResponse, (data) => ({
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      ...this.sanitizeRecordFields(data),
    }));
  }

  /**
   * Transform record list response
   */
  static transformRecordListResponse(
    rawResponse: any
  ): ApiResponse<RecordWithId[]> & { pagination?: any } {
    const transformed = this.transformResponse(rawResponse, (data) => {
      // Handle different response formats
      if (data.records && Array.isArray(data.records)) {
        // Response with pagination wrapper
        return data.records.map((record: any) => ({
          id: record.id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          ...this.sanitizeRecordFields(record),
        }));
      } else if (Array.isArray(data)) {
        // Direct array response
        return data.map((record: any) => ({
          id: record.id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          ...this.sanitizeRecordFields(record),
        }));
      }
      return data;
    });

    return transformed as ApiResponse<RecordWithId[]> & { pagination?: any };
  }

  /**
   * Transform SQL query response
   */
  static transformSqlResponse(rawResponse: any): ApiResponse<SqlQueryResponse> {
    return this.transformResponse(rawResponse, (data) => ({
      columns: data.columns || [],
      rows: data.rows || [],
      row_count: data.row_count || data.rows?.length || 0,
      execution_time_ms: data.execution_time_ms || data.execution_time || 0,
    }));
  }

  /**
   * Transform aggregate response
   */
  static transformAggregateResponse(
    rawResponse: any
  ): ApiResponse<RecordAggregateResponse> {
    return this.transformResponse(rawResponse, (data) => ({
      results: data.results || data.groups || [],
      total_groups: data.total_groups || data.group_count || 0,
    }));
  }

  /**
   * Transform bulk operation response
   */
  static transformBulkResponse(rawResponse: any): ApiResponse<any> {
    return this.transformResponse(rawResponse, (data) => ({
      success: data.success || [],
      failed: data.failed || [],
      summary: {
        total:
          data.total ||
          (data.success?.length || 0) + (data.failed?.length || 0),
        successful: data.successful || data.success?.length || 0,
        failed: data.failed_count || data.failed?.length || 0,
      },
    }));
  }

  // Private helper methods
  private static normalizeResponseData(rawResponse: any): ApiResponseData {
    // Handle different API response formats
    if (rawResponse.success !== undefined) {
      // Standard Boltic API format
      return rawResponse;
    }

    if (rawResponse.error) {
      // Error response
      return {
        success: false,
        error: rawResponse.error,
      };
    }

    if (rawResponse.data !== undefined) {
      // Data wrapper format
      return {
        success: true,
        data: rawResponse.data,
        meta: rawResponse.meta,
      };
    }

    // Direct data format
    return {
      success: true,
      data: rawResponse,
    };
  }

  private static transformSchemaFields(schema: any[]): any[] {
    return schema.map((field) => ({
      name: field.name,
      type: field.type,
      is_nullable: field.is_nullable ?? true,
      is_primary_key: field.is_primary_key ?? false,
      is_unique: field.is_unique ?? false,
      is_visible: field.is_visible ?? true,
      is_readonly: field.is_readonly ?? false,
      field_order: field.field_order ?? 1,
      alignment: field.alignment,
      timezone: field.timezone,
      date_format: field.date_format,
      time_format: field.time_format,
      decimals: field.decimals,
      currency_format: field.currency_format,
      selection_source: field.selection_source,
      selectable_items: field.selectable_items,
      multiple_selections: field.multiple_selections ?? false,
      phone_format: field.phone_format,
      button_type: field.button_type,
      button_label: field.button_label,
      button_additional_labels: field.button_additional_labels,
      button_state: field.button_state,
      disable_on_click: field.disable_on_click,
      vector_dimension: field.vector_dimension,
      description: field.description,
    }));
  }

  private static transformSingleColumn(column: any): ColumnWithId {
    return {
      id: column.id,
      name: column.name,
      type: column.type,
      is_nullable: column.is_nullable,
      is_primary_key: column.is_primary_key,
      is_unique: column.is_unique,
      is_visible: column.is_visible,
      is_readonly: column.is_readonly,
      field_order: column.field_order,
      alignment: column.alignment,
      timezone: column.timezone,
      date_format: column.date_format,
      time_format: column.time_format,
      decimals: column.decimals,
      currency_format: column.currency_format,
      selection_source: column.selection_source,
      selectable_items: column.selectable_items,
      multiple_selections: column.multiple_selections,
      phone_format: column.phone_format,
      button_type: column.button_type,
      button_label: column.button_label,
      button_additional_labels: column.button_additional_labels,
      button_state: column.button_state,
      disable_on_click: column.disable_on_click,
      vector_dimension: column.vector_dimension,
      description: column.description,
      created_at: column.created_at,
      updated_at: column.updated_at,
      table_id: column.table_id,
    };
  }

  private static sanitizeRecordFields(record: any): any {
    const sanitized: any = {};
    const systemFields = ["id", "created_at", "updated_at"];

    Object.entries(record).forEach(([key, value]) => {
      if (!systemFields.includes(key)) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}
```

### Task 3: API Client Implementation

**Duration**: 2-3 days
**Priority**: Critical

#### 3.1 Create Core API Client

Create `src/api/client.ts`:

```typescript
import { HttpAdapter } from "../utils/http/adapter";
import { ApiEndpoint, getEndpoint, buildEndpointPath } from "./endpoints";
import { Environment, getEnvironmentConfig } from "./environments";
import { RequestTransformer, TransformedRequest } from "./transformers/request";
import { ResponseTransformer } from "./transformers/response";
import { ApiError } from "../errors/api-error";
import { NetworkError } from "../errors/network-error";
import { RateLimitError } from "../errors/rate-limit-error";

export interface ApiClientOptions {
  apiKey: string;
  environment: Environment;
  databaseId?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  debug?: boolean;
}

export interface ApiRequestOptions {
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  skipRateLimit?: boolean;
}

export class ApiClient {
  private httpAdapter: HttpAdapter;
  private options: Required<ApiClientOptions>;
  private environmentConfig: any;
  private rateLimitTracker = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(httpAdapter: HttpAdapter, options: ApiClientOptions) {
    this.httpAdapter = httpAdapter;
    this.environmentConfig = getEnvironmentConfig(options.environment);

    this.options = {
      apiKey: options.apiKey,
      environment: options.environment,
      databaseId: options.databaseId || "",
      timeout: options.timeout || this.environmentConfig.timeout,
      retryAttempts:
        options.retryAttempts || this.environmentConfig.retryAttempts,
      retryDelay: options.retryDelay || this.environmentConfig.retryDelay,
      headers: options.headers || {},
      debug: options.debug || false,
    };
  }

  /**
   * Make API request
   */
  async request<T>(
    category: string,
    operation: string,
    requestOptions: ApiRequestOptions = {}
  ): Promise<T> {
    const endpoint = getEndpoint(category as any, operation);

    // Check rate limits
    if (!requestOptions.skipRateLimit) {
      await this.checkRateLimit(endpoint, `${category}.${operation}`);
    }

    // Build the request
    const transformedRequest = this.buildRequest(endpoint, requestOptions);

    // Execute with retries
    return this.executeWithRetries(transformedRequest, endpoint);
  }

  /**
   * Database API methods
   */
  async createDatabase(request: any): Promise<any> {
    return this.request("databases", "create", { body: request });
  }

  async listDatabases(options: any = {}): Promise<any> {
    return this.request("databases", "list", {
      queryParams: this.buildQueryParams(options),
    });
  }

  async findDatabase(options: any): Promise<any> {
    return this.request("databases", "find", {
      queryParams: this.buildQueryParams(options),
    });
  }

  async updateDatabase(id: string, updates: any): Promise<any> {
    return this.request("databases", "update", {
      pathParams: { id },
      body: updates,
    });
  }

  async deleteDatabase(id: string): Promise<any> {
    return this.request("databases", "delete", { pathParams: { id } });
  }

  /**
   * Table API methods
   */
  async createTable(request: any): Promise<any> {
    return this.request("tables", "create", { body: request });
  }

  async listTables(options: any = {}): Promise<any> {
    return this.request("tables", "list", {
      queryParams: this.buildQueryParams(options),
    });
  }

  async findTable(id: string): Promise<any> {
    return this.request("tables", "find", { pathParams: { id } });
  }

  async updateTable(id: string, updates: any): Promise<any> {
    return this.request("tables", "update", {
      pathParams: { id },
      body: updates,
    });
  }

  async renameTable(id: string, newName: string): Promise<any> {
    return this.request("tables", "rename", {
      pathParams: { id },
      body: { name: newName },
    });
  }

  async setTableAccess(id: string, access: any): Promise<any> {
    return this.request("tables", "setAccess", {
      pathParams: { id },
      body: access,
    });
  }

  async deleteTable(id: string): Promise<any> {
    return this.request("tables", "delete", { pathParams: { id } });
  }

  /**
   * Field API methods
   */
  async createFields(tableId: string, request: any): Promise<any> {
    return this.request("fields", "create", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async listFields(tableId: string, options: any = {}): Promise<any> {
    return this.request("fields", "list", {
      pathParams: { table_id: tableId },
      queryParams: this.buildQueryParams(options),
    });
  }

  async findField(tableId: string, fieldId: string): Promise<any> {
    return this.request("fields", "find", {
      pathParams: { table_id: tableId, field_id: fieldId },
    });
  }

  async updateField(
    tableId: string,
    fieldId: string,
    updates: any
  ): Promise<any> {
    return this.request("fields", "update", {
      pathParams: { table_id: tableId, field_id: fieldId },
      body: updates,
    });
  }

  async deleteField(tableId: string, fieldId: string): Promise<any> {
    return this.request("fields", "delete", {
      pathParams: { table_id: tableId, field_id: fieldId },
    });
  }

  /**
   * Record API methods
   */
  async createRecord(tableId: string, request: any): Promise<any> {
    return this.request("records", "create", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async bulkCreateRecords(tableId: string, request: any): Promise<any> {
    return this.request("records", "bulkCreate", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async listRecords(tableId: string, options: any = {}): Promise<any> {
    return this.request("records", "list", {
      pathParams: { table_id: tableId },
      queryParams: this.buildQueryParams(options),
    });
  }

  async findRecord(tableId: string, recordId: string): Promise<any> {
    return this.request("records", "find", {
      pathParams: { table_id: tableId, record_id: recordId },
    });
  }

  async updateRecords(tableId: string, request: any): Promise<any> {
    return this.request("records", "update", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async bulkUpdateRecords(tableId: string, request: any): Promise<any> {
    return this.request("records", "bulkUpdate", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async deleteRecords(tableId: string, options: any): Promise<any> {
    return this.request("records", "delete", {
      pathParams: { table_id: tableId },
      queryParams: this.buildQueryParams(options),
    });
  }

  async aggregateRecords(tableId: string, request: any): Promise<any> {
    return this.request("records", "aggregate", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  async vectorSearchRecords(tableId: string, request: any): Promise<any> {
    return this.request("records", "vectorSearch", {
      pathParams: { table_id: tableId },
      body: request,
    });
  }

  /**
   * SQL API methods
   */
  async executeSql(request: any): Promise<any> {
    return this.request("sql", "execute", { body: request });
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.options.apiKey = apiKey;
  }

  /**
   * Update database context
   */
  updateDatabaseId(databaseId: string): void {
    this.options.databaseId = databaseId;
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.options.environment;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return (this.environmentConfig.features as any)[feature] ?? false;
  }

  // Private methods
  private buildRequest(
    endpoint: ApiEndpoint,
    options: ApiRequestOptions
  ): TransformedRequest {
    // Build URL with path parameters
    const path = buildEndpointPath(endpoint, options.pathParams);
    const url = `${this.environmentConfig.baseURL}${path}`;

    // Build headers
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-boltic-token": this.options.apiKey,
      "User-Agent": `@boltic/database-js/${
        process.env.npm_package_version || "1.0.0"
      }`,
      ...this.options.headers,
      ...options.headers,
    };

    // Add database context
    if (this.options.databaseId) {
      headers["x-boltic-database"] = this.options.databaseId;
    }

    return {
      url,
      method: endpoint.method,
      headers,
      body: options.body,
      params: options.queryParams,
    };
  }

  private async executeWithRetries<T>(
    request: TransformedRequest,
    endpoint: ApiEndpoint
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.options.retryAttempts) {
      try {
        const response = await this.httpAdapter.request({
          url: request.url,
          method: request.method as any,
          headers: request.headers,
          data: request.body,
          params: request.params,
          timeout: this.options.timeout,
        });

        // Update rate limit tracking
        this.updateRateLimitTracking(endpoint, response.headers);

        return response.data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry certain types of errors
        if (error instanceof ApiError && error.statusCode < 500) {
          throw error;
        }

        if (error instanceof RateLimitError) {
          throw error;
        }

        attempt++;

        if (attempt <= this.options.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);

          if (this.options.debug) {
            console.log(
              `Retrying request (attempt ${attempt}/${this.options.retryAttempts}) after ${delay}ms`
            );
          }
        }
      }
    }

    throw lastError!;
  }

  private async checkRateLimit(
    endpoint: ApiEndpoint,
    operation: string
  ): Promise<void> {
    if (!this.environmentConfig.rateLimit.enabled) {
      return;
    }

    const now = Date.now();
    const tracker = this.rateLimitTracker.get(operation);

    if (!tracker) {
      this.rateLimitTracker.set(operation, {
        count: 1,
        resetTime: now + 60000,
      });
      return;
    }

    if (now > tracker.resetTime) {
      // Reset the counter
      tracker.count = 1;
      tracker.resetTime = now + 60000;
      return;
    }

    const limit =
      endpoint.rateLimit?.requests ||
      this.environmentConfig.rateLimit.globalLimit;

    if (tracker.count >= limit) {
      const waitTime = tracker.resetTime - now;
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}. Try again in ${Math.ceil(
          waitTime / 1000
        )} seconds.`,
        limit,
        waitTime
      );
    }

    tracker.count++;
  }

  private updateRateLimitTracking(
    endpoint: ApiEndpoint,
    headers: Record<string, string>
  ): void {
    // Update rate limit tracking based on response headers
    const remaining = headers["x-ratelimit-remaining"];
    const resetTime = headers["x-ratelimit-reset"];

    if (remaining && resetTime) {
      // Use server-provided rate limit info if available
      // Implementation would depend on actual API headers
    }
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.options.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildQueryParams(options: any): Record<string, string> {
    const params: Record<string, string> = {};

    if (options.where) {
      params.where = JSON.stringify(options.where);
    }

    if (options.fields?.length) {
      params.fields = Array.isArray(options.fields)
        ? options.fields.join(",")
        : options.fields;
    }

    if (options.sort?.length) {
      params.sort = Array.isArray(options.sort)
        ? options.sort.map((s: any) => `${s.field}:${s.order}`).join(",")
        : options.sort;
    }

    if (options.limit !== undefined) {
      params.limit = options.limit.toString();
    }

    if (options.offset !== undefined) {
      params.offset = options.offset.toString();
    }

    if (options.include_count !== undefined) {
      params.include_count = options.include_count.toString();
    }

    // Add any additional parameters
    Object.entries(options).forEach(([key, value]) => {
      if (
        ![
          "where",
          "fields",
          "sort",
          "limit",
          "offset",
          "include_count",
        ].includes(key) &&
        value !== undefined
      ) {
        params[key] = String(value);
      }
    });

    return params;
  }
}
```

### Task 4: Resource Integration Updates

**Duration**: 2-3 days
**Priority**: Critical

#### 4.1 Update BaseResource to Use ApiClient

Update `src/client/core/base-resource.ts`:

```typescript
// Add import
import { ApiClient } from "../../api/client";

export abstract class BaseResource {
  protected client: BaseClient;
  protected apiClient: ApiClient;
  protected basePath: string;

  constructor(client: BaseClient, basePath: string) {
    this.client = client;
    this.apiClient = client.getApiClient();
    this.basePath = basePath;
  }

  // Update makeRequest method to use ApiClient
  protected async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    data?: any,
    options: {
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Map the method call to ApiClient
      const category = this.getResourceCategory();
      const operation = this.getOperationFromPath(method, path);

      const result = await this.apiClient.request<T>(category, operation, {
        body: data,
        queryParams: options.params,
        headers: options.headers,
        pathParams: this.extractPathParams(path),
      });

      return { data: result };
    } catch (error) {
      return {
        data: undefined as any,
        error: this.transformError(error),
      };
    }
  }

  // Abstract methods to be implemented by each resource
  protected abstract getResourceCategory(): string;

  protected getOperationFromPath(method: string, path: string): string {
    // Default implementation - can be overridden
    const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");

    if (method === "GET" && !cleanPath) return "list";
    if (method === "GET" && cleanPath.includes("/")) return "find";
    if (method === "POST" && cleanPath.includes("bulk")) return "bulkCreate";
    if (method === "POST") return "create";
    if (method === "PATCH" && cleanPath.includes("bulk")) return "bulkUpdate";
    if (method === "PATCH") return "update";
    if (method === "DELETE") return "delete";

    return "unknown";
  }

  protected extractPathParams(path: string): Record<string, string> {
    // Extract path parameters from the path
    const params: Record<string, string> = {};

    // This is a simplified implementation
    // In practice, you'd want more sophisticated path parameter extraction
    const parts = path.split("/").filter((p) => p);

    parts.forEach((part, index) => {
      if (!part.startsWith("{") && parts[index + 1]) {
        const nextPart = parts[index + 1];
        if (!nextPart.startsWith("{")) {
          // This might be a parameter value
          if (part === "tables" && nextPart) {
            params.table_id = nextPart;
          } else if (part === "fields" && nextPart) {
            params.field_id = nextPart;
          } else if (part === "records" && nextPart) {
            params.record_id = nextPart;
          }
        }
      }
    });

    return params;
  }

  private transformError(error: any): ApiResponse<any>["error"] {
    if (error instanceof ApiError) {
      return {
        code: error.code || "API_ERROR",
        message: error.message,
        details: error.details,
      };
    }

    if (error instanceof NetworkError) {
      return {
        code: "NETWORK_ERROR",
        message: error.message,
        details: { originalError: error.cause },
      };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: error.message || "An unknown error occurred",
      details: { originalError: String(error) },
    };
  }
}
```

#### 4.2 Update Individual Resource Classes

Each resource class needs to implement the `getResourceCategory()` method:

```typescript
// In DatabaseResource
protected getResourceCategory(): string {
  return 'databases';
}

// In TableResource
protected getResourceCategory(): string {
  return 'tables';
}

// In ColumnResource
protected getResourceCategory(): string {
  return 'fields';
}

// In RecordResource
protected getResourceCategory(): string {
  return 'records';
}

// In SqlResource
protected getResourceCategory(): string {
  return 'sql';
}
```

### Task 5: Error Handling Enhancement

**Duration**: 1-2 days
**Priority**: High

#### 5.1 Create Rate Limit Error

Create `src/errors/rate-limit-error.ts`:

```typescript
export class RateLimitError extends Error {
  public readonly code = "RATE_LIMIT_EXCEEDED";
  public readonly limit: number;
  public readonly retryAfter: number; // milliseconds

  constructor(message: string, limit: number, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.limit = limit;
    this.retryAfter = retryAfter;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  /**
   * Get retry after time in seconds
   */
  getRetryAfterSeconds(): number {
    return Math.ceil(this.retryAfter / 1000);
  }

  /**
   * Create a human-readable error message
   */
  toUserMessage(): string {
    const seconds = this.getRetryAfterSeconds();
    return `Rate limit exceeded. Please wait ${seconds} second${
      seconds !== 1 ? "s" : ""
    } before trying again.`;
  }
}
```

#### 5.2 Update BaseClient with ApiClient Integration

Update `src/client/core/base-client.ts`:

```typescript
import { ApiClient } from "../../api/client";
import { Environment } from "../../api/environments";

export class BaseClient {
  private apiClient: ApiClient;
  private httpAdapter: HttpAdapter;
  private config: ClientConfig;
  private cache?: CacheManager;

  constructor(httpAdapter: HttpAdapter, config: ClientConfig) {
    this.httpAdapter = httpAdapter;
    this.config = config;

    // Initialize API client
    this.apiClient = new ApiClient(httpAdapter, {
      apiKey: config.apiKey,
      environment: config.environment as Environment,
      databaseId: config.databaseId,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
      debug: config.debug,
    });

    // Initialize cache if enabled
    if (config.cacheEnabled) {
      this.cache = new CacheManager(config.cache);
    }
  }

  /**
   * Get the API client instance
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.apiClient.updateApiKey(apiKey);
  }

  /**
   * Update database context
   */
  updateDatabaseId(databaseId: string): void {
    this.config.databaseId = databaseId;
    this.apiClient.updateDatabaseId(databaseId);
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.apiClient.getEnvironment();
  }

  /**
   * Check if feature is enabled in current environment
   */
  isFeatureEnabled(feature: string): boolean {
    return this.apiClient.isFeatureEnabled(feature);
  }

  // ... rest of existing methods
}
```

### Task 6: Integration Testing

**Duration**: 2-3 days
**Priority**: High

#### 6.1 Create API Integration Tests

Create `tests/integration/api/client.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient } from "../../../src/api/client";
import { FetchHttpAdapter } from "../../../src/utils/http/fetch-adapter";
import { RateLimitError } from "../../../src/errors/rate-limit-error";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ApiClient Integration", () => {
  let apiClient: ApiClient;
  let httpAdapter: FetchHttpAdapter;

  beforeEach(() => {
    httpAdapter = new FetchHttpAdapter();
    apiClient = new ApiClient(httpAdapter, {
      apiKey: "test-api-key",
      environment: "sit",
      debug: true,
    });

    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Database Operations", () => {
    it("should create database with proper request format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: {
            id: "db-123",
            name: "test_database",
            slug: "test-database",
            created_at: "2024-01-01T00:00:00Z",
          },
        }),
      });

      const result = await apiClient.createDatabase({
        name: "test_database",
        slug: "test-database",
        description: "Test database",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://asia-south1.api.fcz0.de/service/panel/boltic-tables/v1/tables/databases",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-boltic-token": "test-api-key",
          }),
          body: JSON.stringify({
            name: "test_database",
            slug: "test-database",
            description: "Test database",
            resource_id: undefined,
          }),
        })
      );

      expect(result.data.id).toBe("db-123");
    });

    it("should list databases with query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: [
            { id: "db-1", name: "database1" },
            { id: "db-2", name: "database2" },
          ],
        }),
      });

      await apiClient.listDatabases({
        where: { created_by: "user@example.com" },
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("where="),
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Table Operations", () => {
    it("should create table with schema", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: {
            id: "table-123",
            table_name: "products",
            schema: [],
          },
        }),
      });

      await apiClient.createTable({
        table_name: "products",
        schema: [
          {
            name: "title",
            type: "text",
            is_nullable: false,
          },
        ],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://asia-south1.api.fcz0.de/service/panel/boltic-tables/v1/tables",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("products"),
        })
      );
    });
  });

  describe("Record Operations", () => {
    it("should create record with data transformation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: {
            id: "record-123",
            title: "MacBook Pro",
            price: 2499.99,
            created_at: "2024-01-01T00:00:00Z",
          },
        }),
      });

      await apiClient.createRecord("table-456", {
        data: {
          title: "MacBook Pro",
          price: 2499.99,
          metadata: { color: "silver" },
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://asia-south1.api.fcz0.de/service/panel/boltic-tables/v1/tables/table-456/records",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("MacBook Pro"),
        })
      );
    });

    it("should handle bulk operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: {
            success: [{ id: "rec-1" }, { id: "rec-2" }],
            failed: [],
            summary: { total: 2, successful: 2, failed: 0 },
          },
        }),
      });

      await apiClient.bulkCreateRecords("table-456", {
        data: [
          { title: "Product 1", price: 99.99 },
          { title: "Product 2", price: 199.99 },
        ],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://asia-south1.api.fcz0.de/service/panel/boltic-tables/v1/tables/table-456/records/bulk",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors properly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
          },
        }),
      });

      await expect(apiClient.createDatabase({ name: "" })).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(apiClient.listDatabases()).rejects.toThrow();
    });

    it("should handle rate limiting", async () => {
      // This would require mocking the rate limit tracking
      // Implementation depends on how rate limiting is implemented
    });
  });

  describe("Authentication", () => {
    it("should include API key in headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.listDatabases();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-boltic-token": "test-api-key",
          }),
        })
      );
    });

    it("should include database context when set", async () => {
      apiClient.updateDatabaseId("db-123");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.listTables();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-boltic-database": "db-123",
          }),
        })
      );
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed requests", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true, data: [] }),
        });

      await apiClient.listDatabases();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should not retry 4xx errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: { code: "BAD_REQUEST", message: "Bad request" },
        }),
      });

      await expect(apiClient.listDatabases()).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Task 7: Documentation and Configuration

**Duration**: 1-2 days
**Priority**: Medium

#### 7.1 Create API Integration Guide

Create `docs/guides/api-integration.md`:

````markdown
# API Integration Guide

This guide explains how the Boltic Tables SDK integrates with the actual Boltic Tables API.

## Architecture Overview

The SDK uses a layered architecture for API communication:

1. **Resource Layer** - High-level SDK interfaces (Database, Table, Record, etc.)
2. **API Client Layer** - HTTP communication and endpoint management
3. **Transform Layer** - Request/response data transformation
4. **HTTP Adapter Layer** - Platform-specific HTTP implementations

## Environment Configuration

The SDK supports multiple environments with different configurations:

### Supported Environments

- **local** - Local development (http://localhost:8000)
- **sit** - System Integration Testing
- **uat** - User Acceptance Testing
- **prod** - Production

### Environment Features

Each environment supports different feature sets:

```typescript
const config = getEnvironmentConfig("prod");
console.log(config.features.vectorSearch); // true
console.log(config.features.aggregations); // true
```
````

````

## API Endpoints

The SDK maps to these core Boltic Tables API endpoints:

### Database Operations

- `GET /v1/tables/databases` - List databases
- `POST /v1/tables/databases` - Create database
- `PATCH /v1/tables/databases/{id}` - Update database
- `DELETE /v1/tables/databases/{id}` - Delete database

### Table Operations

- `GET /v1/tables` - List tables
- `POST /v1/tables` - Create table
- `GET /v1/tables/{id}` - Get table
- `PATCH /v1/tables/{id}` - Update table
- `DELETE /v1/tables/{id}` - Delete table

### Field Operations

- `GET /v1/tables/{table_id}/fields` - List fields
- `POST /v1/tables/{table_id}/fields` - Create fields
- `PATCH /v1/tables/{table_id}/fields/{field_id}` - Update field
- `DELETE /v1/tables/{table_id}/fields/{field_id}` - Delete field

### Record Operations

- `GET /v1/tables/{table_id}/records` - List records
- `POST /v1/tables/{table_id}/records` - Create record
- `POST /v1/tables/{table_id}/records/bulk` - Bulk create
- `PATCH /v1/tables/{table_id}/records` - Update records
- `PATCH /v1/tables/{table_id}/records/bulk` - Bulk update
- `DELETE /v1/tables/{table_id}/records` - Delete records
- `POST /v1/tables/{table_id}/records/aggregate` - Aggregate query
- `POST /v1/tables/{table_id}/records/vector-search` - Vector search

### SQL Operations

- `POST /v1/tables/query` - Execute SQL query

## Authentication

All API requests require authentication using the `x-boltic-token` header:

```typescript
const client = createClient("your-api-key", {
  environment: "prod",
});
````

### Database Context

When working with a specific database, include the database ID:

```typescript
const db = client.useDatabase("database-id");
// All subsequent operations will include x-boltic-database header
```

## Request/Response Transformation

The SDK automatically transforms between SDK format and API format:

### Request Transformation

SDK query options are transformed to API parameters:

```typescript
// SDK format
const options = {
  where: { price: { $gt: 100 } },
  fields: ["id", "title", "price"],
  sort: [{ field: "price", order: "desc" }],
  limit: 10,
};

// Transformed to API format
const apiParams = {
  where: JSON.stringify({ price: { gt: 100 } }),
  fields: "id,title,price",
  sort: "price:desc",
  limit: "10",
};
```

### Response Transformation

API responses are normalized to consistent SDK format:

```typescript
// API response
{
  "success": true,
  "data": [
    { "id": "rec-1", "title": "Product 1" }
  ],
  "meta": {
    "pagination": { "total": 1, "page": 1 }
  }
}

// SDK format
{
  "data": [
    { "id": "rec-1", "title": "Product 1" }
  ],
  "pagination": { "total": 1, "page": 1 }
}
```

## Error Handling

The SDK provides structured error handling:

### Error Types

- **ValidationError** - Invalid input data
- **ApiError** - API-level errors (4xx, 5xx)
- **NetworkError** - Network connectivity issues
- **RateLimitError** - Rate limit exceeded

### Error Response Format

```typescript
{
  data: undefined,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid field name',
    details: { field: 'title', reason: 'required' }
  }
}
```

## Rate Limiting

The SDK implements intelligent rate limiting:

### Rate Limit Configuration

```typescript
const endpoint = {
  rateLimit: {
    requests: 100, // Max requests
    window: 60000, // Per minute (ms)
  },
};
```

### Handling Rate Limits

```typescript
try {
  await db.record.findAll("products");
} catch (error) {
  if (error instanceof RateLimitError) {
    const waitTime = error.getRetryAfterSeconds();
    console.log(`Rate limited. Retry after ${waitTime} seconds.`);
  }
}
```

## Retry Logic

The SDK automatically retries failed requests:

### Retry Configuration

- **5xx errors** - Retried with exponential backoff
- **Network errors** - Retried with exponential backoff
- **4xx errors** - Not retried (client errors)
- **Rate limits** - Not retried (handled separately)

### Retry Backoff

```typescript
const retryDelay = baseDelay * Math.pow(2, attemptNumber - 1) + jitter;
```

## Caching Integration

The API client integrates with the SDK's caching system:

### Cacheable Operations

- **GET requests** - Automatically cached
- **Aggregate queries** - Cached for performance
- **Vector searches** - Cached with TTL

### Cache Invalidation

- **Write operations** - Invalidate related caches
- **Schema changes** - Clear all table-related caches
- **Manual** - Clear specific cache keys

## Performance Optimization

### Connection Pooling

The SDK reuses HTTP connections for better performance:

```typescript
// Connections are automatically pooled by the HTTP adapter
```

### Request Deduplication

Identical concurrent requests are deduplicated:

```typescript
// These calls will be deduplicated into a single API request
const [result1, result2] = await Promise.all([
  db.record.findAll("products", options),
  db.record.findAll("products", options),
]);
```

### Bulk Operations

Use bulk operations for better performance:

```typescript
// Instead of multiple single requests
for (const record of records) {
  await db.record.insert("products", record); // Slow
}

// Use bulk operation
await db.record.bulkInsert("products", { data: records }); // Fast
```

## Debugging and Monitoring

### Debug Mode

Enable debug logging for API requests:

```typescript
const client = createClient("api-key", {
  environment: "prod",
  debug: true,
});
```

### Request Interceptors

Add custom request/response interceptors:

```typescript
const client = createClient("api-key", {
  beforeRequest: (config) => {
    console.log("Making request:", config.url);
    return config;
  },
  afterResponse: (response) => {
    console.log("Response time:", response.headers["x-response-time"]);
    return response;
  },
});
```

## Security Considerations

### API Key Management

- Store API keys securely (environment variables)
- Rotate keys regularly
- Use different keys for different environments

### Request Validation

- All requests are validated before sending
- Query parameters are properly encoded
- SQL queries are validated for safety

### Response Validation

- All responses are validated against expected schemas
- Malformed responses trigger errors
- Sensitive data is properly handled

## Best Practices

### Error Handling

```typescript
try {
  const result = await db.record.insert("products", data);
  return result.data;
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation failed:", error.failures);
  } else if (error instanceof RateLimitError) {
    // Handle rate limiting
    setTimeout(() => retry(), error.retryAfter);
  } else {
    // Handle other errors
    console.error("Unexpected error:", error.message);
  }
}
```

### Performance

```typescript
// Use appropriate pagination
const products = await db.record.findAll("products", {
  limit: 100, // Don't fetch too many at once
  offset: 0,
});

// Use field selection
const products = await db.record.findAll("products", {
  fields: ["id", "title", "price"], // Only fetch needed fields
});

// Use caching for repeated queries
const cached = await cache.get(cacheKey);
if (!cached) {
  const result = await db.record.findAll("products", options);
  await cache.set(cacheKey, result, ttl);
  return result;
}
```

### Resource Management

```typescript
// Clean up resources when done
const client = createClient(apiKey, options);

// Use client for operations
await client.database.create(dbConfig);

// Client automatically manages connections and cleanup
```

````

### Task 8: Final Integration and Testing
**Duration**: 1-2 days
**Priority**: High

#### 8.1 Update Main Client with Full API Integration
Update `src/client/index.ts` to ensure full integration:
```typescript
import { BolticClient } from './boltic-client';
import { createHttpAdapter } from '../utils/http/client-factory';
import { Environment } from '../api/environments';

export interface ClientOptions {
  environment?: Environment;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  debug?: boolean;
  headers?: Record<string, string>;
}

export function createClient(apiKey: string, options: ClientOptions = {}): BolticClient {
  const httpAdapter = createHttpAdapter();

  return new BolticClient(apiKey, {
    environment: options.environment || 'prod',
    timeout: options.timeout || 30000,
    retryAttempts: options.retryAttempts || 3,
    retryDelay: options.retryDelay || 1000,
    cacheEnabled: options.cacheEnabled ?? true,
    debug: options.debug || false,
    headers: options.headers || {},
  });
}

// Re-export everything needed
export * from './boltic-client';
export * from '../types/api';
export * from '../errors';
export { Environment } from '../api/environments';
````

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation

- [ ] Complete API endpoint registry with all operations
- [ ] Environment configuration for all environments (local, sit, uat, prod)
- [ ] Request/response transformers for all data formats
- [ ] ApiClient with full HTTP communication layer

### ✅ Integration

- [ ] BaseResource updated to use ApiClient
- [ ] All resource classes integrated with API endpoints
- [ ] Authentication and database context management
- [ ] Error handling with proper error types

### ✅ HTTP Communication

- [ ] Proper HTTP adapter integration
- [ ] Request/response interceptors working
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting implementation

### ✅ Data Transformation

- [ ] SDK to API request transformation
- [ ] API to SDK response transformation
- [ ] Query parameter building and encoding
- [ ] Path parameter replacement

### ✅ Error Handling

- [ ] Structured error responses
- [ ] Rate limit error handling
- [ ] Network error recovery
- [ ] API error mapping

### ✅ Performance

- [ ] Connection pooling and reuse
- [ ] Request deduplication
- [ ] Intelligent caching integration
- [ ] Bulk operation optimization

### ✅ Security

- [ ] API key management and headers
- [ ] Request validation and sanitization
- [ ] Response validation
- [ ] SQL injection prevention

### ✅ Testing

- [ ] Integration tests for all API operations
- [ ] Error handling test scenarios
- [ ] Rate limiting test cases
- [ ] Authentication and authorization tests

### ✅ Documentation

- [ ] API integration guide with examples
- [ ] Environment configuration documentation
- [ ] Error handling best practices
- [ ] Performance optimization guidelines

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: API endpoint details, request/response examples, error codes
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:

- **Testing Infrastructure Agent** (can test full end-to-end workflows)
- **Documentation Agent** (can generate complete API documentation)
- **Performance Optimization Agent** (can optimize real API performance)

## Critical Notes

- **ENSURE** all API endpoints are correctly mapped
- **VALIDATE** request/response transformations are accurate
- **TEST** authentication and database context thoroughly
- **IMPLEMENT** robust error handling for all scenarios
- **OPTIMIZE** for real-world API performance and reliability

Remember: This is the bridge between the SDK and the actual Boltic Tables service. Reliability, performance, and security are absolutely critical for production use.
