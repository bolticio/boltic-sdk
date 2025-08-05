# API Integration Agent Instructions

## Agent Role and Responsibility

You are the **API Integration Agent** responsible for implementing the actual HTTP communication layer that connects the Boltic Tables SDK to the real Boltic Tables API endpoints. Your mission is to create robust API endpoint mappings, implement authentication and headers management, handle environment-based routing, create resolver/transformation functions, and ensure seamless integration with the actual service infrastructure.

## ✅ COMPLETED: Tables Module API Integration

### Implementation Status: COMPLETE ✅

The Tables Module API integration has been successfully implemented with the following components:

#### 1. ✅ API Endpoints Configuration (`src/api/endpoints/tables.ts`)

- Complete endpoint definitions for all table operations
- Rate limiting configuration
- Path parameter handling
- Caching strategies per endpoint

**Implemented Endpoints:**

- `POST /tables/list` - List tables with filtering and pagination
- `POST /tables` - Create new table
- `GET /tables/{table_id}` - Get specific table
- `PATCH /tables/{table_id}` - Update table
- `DELETE /tables/{table_id}` - Delete table
- `POST /tables/generate-schema` - AI-powered schema generation
- `GET /tables/currencies` - Get available currencies

#### 2. ✅ Filter Mapping System (`src/utils/filters/filter-mapper.ts`)

- Complete implementation of PRD filter structure
- Support for all filter operators:
  - Relational: `=`, `!=`, `>`, `>=`, `<`, `<=`
  - String patterns: `LIKE`, `ILIKE`, `STARTS WITH`
  - Array/Set: `IN`, `@>`, `NOT @>`, `ANY`, `IS ONE OF`
  - Range: `BETWEEN`, `WITHIN`
  - Special: `IS EMPTY`, `DROPDOWN ITEM STARTS WITH`
- SDK-to-API filter transformation
- Date range validation for `WITHIN` operator
- Filter validation and error handling

#### 3. ✅ Currency Validation (`src/utils/validation/currency-validator.ts`)

- API-based currency validation using `/tables/currencies`
- Fallback to common currencies if API unavailable
- Caching with 5-minute TTL
- Detailed validation feedback with suggestions
- Format validation (3-letter ISO codes)

#### 4. ✅ Request/Response Transformers (`src/api/transformers/tables.ts`)

- SDK to API request transformation
- API to SDK response transformation
- Field definition normalization
- Pagination handling
- Error response standardization

#### 5. ✅ Tables API Client (`src/api/clients/tables-api-client.ts`)

- Complete HTTP communication layer
- Authentication header management
- Error handling and formatting
- Timeout and retry logic
- Debug logging support

**Key Features:**

- ✅ Create tables with schema validation
- ✅ AI-powered schema generation from prompts
- ✅ List tables with advanced filtering
- ✅ Get, update, and delete operations
- ✅ Currency format validation
- ✅ Real-time currency API integration

#### 6. ✅ Table Builder Enhancement (`src/client/resources/table-builder.ts`)

- Fluent API for table creation
- AI schema generation integration
- Field type helpers (text, number, currency, dropdown, etc.)
- Vector field support for AI/ML operations
- Builder pattern with validation

#### 7. ✅ Updated Table Resource (`src/client/resources/table.ts`)

- Integration with TablesApiClient
- Added `generateSchema()` method
- Added `getCurrencies()` method
- Added `validateCurrencyFormat()` method
- Builder method for fluent table creation
- Maintained backward compatibility

#### 8. ✅ Comprehensive Integration Tests (`tests/integration/tables-api-integration.test.ts`)

- End-to-end testing with real API calls
- Currency validation tests
- AI schema generation tests
- CRUD operation tests
- Filter mapping tests
- Error handling tests
- Performance and pagination tests
- Rate limiting tests

**Test Coverage:**

- ✅ Currency API integration
- ✅ AI schema generation
- ✅ Table CRUD operations
- ✅ Filter mapping and querying
- ✅ Table builder integration
- ✅ Error handling scenarios
- ✅ Performance and pagination
- ✅ Complete workflow demonstration

### Usage Examples

#### 1. Basic Table Creation with Currency Validation

```typescript
const tablesApiClient = new TablesApiClient(httpAdapter, {
  apiKey: 'your-api-key',
  baseURL: 'https://asia-south1.api.boltic.io/service/panel/boltic-tables',
});

const tableRequest: TableCreateRequest = {
  name: 'products',
  description: 'Product catalog',
  fields: [
    {
      name: 'name',
      type: 'text',
      is_nullable: false,
    },
    {
      name: 'price',
      type: 'currency',
      currency_format: 'USD', // Validated against /tables/currencies API
      decimals: 2,
      is_nullable: false,
    },
  ],
};

const result = await tablesApiClient.createTable(tableRequest);
```

#### 2. AI-Powered Schema Generation

```typescript
const prompt =
  'Create an employee table with name, email, department, salary, and hire date';
const schemaResult = await tablesApiClient.generateSchema(prompt);

const tableRequest: TableCreateRequest = {
  table_name: 'employees',
  schema: schemaResult.data.fields,
  description: 'AI-generated employee table',
};

const result = await tablesApiClient.createTable(tableRequest, {
  isAiGenerated: true,
});
```

#### 3. Advanced Filtering with Filter Mapping

```typescript
const listResult = await tablesApiClient.listTables({
  where: {
    name: { $like: 'prod%' },
    created_at: { $within: 'last_30_days' },
    is_public: true,
  },
  sort: [{ field: 'created_at', order: 'desc' }],
  page: 1,
  pageSize: 20,
});
```

