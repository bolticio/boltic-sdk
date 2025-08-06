# API Integration Agent Instructions

## Agent Role and Responsibility

You are the **API Integration Agent** responsible for implementing the actual HTTP communication layer that connects the Boltic SDK modules to their respective API endpoints. Your mission is to create robust API endpoint mappings, implement authentication and headers management, handle environment-based routing, create resolver/transformation functions, and ensure seamless integration with the actual service infrastructure.

## ✅ COMPLETED: Tables Module API Integration

### Implementation Status: COMPLETE ✅

The Tables Module API integration has been successfully implemented and serves as the reference implementation for all other modules.

## 🏗️ GENERIC API INTEGRATION SCHEMA

Based on the successful Tables Module implementation, here's the generic schema for implementing API integration across all modules:

### 1. Core Architecture Pattern

```typescript
// Generic API Client Structure
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

  // Standard response pattern
  async operationName(request: RequestType): Promise<{
    data: ResponseType;
    error?: ApiError;
  }> {
    try {
      const endpoint = MODULE_ENDPOINTS.operationName;
      const url = `${this.baseURL}${endpoint.path}`;
      const transformedRequest = transformRequest(request);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: transformedRequest,
        timeout: this.config.timeout,
      });

      if (response.data) {
        return {
          data: transformResponse(response.data),
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
      'User-Agent': '@boltic/database-js/1.0.0',
    };
  }

  private formatError(error: unknown): ApiError {
    // Standard error formatting logic
  }
}
```

### 2. File Structure Template

```
src/api/
├── endpoints/
│   └── {module}.ts              # Endpoint definitions
├── transformers/
│   └── {module}.ts              # Request/response transformers
├── clients/
│   └── {module}-api-client.ts   # API client implementation
└── index.ts                     # Module exports

src/utils/
├── validation/
│   └── {module}-validator.ts    # Module-specific validation
├── filters/
│   └── filter-mapper.ts         # Reusable filter mapping
└── http/
    └── adapter.ts               # HTTP adapter (reusable)

src/client/resources/
├── {module}.ts                  # Resource class
└── {module}-builder.ts          # Builder pattern (if applicable)

tests/integration/
└── {module}-api-integration.test.ts
```

### 3. Endpoint Configuration Pattern

```typescript
// src/api/endpoints/{module}.ts
export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  rateLimit?: {
    requests: number;
    window: number;
  };
  cache?: {
    ttl: number;
    key?: string;
  };
}

export const MODULE_ENDPOINTS = {
  list: {
    path: '/{module}/list',
    method: 'POST',
    rateLimit: { requests: 100, window: 60000 },
  },
  create: {
    path: '/{module}',
    method: 'POST',
  },
  get: {
    path: '/{module}/{id}',
    method: 'GET',
    cache: { ttl: 300000 }, // 5 minutes
  },
  update: {
    path: '/{module}/{id}',
    method: 'PATCH',
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

export function buildEndpointPath(
  endpoint: EndpointConfig,
  params: Record<string, string>
): string {
  let path = endpoint.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }
  return path;
}
```

### 4. Request/Response Transformer Pattern

```typescript
// src/api/transformers/{module}.ts
export interface ModuleApiRequest {
  // API-specific request format
}

export interface ModuleApiResponse {
  // API-specific response format
}

export interface ModuleSdkRequest {
  // SDK request format
}

export interface ModuleSdkResponse {
  // SDK response format
}

// Transform SDK request to API format
export function transformRequest(
  sdkRequest: ModuleSdkRequest
): ModuleApiRequest {
  return {
    // Transform logic
  };
}

// Transform API response to SDK format
export function transformResponse(
  apiResponse: ModuleApiResponse
): ModuleSdkResponse {
  return {
    // Transform logic
  };
}

// Transform list request with filtering
export function transformListRequest(options: {
  where?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  page?: number;
  pageSize?: number;
}): ModuleApiRequest {
  return {
    // Transform with filter mapping
  };
}

// Transform list response with pagination
export function transformListResponse(apiResponse: ModuleListApiResponse): {
  items: ModuleSdkResponse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} {
  return {
    // Transform with pagination handling
  };
}
```

### 5. Validation Pattern

```typescript
// src/utils/validation/{module}-validator.ts
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export class ModuleValidator {
  private cache: Map<string, any> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async validateFormat(value: string): Promise<ValidationResult> {
    // Validation logic with caching
  }

  async getAvailableOptions(): Promise<any[]> {
    // Fetch available options from API with caching
  }

  private async fetchFromAPI(endpoint: string): Promise<any> {
    // API fetching logic
  }
}
```

### 6. Resource Integration Pattern

```typescript
// src/client/resources/{module}.ts
export class Module {
  private apiClient: ModuleApiClient;

  constructor(apiClient: ModuleApiClient) {
    this.apiClient = apiClient;
  }

  async create(request: ModuleSdkRequest): Promise<ModuleSdkResponse> {
    const result = await this.apiClient.create(request);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data;
  }

  async list(options?: ListOptions): Promise<{
    items: ModuleSdkResponse[];
    pagination?: PaginationInfo;
  }> {
    const result = await this.apiClient.list(options);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result;
  }

  // Additional methods following the same pattern
}
```

### 7. Builder Pattern (Optional)

