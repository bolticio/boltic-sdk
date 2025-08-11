# API Integration Agent Instructions

## Agent Role and Responsibility

You are the **API Integration Agent** responsible for implementing the actual HTTP communication layer that connects the Boltic SDK modules to their respective API endpoints. Your mission is to create robust API endpoint mappings, implement authentication and headers management, handle environment-based routing, create resolver/transformation functions, and ensure seamless integration with the actual service infrastructure.

## ✅ COMPLETED MODULES

### 1. Tables Module API Integration - COMPLETE ✅

### 2. Records Module API Integration - COMPLETE ✅

### 3. Columns Module API Integration - COMPLETE ✅

All three core modules now have complete API integration with real HTTP communication to the Boltic API endpoints.

## 🏗️ ACTUAL IMPLEMENTATION PATTERNS

Based on the completed implementations, here are the **actual patterns** used in the codebase:

### 1. Core Architecture Pattern (ACTUAL IMPLEMENTATION)

```typescript
// Actual API Client Structure from the codebase
export interface ModuleApiClientConfig {
  apiKey: string;
  environment?: Environment;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export class ModuleApiClient {
  private httpAdapter: HttpAdapter;
  private config: ModuleApiClientConfig;
  private baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<ModuleApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();
    this.baseURL = this.getBaseURL(config.environment || 'sit');
  }

  // ACTUAL response pattern used in the codebase
  async operationName(request: RequestType): Promise<{
    data: ResponseType;
    error?: ApiError;
  }> {
    try {
      const endpoint = MODULE_ENDPOINTS.operationName;
      const url = `${this.baseURL}${endpoint.path}`;

      // IMPORTANT: Pass data as-is without transformation (per user preference)
      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request, // No transformation - pass data directly
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: response.data, // No transformation - return API response directly
        };
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      return {
        data: {} as ResponseType,
        error: this.formatError(error),
      };
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
    };
  }

  private formatError(error: unknown): ApiError {
    // Standard error formatting logic
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error,
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error,
    };
  }
}
```

### 2. ACTUAL File Structure (From Implemented Codebase)

```
src/api/
├── endpoints/
│   ├── tables.ts              ✅ COMPLETE
│   ├── records.ts             ✅ COMPLETE
│   └── columns.ts             ✅ COMPLETE
├── transformers/
│   ├── tables.ts              ✅ COMPLETE
│   ├── records.ts             ✅ COMPLETE
│   └── columns.ts             ✅ COMPLETE
├── clients/
│   ├── tables-api-client.ts   ✅ COMPLETE
│   ├── records-api-client.ts  ✅ COMPLETE
│   └── columns-api-client.ts  ✅ COMPLETE
└── index.ts                   ✅ COMPLETE

src/client/resources/
├── table.ts                   ✅ COMPLETE
├── record.ts                  ✅ COMPLETE
└── column.ts                  ✅ COMPLETE

src/utils/
├── validation/
│   └── column-validator.ts    ✅ COMPLETE
├── filters/
│   └── filter-mapper.ts       ✅ COMPLETE
└── http/
    └── adapter.ts             ✅ COMPLETE
```

### 3. ACTUAL Endpoint Configuration Pattern

```typescript
// ACTUAL pattern from implemented endpoints
export const MODULE_ENDPOINTS = {
  list: {
    path: '/{module}/list',
    method: 'POST',
  },
  create: {
    path: '/{module}',
    method: 'POST',
  },
  get: {
    path: '/{module}/{id}',
    method: 'GET',
  },
  update: {
    path: '/{module}/{id}',
    method: 'PUT', // Note: Using PUT, not PATCH
  },
  delete: {
    path: '/{module}/{id}',
    method: 'DELETE',
  },
  // Module-specific endpoints
  customOperation: {
    path: '/{module}/custom-operation',
    method: 'POST',
  },
} as const;
```

### 4. ACTUAL Request/Response Pattern (NO TRANSFORMATION)

```typescript
// IMPORTANT: The codebase follows user preference to NOT transform data
// Data is passed as-is in insert, update, delete, and get operations

// ACTUAL pattern from the implemented codebase:
export function transformRequest(
  sdkRequest: ModuleSdkRequest
): ModuleApiRequest {
  // NO TRANSFORMATION - return as-is
  return sdkRequest as ModuleApiRequest;
}

export function transformResponse(
  apiResponse: ModuleApiResponse
): ModuleSdkResponse {
  // NO TRANSFORMATION - return as-is
  return apiResponse as ModuleSdkResponse;
}
```