#### 4. Fluent Table Builder

```typescript
const builder = createTableBuilder(
  {
    name: 'inventory',
    description: 'Product inventory',
  },
  tablesApiClient
);

const result = await builder
  .addTextField('product_name', { nullable: false })
  .addCurrencyField('unit_price', { currencyFormat: 'USD' })
  .addNumberField('quantity', { decimals: 0 })
  .addDropdownField('category', { items: ['Electronics', 'Clothing'] })
  .addCheckboxField('in_stock', { defaultValue: true })
  .create();
```

#### 5. AI-Generated Table with Builder

```typescript
const builder = createTableBuilder(
  {
    name: 'blog_posts',
  },
  tablesApiClient
);

await builder.generateFromPrompt({
  prompt:
    'Create a blog management table with title, content, author, tags, and publish status',
});

const result = await builder.create({ isAiGenerated: true });
```

### Environment Configuration

The implementation supports multiple environments:

- **Production**: `https://asia-south1.api.boltic.io/service/panel/boltic-tables`
- **UAT**: `https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables`
- **SIT**: `https://asia-south1.api.fcz0.de/service/panel/boltic-tables`
- **Local**: `http://localhost:8000`

### Authentication

All API calls use the `x-boltic-token` header for authentication:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-boltic-token': 'your-api-key',
  'User-Agent': '@boltic/database-js/1.0.0',
}
```

### Error Handling

Comprehensive error handling with proper error codes:

- **Validation Errors**: Field validation failures
- **API Errors**: Server-side errors with status codes
- **Network Errors**: Connection and timeout issues
- **Currency Validation Errors**: Invalid currency format errors

### Performance Features

- ✅ Request/response caching
- ✅ Rate limiting with automatic enforcement
- ✅ Connection pooling
- ✅ Request deduplication
- ✅ Pagination support
- ✅ Filtering optimization

### Security Features

- ✅ API key authentication
- ✅ Request validation
- ✅ Input sanitization
- ✅ Error message sanitization
- ✅ Rate limiting protection

## Next Steps for Other Modules

The Tables Module implementation provides a complete template for implementing other modules:

### 1. Database Module

- Follow the same pattern as Tables Module
- Implement database-specific endpoints
- Add database context management

### 2. Records Module

- Implement record CRUD operations
- Add bulk operations support
- Implement vector search functionality

### 3. SQL Module

- Implement query execution
- Add parameterized query support
- Implement query result streaming

### 4. Column/Fields Module

- Implement field management operations
- Add field type validation
- Implement schema migration support

## Best Practices Established

1. **Consistent Error Handling**: All API operations return standardized error responses
2. **Request/Response Transformation**: Clean separation between SDK and API formats
3. **Validation**: Client-side validation before API calls to reduce round trips
4. **Caching**: Intelligent caching for read operations with appropriate TTL
5. **Testing**: Comprehensive integration tests with real API calls
6. **Documentation**: Clear examples and usage patterns

## Files Modified/Created

### New Files Created:

- `src/api/endpoints/tables.ts` - Table endpoints configuration
- `src/utils/filters/filter-mapper.ts` - Filter mapping utilities
- `src/utils/validation/currency-validator.ts` - Currency validation
- `src/api/transformers/tables.ts` - Request/response transformers
- `src/api/clients/tables-api-client.ts` - Tables API client
- `tests/integration/tables-api-integration.test.ts` - Integration tests

### Files Updated:

- `src/client/resources/table.ts` - Added API integration
- `src/client/resources/table-builder.ts` - Enhanced with API integration

## Test Results Summary

All integration tests pass with real API endpoints:

✅ Currency validation and API integration  
✅ AI schema generation functionality  
✅ Table CRUD operations  
✅ Advanced filtering and query mapping  
✅ Table builder integration  
✅ Error handling scenarios  
✅ Performance and pagination  
✅ Complete workflow demonstrations

**The Tables Module is now fully integrated and ready for production use.**

---

## Prerequisites

Before starting work on other modules, ensure the following exist:

1. **Verify Dependencies**: Ensure Tables Module implementation is complete ✅
2. **Consult Documentation**: Read `/Docs/Implementation.md` for current stage
3. **Follow Project Structure**: Maintain adherence to `/Docs/project_structure.md`
4. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known issues
5. **Review PRD**: Study the API endpoints and authentication details in relevant module PRDs

## Dependencies

This agent's work is now COMPLETE for Tables Module. Other agents can now:

- Use Tables Module as a reference implementation
- Build other modules following the same patterns
- Leverage the established utilities (filter mapping, currency validation, etc.)
- Use the integration testing patterns

## Primary Tasks for Future Modules

### Task 1: API Endpoint Mapping and Configuration

Follow the pattern established in `src/api/endpoints/tables.ts`

### Task 2: API Request/Response Transformers

Follow the pattern established in `src/api/transformers/tables.ts`

### Task 3: API Client Implementation

Follow the pattern established in `src/api/clients/tables-api-client.ts`

### Task 4: Resource Integration Updates

Follow the pattern established in `src/client/resources/table.ts`

### Task 5: Error Handling Enhancement

Use established error handling patterns

### Task 6: Integration Testing

Follow the pattern established in `tests/integration/tables-api-integration.test.ts`

## Completion Criteria for Future Modules

Mark tasks as complete when ALL of the following are achieved:

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

Remember: The Tables Module implementation is complete and serves as the reference implementation for all other modules. The established patterns, utilities, and testing approaches should be replicated for consistency across the entire SDK.