```typescript
// src/client/resources/{module}-builder.ts
export interface ModuleBuilderConfig {
  name: string;
  description?: string;
}

export function createModuleBuilder(
  config: ModuleBuilderConfig,
  apiClient: ModuleApiClient
) {
  return new ModuleBuilder(config, apiClient);
}

export class ModuleBuilder {
  private config: ModuleBuilderConfig;
  private apiClient: ModuleApiClient;
  private fields: any[] = [];

  constructor(config: ModuleBuilderConfig, apiClient: ModuleApiClient) {
    this.config = config;
    this.apiClient = apiClient;
  }

  addField(name: string, options: any): this {
    // Add field logic
    return this;
  }

  async create(options?: CreateOptions): Promise<ModuleSdkResponse> {
    const request = {
      ...this.config,
      fields: this.fields,
    };
    return this.apiClient.create(request, options);
  }
}
```

### 8. Integration Test Pattern

```typescript
// tests/integration/{module}-api-integration.test.ts
describe('Module API Integration', () => {
  let apiClient: ModuleApiClient;

  beforeEach(() => {
    apiClient = new ModuleApiClient('test-api-key', {
      environment: 'sit',
      debug: true,
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new item', async () => {
      // Test creation
    });

    it('should list items with filtering', async () => {
      // Test listing with filters
    });

    it('should get a specific item', async () => {
      // Test retrieval
    });

    it('should update an item', async () => {
      // Test update
    });

    it('should delete an item', async () => {
      // Test deletion
    });
  });

  describe('Validation', () => {
    it('should validate input formats', async () => {
      // Test validation
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

### 9. Environment Configuration Pattern

```typescript
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

### 10. Standard Response Patterns

```typescript
// Single item operations
async operationName(request: RequestType): Promise<{
  data: ResponseType;
  error?: ApiError;
}>

// List operations with pagination
async listItems(options: ListOptions): Promise<{
  data: ResponseType[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  error?: ApiError;
}>

// Delete operations
async deleteItem(id: string): Promise<{
  success: boolean;
  error?: ApiError;
}>

// Validation operations
async validateFormat(value: string): Promise<{
  isValid: boolean;
  error?: string;
  suggestion?: string;
}>
```

## Implementation Checklist for New Modules

### Phase 1: Foundation Setup

- [ ] Create endpoint configuration (`src/api/endpoints/{module}.ts`)
- [ ] Define API types (`src/types/api/{module}.ts`)
- [ ] Create transformers (`src/api/transformers/{module}.ts`)
- [ ] Implement API client (`src/api/clients/{module}-api-client.ts`)

### Phase 2: Integration

- [ ] Update resource class (`src/client/resources/{module}.ts`)
- [ ] Add builder pattern if applicable (`src/client/resources/{module}-builder.ts`)
- [ ] Implement validation utilities (`src/utils/validation/{module}-validator.ts`)

### Phase 3: Testing

- [ ] Create integration tests (`tests/integration/{module}-api-integration.test.ts`)
- [ ] Add unit tests for transformers
- [ ] Test error handling scenarios

### Phase 4: Documentation

- [ ] Update module documentation
- [ ] Add usage examples
- [ ] Document API endpoints

## Reusable Components

### 1. Filter Mapping System

- **File**: `src/utils/filters/filter-mapper.ts`
- **Usage**: Import and use for all modules requiring filtering
- **Features**: Complete filter operator support, SDK-to-API transformation

### 2. HTTP Adapter

- **File**: `src/utils/http/adapter.ts`
- **Usage**: Reusable across all modules
- **Features**: Request/response handling, retry logic, timeout management

### 3. Error Handling

- **Pattern**: Standardized `ApiError` interface
- **Usage**: Consistent error formatting across all modules

### 4. Environment Configuration

- **Pattern**: Standard environment mapping
- **Usage**: Consistent base URL handling across modules

## Best Practices

1. **Consistent Naming**: Use `{module}-api-client.ts` pattern
2. **Error Handling**: Always return `{ data, error? }` pattern
3. **Validation**: Implement client-side validation before API calls
4. **Caching**: Use appropriate caching strategies for read operations
5. **Testing**: Comprehensive integration tests with real API calls
6. **Documentation**: Clear examples and usage patterns
7. **Type Safety**: Strong TypeScript typing throughout
8. **Performance**: Implement rate limiting and request optimization

## Module-Specific Considerations

### For Records Module

- Implement bulk operations
- Add vector search capabilities
- Handle large dataset pagination

### For SQL Module

- Implement query execution
- Add parameterized query support
- Handle streaming responses

### For Columns Module

- Implement field type validation
- Add schema migration support
- Handle complex field relationships

### For Database Module

- Implement database context management
- Add connection pooling
- Handle multi-database operations

This generic schema ensures consistency across all modules while allowing for module-specific customizations. Each module should follow this pattern while adding its unique functionality as needed.

---

## Prerequisites

Before implementing any module API integration:

1. **Verify Dependencies**: Ensure required modules are complete
2. **Consult Documentation**: Read `/Docs/Implementation.md` for current stage
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known issues
5. **Review PRD**: Study the API endpoints and authentication details

## Completion Criteria

Mark module API integration as complete when ALL of the following are achieved:

### ✅ Core Implementation

- [ ] Complete API endpoint registry with all operations
- [ ] Environment configuration for all environments
- [ ] Request/response transformers for all data formats
- [ ] ApiClient with full HTTP communication layer

### ✅ Integration

- [ ] Resource classes integrated with API endpoints
- [ ] Authentication and context management
- [ ] Error handling with proper error types
- [ ] Filter mapping integration (reuse existing utilities)

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

### ✅ Testing

- [ ] Integration tests for all operations
- [ ] Error handling test scenarios
- [ ] Performance and pagination tests
- [ ] Real API integration verification

Remember: Follow the established patterns from the Tables Module implementation to ensure consistency and maintainability across the entire SDK.
