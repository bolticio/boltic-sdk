# SQL Operations Agent Instructions

## Agent Role and Responsibility

You are the **SQL Operations Agent** responsible for implementing comprehensive SQL query functionality for the Boltic Tables SDK. Your mission is to create a robust SQL module that provides text-to-SQL conversion, SQL execution, and query history management while maintaining consistency with existing SDK patterns and architecture.

## Prerequisites

Before starting, you MUST:

1. **Verify Dependencies**: Ensure Core Infrastructure Agent has completed ALL tasks
2. **Study Existing Patterns**: Review existing API clients in `src/api/clients/` to understand patterns
3. **Follow Project Structure**: Maintain adherence to existing project structure patterns
4. **Review API Contract**: Study the SQL_API_Contract.md for functional requirements

## Dependencies

This agent depends on the **Core Infrastructure Agent** completion. Verify these exist:

- BaseResource class and operation interfaces
- BolticClient with HTTP client infrastructure
- Authentication and error handling systems
- Common types and response structures
- Filter, sorting, and pagination utilities

## SQL API Contract Updates

### Updated Response Structures

Based on existing SDK patterns, update the SQL API Contract to use standard Boltic response structures:

#### Text-to-SQL Response

```typescript
interface TextToSQLResponse extends BolticSuccessResponse<string> {
  data: string; // Generated SQL query
}
```

#### Execute SQL Response

```typescript
interface ExecuteSQLResponse
  extends BolticSuccessResponse<{
    results: any[];
    metadata: {
      command: string;
      rowCount: number;
      fields: Array<{
        name: string;
        tableID: number;
        columnID: number;
        dataTypeID: number;
        dataTypeSize: number;
        dataTypeModifier: number;
        format: string;
      }>;
    };
  }> {
  pagination?: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}
```

#### Query History Response

```typescript
interface QueryHistoryResponse extends BolticListResponse<QueryExecution> {
  data: QueryExecution[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}
```

### Updated Request Structures

#### History Request with Standard Patterns

```typescript
interface HistoryRequest {
  page?: {
    page_no: number; // Maps from pageNo
    page_size: number; // Maps from pageSize
  };
  sort?: Array<{
    field: 'created_at' | 'execution_status' | 'query';
    direction: 'asc' | 'desc'; // Consistent with existing pattern
  }>;
  filters?: ApiFilter[]; // Use existing filter structure
}
```

## Primary Tasks

### Task 1: SQL Type Definitions

**Duration**: 1 day
**Priority**: Critical

#### 1.1 Create SQL API Types

Create `src/types/api/sql.ts`:

```typescript
import { ApiFilter } from '../common/filters';

// Text-to-SQL API Types
export interface TextToSQLApiRequest {
  prompt: string;
  current_query?: string;
}

export interface TextToSQLApiResponse {
  data: string;
}

// Execute SQL API Types
export interface ExecuteSQLApiRequest {
  query: string;
}

export interface ExecuteSQLApiResponse {
  data: [
    any[], // Query result rows
    {
      command: string;
      rowCount: number;
      oid: number | null;
      rows: any[];
      fields: Array<{
        name: string;
        tableID: number;
        columnID: number;
        dataTypeID: number;
        dataTypeSize: number;
        dataTypeModifier: number;
        format: string;
      }>;
    },
  ];
  pagination?: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}

// Query History API Types
export interface QueryHistoryApiRequest {
  page?: {
    page_no: number;
    page_size: number;
  };
  sort?: Array<{
    field: 'created_at' | 'execution_status' | 'query';
    direction: 'asc' | 'desc';
  }>;
  filters?: ApiFilter[];
}

export interface QueryExecution {
  id: string;
  account_id: string;
  query: string;
  query_plan: Array<{
    'QUERY PLAN': string;
  }>;
  execution_status: 'success' | 'failure' | 'timeout' | 'in_progress';
  planning_time_ms: number;
  execution_time_ms: number;
  error_message: string | null;
  created_by: string;
  created_at: string;
}

export interface QueryHistoryApiResponse {
  data: QueryExecution[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}
```