### 5. ACTUAL Resource Integration Pattern

```typescript
// ACTUAL pattern from implemented resources
export class ModuleResource {
  private apiClient: ModuleApiClient;
  private tablesApiClient: TablesApiClient; // For table ID resolution

  constructor(client: BaseClient) {
    const config = client.getConfig();

    this.apiClient = new ModuleApiClient(config.apiKey, {
      environment: config.environment,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    // Initialize tables API client for table ID resolution
    this.tablesApiClient = new TablesApiClient(config.apiKey, {
      environment: config.environment,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });
  }

  async create(
    tableName: string,
    data: ModuleData
  ): Promise<ApiResponse<ModuleRecord>> {
    try {
      // Get table ID first (common pattern across all modules)
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );

      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in request (common pattern)
      const requestOptions = { ...data, table_id: tableId };
      const result = await this.apiClient.create(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'CREATE_ERROR',
        details: error,
      };
    }
  }
}
```

### 6. ACTUAL Error Handling Pattern

```typescript
// ACTUAL error handling pattern from the codebase
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  pagination?: PaginationInfo;
}

// Error response pattern
if (result.error) {
  return {
    error: result.error.message,
    code: result.error.code,
    details: result.error.details,
  };
}

// Success response pattern
return {
  data: result.data,
};
```

### 7. ACTUAL Table ID Resolution Pattern

```typescript
// ACTUAL pattern used across all modules for table ID resolution
export class TableResource {
  static async getTableId(
    tablesApiClient: TablesApiClient,
    tableName: string
  ): Promise<string | null> {
    try {
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

      return result.data[0].id;
    } catch (error) {
      console.error('Error getting table ID:', error);
      return null;
    }
  }
}
```

### 8. ACTUAL Environment Configuration

```typescript
// ACTUAL environment configuration from implemented codebase
private getBaseURL(environment: Environment): string {
  const envConfigs = {
    local: 'http://localhost:8000',
    sit: 'https://asia-south1.api.fcz0.de/service/panel/boltic-{module}/v1',
    uat: 'https://asia-south1.api.uat.fcz0.de/service/panel/boltic-{module}/v1',
    prod: 'https://asia-south1.api.boltic.io/service/panel/boltic-{module}/v1',
  };
  return envConfigs[environment];
}
```

## 🚀 IMPLEMENTATION STATUS

### ✅ COMPLETED MODULES

#### Tables Module

- **API Client**: Complete with all CRUD operations
- **Resource Class**: Fully integrated with API endpoints
- **Endpoints**: All table operations implemented
- **Error Handling**: Comprehensive error handling

#### Records Module

- **API Client**: Complete with all CRUD operations
- **Resource Class**: Fully integrated with API endpoints
- **Endpoints**: All record operations implemented
- **Pagination**: Full pagination support
- **Filtering**: Advanced filtering capabilities

#### Columns Module

- **API Client**: Complete with all column operations
- **Resource Class**: Fully integrated with API endpoints
- **Endpoints**: All column operations implemented
- **Validation**: Column validation utilities
- **Table Integration**: Proper table ID resolution

### 🔄 NEXT MODULES TO IMPLEMENT

#### SQL Module

- Query execution endpoints
- Parameterized query support
- Result streaming

#### Database Module

- Database context management
- Connection operations
- Multi-database support

## 📋 IMPLEMENTATION CHECKLIST FOR NEW MODULES

### Phase 1: Foundation Setup

- [ ] Create endpoint configuration (`src/api/endpoints/{module}.ts`)
- [ ] Define API types (`src/types/api/{module}.ts`)
- [ ] Create transformers (`src/api/transformers/{module}.ts`) - **NO TRANSFORMATION**
- [ ] Implement API client (`src/api/clients/{module}-api-client.ts`)

### Phase 2: Integration

- [ ] Update resource class (`src/client/resources/{module}.ts`)
- [ ] Add table ID resolution pattern
- [ ] Implement validation utilities if needed
- [ ] Follow established error handling patterns

