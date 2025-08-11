# Record Operations Agent Instructions

## Agent Role and Responsibility

You are the **Record Operations Agent** responsible for implementing all record/data operations for the Boltic Tables SDK. Your mission is to create comprehensive record CRUD functionality, support both direct and fluent API styles, implement advanced querying capabilities.

## Current Implementation Status

**✅ COMPLETED TASKS:**

- Record type definitions in `src/types/api/record.ts`
- Records API client in `src/api/clients/records-api-client.ts`
- Record endpoints configuration in `src/api/endpoints/records.ts`
- Record transformers in `src/api/transformers/records.ts`
- Record resource implementation in `src/client/resources/record.ts`

**🔄 IN PROGRESS:**

- Record fluent interface (Method 2) - RecordBuilder class
- Integration with main BolticClient

**❌ PENDING:**

- Complete fluent interface implementation
- Integration testing and validation

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
- Authentication, and error handling systems

## Implementation Learnings

### Key Architectural Decisions Made

1. **API Client Pattern**: Implemented dedicated `RecordsApiClient` class for all record operations
2. **Endpoint Configuration**: Centralized endpoint definitions with path parameter support
3. **Transformer Layer**: Added transformers for request/response format consistency
4. **Table ID Resolution**: Used `TableResource.getTableId()` static method for table name to ID conversion
5. **Error Handling**: Consistent error response format with proper error codes and messages
6. **HTTP Method Mapping**:
   - POST for insert and list operations
   - PATCH for update operations (both by filters and by ID)
   - DELETE for delete operations

### API Contract Compliance

- ✅ **Insert**: POST `/tables/{table_id}/records` with record data
- ✅ **List**: POST `/tables/{table_id}/records/list` with filters, pagination, and sorting
- ✅ **Get**: GET `/tables/{table_id}/records/{record_id}` for single record retrieval
- ✅ **Update by Filters**: PATCH `/tables/{table_id}/records` with set data and filters
- ✅ **Update by ID**: PATCH `/tables/{table_id}/records/{record_id}` with merged data
- ✅ **Delete by Filters**: DELETE `/tables/{table_id}/records` with filters
- ✅ **Delete by IDs**: DELETE `/tables/{table_id}/records` with record_ids array

### Data Flow Architecture

```
SDK Method → RecordResource → RecordsApiClient → HTTP Adapter → API Endpoint
    ↓              ↓              ↓              ↓
Response ← ApiResponse ← Transformed Data ← Raw API Response
```

## Remaining Tasks

### Task 1: Complete Record Fluent Interface (Method 2)

**Duration**: 1-2 days
**Priority**: Critical

#### 1.1 Create Record Fluent Builder

Create `src/client/resources/record-builder.ts`:

```typescript
import { RecordResource } from './record';
import {
  RecordData,
  RecordQueryOptions,
  RecordWithId,
} from '../../types/api/record';
import { ApiResponse } from '../../types/common/responses';

export class RecordBuilder {
  private recordResource: RecordResource;
  private tableName: string;
  private queryOptions: RecordQueryOptions = {
    page: { page_no: 1, page_size: 100 },
    filters: [],
    sort: [],
  };
  private updateData: Partial<RecordData> = {};

  constructor(recordResource: RecordResource, tableName: string) {
    this.recordResource = recordResource;
    this.tableName = tableName;
  }

  /**
   * Add filter conditions to the query
   */
  where(field: string, operator: string | any, value?: any): RecordBuilder;
  where(filters: any[]): RecordBuilder;
  where(
    fieldOrFilters: string | any[],
    operator?: string | any,
    value?: any
  ): RecordBuilder {
    if (typeof fieldOrFilters === 'string') {
      // Handle individual field conditions
      if (value === undefined) {
        // where('field', value) syntax
        this.queryOptions.filters.push({
          field: fieldOrFilters,
          operator: 'eq',
          value: operator,
        });
      } else {
        // where('field', 'operator', value) syntax
        this.queryOptions.filters.push({
          field: fieldOrFilters,
          operator: operator,
          value: value,
        });
      }
    } else {
      // Handle array of filters
      this.queryOptions.filters = [
        ...this.queryOptions.filters,
        ...fieldOrFilters,
      ];
    }
    return this;
  }

  /**
   * Specify fields to select
   */
  select(fields: string[]): RecordBuilder {
    // Note: Field selection is handled by the API server
    // This method is kept for API compatibility but doesn't affect the request
    return this;
  }

  /**
   * Add sorting to the query
   */
  orderBy(field: string, order: 'asc' | 'desc' = 'asc'): RecordBuilder {
    this.queryOptions.sort.push({ field, order });
    return this;
  }

  /**
   * Set pagination page size
   */
  limit(count: number): RecordBuilder {
    this.queryOptions.page.page_size = count;
    return this;
  }

  /**
   * Set pagination page number
   */
  offset(count: number): RecordBuilder {
    this.queryOptions.page.page_no = count;
    return this;
  }

  /**
   * Include total count in results
   */
  withCount(): RecordBuilder {
    // Note: Total count is always included in the response
    // This method is kept for API compatibility but doesn't affect the request
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
   * Execute insert operation
   */
  async insert(data: RecordData): Promise<ApiResponse<RecordWithId>> {
    return this.recordResource.insert(this.tableName, data);
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
    if (!this.queryOptions.filters || this.queryOptions.filters.length === 0) {
      throw new Error('Update operation requires filter conditions');
    }

    return this.recordResource.update(this.tableName, {
      set: this.updateData,
      filters: this.queryOptions.filters,
    });
  }

  /**
   * Execute update by ID operation
   */
  async updateById(id: string): Promise<ApiResponse<RecordWithId>> {
    return this.recordResource.updateById(this.tableName, {
      id,
      set: this.updateData,
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<any>> {
    if (!this.queryOptions.filters || this.queryOptions.filters.length === 0) {
      throw new Error('Delete operation requires filter conditions');
    }

    return this.recordResource.delete(this.tableName, {
      filters: this.queryOptions.filters,
    });
  }

  /**
   * Execute delete by IDs operation
   */
  async deleteByIds(recordIds: string[]): Promise<ApiResponse<any>> {
    return this.recordResource.deleteByIds(this.tableName, {
      record_ids: recordIds,
    });
  }
}
```

### Task 2: Integration with Main Client

**Duration**: 1-2 days
**Priority**: Critical

#### 2.1 Update BolticClient for Record Operations

Update `src/client/boltic-client.ts` to add record operations:

```typescript
// Add imports at the top
import { RecordResource } from './resources/record';
import { RecordBuilder } from './resources/record-builder';

// Add to the BolticClient class:

export class BolticClient {
  // ... existing code ...

  private recordResource: RecordResource;

  constructor(apiKey: string, options: ClientOptions = {}) {
    // ... existing initialization code ...

    // Initialize record operations
    this.recordResource = new RecordResource(this.baseClient);
  }

  // Method 1: Direct record operations
  get record() {
    return {
      insert: (tableName: string, data: any) =>
        this.recordResource.insert(tableName, data),
      findAll: (tableName: string, options?: any) =>
        this.recordResource.findAll(tableName, options),
      findOne: (tableName: string, options: any) =>
        this.recordResource.findOne(tableName, options),
      update: (tableName: string, options: any) =>
        this.recordResource.update(tableName, options),
      updateById: (tableName: string, options: any) =>
        this.recordResource.updateById(tableName, options),
      delete: (tableName: string, options: any) =>
        this.recordResource.delete(tableName, options),
      deleteByIds: (tableName: string, options: any) =>
        this.recordResource.deleteByIds(tableName, options),
    };
  }

  // Method 2: Fluent interface
  table(tableName: string): RecordBuilder {
    return new RecordBuilder(this.recordResource, tableName);
  }
}
```

## Current Implementation Details

### RecordResource Class Features

- ✅ **Table ID Resolution**: Uses `TableResource.getTableId()` for table name to ID conversion
- ✅ **Error Handling**: Consistent error response format with proper error codes
- ✅ **API Client Integration**: Direct integration with `RecordsApiClient`
- ✅ **CRUD Operations**: All basic operations implemented and tested
- ✅ **Update by ID**: Fetches existing record and merges with user payload
- ✅ **Delete Operations**: Supports both filter-based and ID-based deletion

### RecordsApiClient Features