#### 1.2 Create SQL SDK Types

Create `src/types/sql.ts`:

```typescript
import { ApiFilter } from './common/filters';
import { PaginationInfo } from './common/operations';

// SDK Request Types
export interface TextToSQLOptions {
  currentQuery?: string;
}

export interface ExecutionResult {
  data: any[];
  count: number;
  metadata: {
    command: string;
    fields: Array<{
      name: string;
      tableID: number;
      columnID: number;
      dataTypeID: number;
      dataTypeSize: number;
      dataTypeModifier: number;
      format: string;
    }>;
  };
  pagination?: PaginationInfo;
}

export interface HistoryOptions {
  page?: {
    pageNo?: number; // Default: 1
    pageSize?: number; // Default: 20, Max: 100
  };
  sort?: Array<{
    field: 'created_at' | 'execution_status' | 'query';
    order: 'asc' | 'desc'; // SDK uses 'order', API uses 'direction'
  }>;
  filters?: ApiFilter[];
}

export interface HistoryResult {
  data: QueryExecution[];
  pagination: PaginationInfo;
}

// Re-export from API types for consistency
export type { QueryExecution } from './api/sql';
```

### Task 2: SQL API Endpoints Configuration

**Duration**: 0.5 days
**Priority**: Critical

#### 2.1 Create SQL Endpoints

Create `src/api/endpoints/sql.ts`:

```typescript
import { HttpMethod } from '../../utils/http/adapter';

export interface SqlEndpoint {
  path: string;
  method: HttpMethod;
}

export const SQL_ENDPOINTS = {
  textToSQL: {
    path: '/sql/text-to-sql',
    method: 'POST' as HttpMethod,
  },
  executeSQL: {
    path: '/sql/execute',
    method: 'POST' as HttpMethod,
  },
  queryHistory: {
    path: '/sql/history',
    method: 'POST' as HttpMethod,
  },
} as const;

/**
 * Build SQL endpoint path - all SQL endpoints are simple paths
 */
export function buildSqlEndpointPath(endpoint: SqlEndpoint): string {
  return endpoint.path;
}
```

### Task 3: SQL API Client Implementation

**Duration**: 2 days
**Priority**: Critical

#### 3.1 Create SQL API Client

Create `src/api/clients/sql-api-client.ts`:

```typescript
import { HttpAdapter } from '../../utils/http/adapter';
import { AuthConfig } from '../../types/config/auth';
import {
  BolticSuccessResponse,
  BolticErrorResponse,
} from '../../types/common/responses';
import {
  TextToSQLApiRequest,
  TextToSQLApiResponse,
  ExecuteSQLApiRequest,
  ExecuteSQLApiResponse,
  QueryHistoryApiRequest,
  QueryHistoryApiResponse,
} from '../../types/api/sql';
import { SQL_ENDPOINTS, buildSqlEndpointPath } from '../endpoints/sql';

export class SqlApiClient {
  private httpAdapter: HttpAdapter;
  private baseURL: string;
  private config: {
    timeout: number;
  };

  constructor(
    httpAdapter: HttpAdapter,
    baseURL: string,
    config: { timeout: number }
  ) {
    this.httpAdapter = httpAdapter;
    this.baseURL = baseURL;
    this.config = config;
  }

  private buildHeaders(): Record<string, string> {
    // Implementation similar to existing API clients
    // Include x-account-data and x-user-data headers
  }

  private formatErrorResponse(error: unknown): BolticErrorResponse {
    // Implementation consistent with existing API clients
  }

  /**
   * Convert natural language to SQL query (streaming)
   */
  async textToSQL(
    request: TextToSQLApiRequest
  ): Promise<AsyncIterable<string> | BolticErrorResponse> {
    try {
      const endpoint = SQL_ENDPOINTS.textToSQL;
      const url = `${this.baseURL}${buildSqlEndpointPath(endpoint)}`;

      // Implement streaming response handling
      // Return AsyncIterable<string> for streaming SQL generation
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Execute SQL query
   */
  async executeSQL(
    request: ExecuteSQLApiRequest
  ): Promise<ExecuteSQLApiResponse | BolticErrorResponse> {
    try {
      const endpoint = SQL_ENDPOINTS.executeSQL;
      const url = `${this.baseURL}${buildSqlEndpointPath(endpoint)}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data as ExecuteSQLApiResponse;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Get query execution history
   */
  async getQueryHistory(
    request: QueryHistoryApiRequest = {}
  ): Promise<QueryHistoryApiResponse | BolticErrorResponse> {
    try {
      const endpoint = SQL_ENDPOINTS.queryHistory;
      const url = `${this.baseURL}${buildSqlEndpointPath(endpoint)}`;

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data as QueryHistoryApiResponse;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
```

### Task 4: SQL Request/Response Transformers

**Duration**: 1 day
**Priority**: Critical

#### 4.1 Create SQL Transformers

Create `src/api/transformers/sql.ts`:

```typescript
import {
  TextToSQLOptions,
  HistoryOptions,
  ExecutionResult,
  HistoryResult,
} from '../../types/sql';
import {
  TextToSQLApiRequest,
  ExecuteSQLApiResponse,
  QueryHistoryApiRequest,
  QueryHistoryApiResponse,
} from '../../types/api/sql';

/**
 * Transform SDK text-to-SQL options to API request
 */
export function transformTextToSQLRequest(
  prompt: string,
  options: TextToSQLOptions = {}
): TextToSQLApiRequest {
  return {
    prompt,
    current_query: options.currentQuery,
  };
}

/**
 * Transform API execute SQL response to SDK result
 */
export function transformExecuteSQLResponse(
  apiResponse: ExecuteSQLApiResponse
): ExecutionResult {
  const [resultRows, metadata] = apiResponse.data;

  return {
    data: resultRows,
    count: metadata.rowCount,
    metadata: {
      command: metadata.command,
      fields: metadata.fields,
    },
    pagination: apiResponse.pagination,
  };
}

/**
 * Transform SDK history options to API request
 */
export function transformHistoryRequest(
  options: HistoryOptions = {}
): QueryHistoryApiRequest {
  const request: QueryHistoryApiRequest = {};

  // Add pagination - map SDK format to API format
  if (
    options.page?.pageNo !== undefined ||
    options.page?.pageSize !== undefined
  ) {
    request.page = {
      page_no: options.page?.pageNo || 1,
      page_size: options.page?.pageSize || 20,
    };
  }

  // Add sorting - map SDK 'order' to API 'direction'
  if (options.sort?.length) {
    request.sort = options.sort.map((s) => ({
      field: s.field,
      direction: s.order,
    }));
  }

  // Add filters - reuse existing filter structure
  if (options.filters?.length) {
    request.filters = options.filters;
  }

  return request;
}

/**
 * Transform API history response to SDK result
 */
export function transformHistoryResponse(
  apiResponse: QueryHistoryApiResponse
): HistoryResult {
  return {
    data: apiResponse.data,
    pagination: apiResponse.pagination,
  };
}
```

### Task 5: SQL Resource Class

**Duration**: 1 day
**Priority**: Critical

#### 5.1 Create SQL Resource

Create `src/client/resources/sql.ts`:

```typescript
import { BaseResource } from '../core/base-resource';
import { SqlApiClient } from '../../api/clients/sql-api-client';
import {
  TextToSQLOptions,
  HistoryOptions,
  ExecutionResult,
  HistoryResult,
} from '../../types/sql';
import {
  transformTextToSQLRequest,
  transformExecuteSQLResponse,
  transformHistoryRequest,
  transformHistoryResponse,
} from '../../api/transformers/sql';
import { isErrorResponse } from '../../types/common/responses';

export class SqlResource extends BaseResource {
  private sqlApiClient: SqlApiClient;

  constructor(sqlApiClient: SqlApiClient) {
    super();
    this.sqlApiClient = sqlApiClient;
  }

  /**
   * Convert natural language to SQL query
   * Returns streaming results
   */
  async textToSQL(
    prompt: string,
    options: TextToSQLOptions = {}
  ): Promise<AsyncIterable<string>> {
    const request = transformTextToSQLRequest(prompt, options);
    const response = await this.sqlApiClient.textToSQL(request);

    if (isErrorResponse(response)) {
      throw new Error(response.error.message || 'Failed to generate SQL');
    }

    return response as AsyncIterable<string>;
  }

  /**
   * Execute SQL query
   */
  async executeSQL(query: string): Promise<ExecutionResult> {
    const response = await this.sqlApiClient.executeSQL({ query });

    if (isErrorResponse(response)) {
      throw new Error(response.error.message || 'Failed to execute SQL');
    }

    return transformExecuteSQLResponse(response);
  }

  /**
   * Get query execution history
   */
  async getQueryHistory(options: HistoryOptions = {}): Promise<HistoryResult> {
    const request = transformHistoryRequest(options);
    const response = await this.sqlApiClient.getQueryHistory(request);

    if (isErrorResponse(response)) {
      throw new Error(response.error.message || 'Failed to get query history');
    }

    return transformHistoryResponse(response);
  }
}
```

### Task 6: Integration with Main Client

**Duration**: 0.5 days  
**Priority**: Critical

#### 6.1 Update BolticClient

Update `src/client/boltic-client.ts` to include SQL resource:

```typescript
import { SqlResource } from './resources/sql';
import { SqlApiClient } from '../api/clients/sql-api-client';

export class BolticClient {
  // ... existing properties ...

  public readonly sql: SqlResource;

  constructor(config: BolticClientConfig) {
    // ... existing initialization ...

    // Initialize SQL API client
    const sqlApiClient = new SqlApiClient(
      this.httpAdapter,
      this.config.baseURL,
      { timeout: this.config.timeout || 30000 }
    );

    // Initialize SQL resource
    this.sql = new SqlResource(sqlApiClient);
  }
}
```

#### 6.2 Update Main Index Export

Update `src/index.ts` to export SQL types:

```typescript
// SQL exports
export * from './types/sql';
export * from './client/resources/sql';
```

### Task 7: Enhanced Filter Support for SQL

**Duration**: 1 day
**Priority**: Medium

#### 7.1 Extend Filter Operators for SQL History

Since SQL queries can be filtered by various criteria, ensure the existing filter system supports all needed operators. Update filter mappings if needed:

### Task 8: Streaming Response Utilities

**Duration**: 1 day
**Priority**: Medium

#### 8.1 Create Streaming Utilities

Create `src/utils/streaming/async-iterable.ts`:

```typescript
/**
 * Utility functions for handling streaming responses
 */
export class StreamingUtils {
  /**
   * Convert Server-Sent Events to AsyncIterable
   */
  static async *fromSSE(response: Response): AsyncIterable<string> {
    // Implementation for converting SSE to AsyncIterable
  }

  /**
   * Convert chunked response to AsyncIterable
   */
  static async *fromChunked(response: Response): AsyncIterable<string> {
    // Implementation for converting chunked response to AsyncIterable
  }

  /**
   * Collect all chunks from AsyncIterable into a single string
   */
  static async collectAll(iterable: AsyncIterable<string>): Promise<string> {
    let result = '';
    for await (const chunk of iterable) {
      result += chunk;
    }
    return result;
  }
}
```

### Task 9: SQL Error Handling

**Duration**: 0.5 days
**Priority**: Medium

#### 9.1 SQL-Specific Error Types

Create `src/errors/sql-errors.ts`:

```typescript
import { BolticError } from './index';

export class SqlExecutionError extends BolticError {
  constructor(message: string, query?: string, executionTime?: number) {
    super(message, 'SQL_EXECUTION_ERROR');
    this.metadata = { query, executionTime };
  }
}

export class SqlTimeoutError extends BolticError {
  constructor(query?: string, timeoutMs?: number) {
    super('SQL query execution timed out', 'SQL_TIMEOUT_ERROR');
    this.metadata = { query, timeoutMs };
  }
}
```

### Task 10: Testing Infrastructure

**Duration**: 1 day
**Priority**: Medium

#### 10.1 Create SQL Test Utilities

Create `src/testing/sql-test-client.ts`:

```typescript
import { SqlResource } from '../client/resources/sql';
import { TextToSQLOptions, HistoryOptions } from '../types/sql';

export class SqlTestClient {
  constructor(private sql: SqlResource) {}

  /**
   * Test helper for text-to-SQL conversion
   */
  async generateSQL(
    prompt: string,
    options?: TextToSQLOptions
  ): Promise<string> {
    const stream = await this.sql.textToSQL(prompt, options);
    let result = '';
    for await (const chunk of stream) {
      result += chunk;
    }
    return result;
  }

  /**
   * Test helper for SQL execution
   */
  async executeSQL(query: string) {
    return this.sql.executeSQL(query);
  }

  /**
   * Test helper for getting recent query history
   */
  async getRecentHistory(limit = 10) {
    return this.sql.getQueryHistory({
      page: { pageNo: 1, pageSize: limit },
      sort: [{ field: 'created_at', order: 'desc' }],
    });
  }
}
```

#### 10.2 Create SQL Unit Tests

Create test files following existing patterns:

- `tests/unit/client/resources/sql.test.ts`
- `tests/unit/api/clients/sql-api-client.test.ts`
- `tests/unit/api/transformers/sql.test.ts`

## Implementation Guidelines

### Code Style and Patterns

1. **Follow Existing Patterns**: Study existing API clients and resources for consistent implementation
2. **Error Handling**: Use existing error handling patterns and BolticError base classes
3. **Type Safety**: Maintain strict TypeScript types throughout
4. **Naming Conventions**: Follow existing camelCase for SDK, snake_case for API
5. **Response Transformation**: Always transform API responses to SDK-friendly formats

### Performance Considerations

1. **Streaming**: Implement proper streaming for text-to-SQL responses
2. **Pagination**: Always use pagination for history queries

## Acceptance Criteria

### Task Completion Checklist

- [ ] All TypeScript types are properly defined and exported
- [ ] SQL API client is implemented with proper error handling
- [ ] Request/response transformers follow existing patterns
- [ ] SQL resource class provides intuitive SDK interface
- [ ] Streaming text-to-SQL functionality works correctly
- [ ] Query history supports filtering, sorting, and pagination
- [ ] Integration with main BolticClient is complete
- [ ] Error handling follows existing SDK patterns
- [ ] Unit tests provide good coverage of functionality
- [ ] Documentation is complete and follows existing standards
- [ ] Code follows existing style and architectural patterns

### Integration Testing

Before marking complete, verify:

1. **Text-to-SQL**: Can generate SQL from natural language prompts
2. **SQL Execution**: Can execute valid SQL queries and return results
3. **Query History**: Can retrieve, filter, and paginate query history
4. **Error Handling**: Gracefully handles API errors and network failures
5. **Streaming**: Text-to-SQL streaming works without memory leaks
6. **Performance**: Query execution performs within acceptable limits

## Notes and Considerations

### Memory Management

- Ensure streaming responses don't cause memory leaks
- Implement proper cleanup for long-running operations
- Use connection pooling effectively

### Backward Compatibility

- Design APIs to be extensible for future enhancements
- Avoid breaking changes to existing SDK patterns
- Consider versioning strategy for major changes

---

**Priority**: Critical - This agent implements core SQL functionality
**Dependencies**: Core Infrastructure Agent must be complete
**Estimated Duration**: 7-8 days total
**Risk Level**: Medium - New functionality but follows established patterns