### Phase 3: Testing

- [ ] Create integration tests (`tests/integration/{module}-api-integration.test.ts`)
- [ ] Test table ID resolution
- [ ] Test error handling scenarios
- [ ] Verify API contract compliance

## 🎯 CRITICAL IMPLEMENTATION RULES

### 1. **NO DATA TRANSFORMATION**

- **RULE**: Pass data as-is in all operations
- **IMPLEMENTATION**: Return `sdkRequest as ModuleApiRequest` in transformers
- **REASON**: User preference for direct data handling

### 2. **TABLE ID RESOLUTION**

- **RULE**: Always resolve table ID before API calls
- **IMPLEMENTATION**: Use `TableResource.getTableId()` pattern
- **REASON**: Consistent with existing module implementations

### 3. **ERROR HANDLING**

- **RULE**: Use standardized `ApiResponse<T>` interface
- **IMPLEMENTATION**: Return `{ data, error?, code?, details? }` pattern
- **REASON**: Consistent error handling across all modules

### 4. **ENVIRONMENT CONFIGURATION**

- **RULE**: Use established environment mapping
- **IMPLEMENTATION**: Follow `getBaseURL()` pattern from existing modules
- **REASON**: Consistent environment handling

### 5. **API CLIENT INITIALIZATION**

- **RULE**: Initialize with client configuration
- **IMPLEMENTATION**: Pass all config options from BaseClient
- **REASON**: Proper configuration inheritance

## 🔧 REUSABLE COMPONENTS

### 1. **Table ID Resolution**

- **File**: `src/client/resources/table.ts` - `getTableId()` method
- **Usage**: Import and use across all modules
- **Pattern**: `TableResource.getTableId(tablesApiClient, tableName)`

### 2. **HTTP Adapter**

- **File**: `src/utils/http/adapter.ts`
- **Usage**: Reusable across all modules
- **Features**: Request/response handling, retry logic, timeout management

### 3. **Error Handling**

- **Pattern**: Standardized `ApiResponse<T>` interface
- **Usage**: Consistent error formatting across all modules

### 4. **Environment Configuration**

- **Pattern**: Standard environment mapping
- **Usage**: Consistent base URL handling across modules

## 📚 BEST PRACTICES (FROM IMPLEMENTED CODEBASE)

1. **Consistent Naming**: Use `{module}-api-client.ts` pattern
2. **Error Handling**: Always return `{ data, error?, code?, details? }` pattern
3. **Table ID Resolution**: Always resolve table ID before API calls
4. **Configuration Inheritance**: Pass all client config options to API clients
5. **No Data Transformation**: Pass data as-is per user preference
6. **Type Safety**: Full TypeScript support throughout
7. **Comprehensive Testing**: Integration tests with real API calls
8. **Documentation**: Clear examples and usage patterns

## 🎉 COMPLETION CRITERIA

Mark module API integration as complete when ALL of the following are achieved:

### ✅ Core Implementation

- [ ] Complete API endpoint registry with all operations
- [ ] Environment configuration for all environments
- [ ] Request/response handling (NO transformation)
- [ ] ApiClient with full HTTP communication layer

### ✅ Integration

- [ ] Resource classes integrated with API endpoints
- [ ] Table ID resolution pattern implemented
- [ ] Authentication and context management
- [ ] Error handling with proper error types

### ✅ HTTP Communication

- [ ] Proper HTTP adapter integration
- [ ] Request/response handling working
- [ ] Retry logic and timeout management
- [ ] Environment-based routing

### ✅ Data Handling

- [ ] Data passed as-is without transformation
- [ ] Table ID resolution before API calls
- [ ] Proper request payload construction
- [ ] Response handling without modification

### ✅ Testing

- [ ] Integration tests for all operations
- [ ] Table ID resolution testing
- [ ] Error handling test scenarios
- [ ] Real API integration verification

## 🚀 NEXT STEPS

With the core modules (Tables, Records, Columns) complete, focus on:

1. **SQL Module**: Query execution and parameterized queries
2. **Database Module**: Database context and connection management
3. **Advanced Features**: Vector search, aggregation, joins
4. **Performance Optimization**: Caching, rate limiting, connection pooling

The established patterns from the completed modules provide a solid foundation for implementing the remaining functionality! 🎉