- ✅ **Environment Configuration**: Supports local, sit, uat, and prod environments
- ✅ **HTTP Method Mapping**: Correct HTTP methods for each operation type
- ✅ **Error Formatting**: Consistent error response format
- ✅ **Request/Response Handling**: Proper data transformation and validation
- ✅ **Authentication**: API key-based authentication with proper headers

### API Endpoints Configuration

- ✅ **Centralized Configuration**: All endpoints defined in one place
- ✅ **Path Parameter Support**: Dynamic path building with parameter replacement
- ✅ **Method Specification**: Clear HTTP method for each operation
- ✅ **Authentication Flags**: Proper authentication requirements
- ✅ **Rate Limiting**: Rate limit configuration for list and get operations

## API Contract Compliance Status

### ✅ Fully Implemented

- **Insert Record**: POST `/tables/{table_id}/records`
- **List Records**: POST `/tables/{table_id}/records/list`
- **Get Record**: GET `/tables/{table_id}/records/{record_id}`
- **Update by Filters**: PATCH `/tables/{table_id}/records`
- **Update by ID**: PATCH `/tables/{table_id}/records/{record_id}`
- **Delete by Filters**: DELETE `/tables/{table_id}/records`
- **Delete by IDs**: DELETE `/tables/{table_id}/records`

### Request/Response Format Compliance

- ✅ **Filters Array**: Uses `filters` array structure for all query operations
- ✅ **Pagination**: Supports `{ page_no, page_size }` pagination structure
- ✅ **Sorting**: Supports `sort` array for ordering results
- ✅ **Update by ID**: Fetches existing record and merges with user payload
- ✅ **Error Handling**: Consistent error response format
- ✅ **Data Transformation**: No validation - passes through all requests/responses as-is

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation (COMPLETED)

- [x] RecordResource class with all CRUD operations (no bulk operations)
- [x] Update by ID functionality with record fetching and merging
- [x] Delete multiple records by IDs functionality
- [x] RecordsApiClient with complete API integration
- [x] API endpoints configuration and path building
- [x] Request/response transformers

### ✅ API Integration (COMPLETED)

- [x] Direct API request/response handling without validation
- [x] Consistent pagination format matching List Records API contract
- [x] Proper error handling through API responses
- [x] Use of filters array instead of where conditions
- [x] POST /records/list endpoint for querying records
- [x] Update by ID: fetch existing record and merge with user payload
- [x] Delete multiple records by IDs using record_ids array
- [x] No OR operator support in filters

### 🔄 Integration (IN PROGRESS)

- [ ] Seamless integration with BolticClient
- [ ] Table and database context awareness
- [ ] Full fluent interface support
- [ ] Consistent with existing table/column patterns

### ❌ Type Safety (PENDING)

- [ ] Complete TypeScript definitions for all operations
- [ ] Generic type support for record data
- [ ] Type-safe query operators and conditions
- [ ] IntelliSense support for all record operations

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
- **MAINTAIN** consistency with List Records API contract
- **USE** filters array structure for all query operations
- **FOLLOW** the API contract exactly for request/response handling
- **NO VALIDATION** - pass through all requests and responses as-is
- **NO CACHING** - all operations are direct API calls
- **NO BULK OPERATIONS** - only single record operations are supported
- **USE** POST /records/list endpoint for querying records
- **USE** pagination structure: { page_no, page_size } for requests
- **UPDATE BY ID**: Fetch existing record and merge with user payload before update
- **DELETE MULTIPLE**: Support deleting multiple records by IDs using record_ids array
- **NO OR OPERATOR**: Where clause does not support OR operator
- **NO SQL OPERATIONS**: SQL functionality is not implemented

## Implementation Architecture Summary

The current implementation follows a clean, layered architecture:

1. **SDK Layer**: `RecordResource` provides the main interface
2. **API Client Layer**: `RecordsApiClient` handles HTTP communication
3. **Endpoint Layer**: Centralized endpoint configuration
4. **Transformer Layer**: Request/response format transformation
5. **HTTP Layer**: Abstracted HTTP adapter for different environments

This architecture provides:

- Clear separation of concerns
- Easy testing and mocking
- Consistent error handling
- Environment-specific configuration
- Type-safe operations

Remember: Record operations are the primary interface users will interact with. Follow the List Records API contract precisely and use the filters array structure for all query operations. Update by ID fetches existing records and merges with user payload. Delete operations support both filters and record IDs arrays.
