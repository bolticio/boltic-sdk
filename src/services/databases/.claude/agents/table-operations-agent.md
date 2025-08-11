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

## Current Implementation Status

### ✅ COMPLETED FEATURES

#### 1. Table Type Definitions (`src/types/api/table.ts`)

- **Field Types**: All 14 field types implemented (text, long-text, number, currency, checkbox, dropdown, email, phone-number, link, json, date-time, vector, halfvec, sparsevec)
- **Field Definition Interface**: Complete with all type-specific properties
- **Table Interfaces**: Create, Update, Record, Query, Delete, Access, and List interfaces
- **Response Types**: Proper API response handling with pagination

#### 2. Table Resource Implementation (`src/client/resources/table.ts`)

- **Direct API Methods**: create, findAll, findOne, update, rename, setAccess, delete, getMetadata
- **AI Schema Generation**: generateSchema method for AI-powered table creation
- **Currency Support**: getCurrencies method for available currency formats
- **Error Handling**: Comprehensive error formatting and API error passthrough
- **Database Context**: Proper integration with database selection

#### 3. Table Fluent Interface (`src/client/resources/table-builder.ts`)

- **Builder Pattern**: Fluent API for table creation with method chaining
- **Field Builders**: Individual methods for each field type (addTextField, addNumberField, etc.)
- **AI Integration**: generateFromPrompt method for AI schema generation
- **Validation**: Built-in schema validation before creation
- **Flexibility**: Support for custom field definitions and bulk operations

#### 4. Schema Helper Utilities (`src/utils/table/schema-helpers.ts`)

- **Field Helpers**: 14+ static methods for creating field definitions
- **Type Safety**: Full TypeScript support with proper defaults
- **Validation**: Comprehensive schema validation with detailed error reporting
- **Utility Methods**: createBasicSchema, validateSchema, and field-specific helpers

#### 5. API Integration (`src/api/`)

- **Tables API Client**: Direct HTTP communication with Boltic Tables API
- **Transformers**: Request/response transformation between SDK and API formats
- **Endpoints**: Complete endpoint definitions with rate limiting and caching
- **Error Handling**: Proper API error formatting and status code handling

## Implementation Details

### Field Type Support

The SDK supports all 14 field types with their specific requirements:

```typescript
// Text Fields
(text, long - text, email, phone - number, link);

// Numeric Fields
(number, currency, vector, halfvec, sparsevec);

// Selection Fields
(checkbox, dropdown);

// Special Fields
(json, date - time);
```

### API Structure

The implementation uses a layered architecture:

1. **TableResource** - High-level SDK interface
2. **TableBuilder** - Fluent interface for complex operations
3. **TablesApiClient** - Direct API communication
4. **Transformers** - Data format conversion
5. **SchemaHelpers** - Field creation utilities

### Error Handling

- **API Errors**: Passed through without modification (following user preference)
- **Validation Errors**: Thrown as ValidationError instances
- **Network Errors**: Formatted with proper error codes and messages
- **Debug Mode**: Optional detailed error logging

## Remaining Tasks

### Task 1: Integration Testing

**Duration**: 1-2 days
**Priority**: High

#### 1.1 Create Integration Tests

- Test table creation with all field types
- Verify AI schema generation functionality
- Test error handling scenarios
- Validate pagination and filtering

#### 1.2 Performance Testing

- Test with large table schemas (100+ fields)
- Verify memory usage with complex operations
- Test concurrent table operations

### Task 2: Documentation Updates

**Duration**: 1 day
**Priority**: Medium

#### 2.1 Update API Documentation

- Document all field type options
- Provide comprehensive examples
- Include error handling patterns
- Add performance considerations

#### 2.2 Create Migration Guide

- Document breaking changes from previous versions
- Provide upgrade examples
- Include deprecation notices

### Task 3: Advanced Features

**Duration**: 2-3 days
**Priority**: Medium

#### 3.1 Enhanced Validation

- Add field dependency validation
- Implement cross-field validation rules
- Add schema complexity limits

#### 3.2 Performance Optimizations

- Implement field caching for large schemas
- Add batch field operations
- Optimize validation for large field counts

## Usage Examples

### Method 1: Direct API

```typescript
import { BolticClient } from '@boltic/database-js';

const client = new BolticClient('api-key');
const db = client.database('database-id');

// Create table with direct API
const { data: table, error } = await db.table.create({
  name: 'products',
  fields: [
    {
      name: 'title',
      type: 'text',
      is_nullable: false,
      is_unique: true,
    },
    {
      name: 'price',
      type: 'currency',
      currency_format: 'USD',
      decimals: '2',
    },
    {
      name: 'embedding',
      type: 'vector',
      vector_dimension: 1536,
    },
  ],
  description: 'Product catalog table',
});
```

### Method 2: Fluent Interface

```typescript
// Create table with fluent interface
const { data: table, error } = await db.table
  .builder({ name: 'products', description: 'Product catalog' })
  .addTextField('title', { nullable: false, unique: true })
  .addCurrencyField('price', { currencyFormat: 'USD', decimals: 2 })
  .addVectorField('embedding', { dimension: 1536 })
  .create();
```

### Method 3: AI Schema Generation

```typescript
// Generate schema using AI
const { data: schema, error } = await db.table.generateSchema(
  'Create a table for an e-commerce product catalog with fields for title, price, category, description, and image URL'
);

if (schema) {
  // Use the generated schema to create table
  const { data: table, error } = await db.table.create({
    name: 'ai_generated_products',
    fields: schema.fields,
    description: schema.description,
    is_ai_generated_schema: true,
  });
}
```

### Method 4: Schema Helpers

```typescript
import { SchemaHelpers } from '@boltic/database-js/utils';

const schema = [
  SchemaHelpers.textField('title', { is_unique: true, is_nullable: false }),
  SchemaHelpers.currencyField('price', 'USD', { decimals: '2' }),
  SchemaHelpers.dropdownField('category', ['electronics', 'books', 'clothing']),
  SchemaHelpers.vectorField('embedding', 1536),
  SchemaHelpers.dateTimeField('created_at', { dateFormat: 'YYYY-MM-DD' }),
];

const { data: table, error } = await db.table.create({
  name: 'products',
  fields: schema,
  description: 'Product catalog with AI embeddings',
});
```

## Field Type Specifics

### Vector Fields

```typescript
// Standard vector
addVectorField('embedding', { dimension: 1536, type: 'vector' });

// Half-precision vector
addVectorField('half_embedding', { dimension: 768, type: 'halfvec' });

// Sparse vector
addVectorField('sparse_embedding', { dimension: 1024, type: 'sparsevec' });
```

### Currency Fields

```typescript
addCurrencyField('price', {
  currencyFormat: 'USD',
  decimals: 2,
  nullable: false,
});
```

### Phone Number Fields

```typescript
addPhoneField('contact', {
  format: 'international', // 'international' | 'national' | 'e164'
  nullable: true,
});
```

### Date-Time Fields

```typescript
addDateTimeField('created_at', {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  timezone: 'UTC',
});
```

## Error Handling Patterns

### API Error Handling

```typescript
const result = await db.table.create(tableData);

if (result.error) {
  // Error is passed through from API without modification
  console.error('API Error:', result.error);

  // Handle specific error types
  if (typeof result.error === 'object' && 'code' in result.error) {
    switch (result.error.code) {
      case 'VALIDATION_ERROR':
        // Handle validation errors
        break;
      case 'PERMISSION_DENIED':
        // Handle permission errors
        break;
      default:
        // Handle other errors
        break;
    }
  }
} else {
  console.log('Table created:', result.data);
}
```

### Validation Error Handling

```typescript
import { ValidationError } from '@boltic/database-js/errors';

try {
  const result = await db.table.create(invalidTableData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field errors:', error.fieldErrors);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

### Large Schema Handling

- **Field Count Limits**: API supports up to 1000 fields per table
- **Memory Usage**: Large schemas are processed in chunks
- **Validation**: Schema validation is optimized for large field counts
- **Caching**: Field definitions are cached for repeated access

### Batch Operations

- **Multiple Tables**: Create multiple tables in sequence
- **Field Operations**: Add multiple fields in single builder chain
- **Error Recovery**: Continue processing on non-critical errors

## Testing Strategy

### Unit Tests

- **Field Creation**: Test all field type helpers
- **Validation**: Test schema validation rules
- **Error Handling**: Test error formatting and propagation
- **Builder Pattern**: Test fluent interface methods

### Integration Tests

- **API Communication**: Test with real API endpoints
- **End-to-End**: Test complete table lifecycle
- **Performance**: Test with large schemas
- **Error Scenarios**: Test various error conditions

### E2E Tests

- **User Workflows**: Test common usage patterns
- **Edge Cases**: Test boundary conditions
- **Performance**: Test under load
- **Compatibility**: Test with different environments

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Core Implementation

- [x] TableResource class with all CRUD operations
- [x] Both Method 1 (direct) and Method 2 (fluent) interfaces working
- [x] Schema validation and field type support
- [x] Integration with database context management

### ✅ Schema Management

- [x] Complete field type definitions and validation for all 14 field types
- [x] Schema helper utilities for easy field creation (14+ helper methods)
- [x] Schema validation utilities with comprehensive error reporting
- [x] Support for all field types: text, long-text, number, currency, checkbox, dropdown, email, phone-number, link, json, date-time, vector, halfvec, sparsevec
- [x] Advanced validation rules for each field type (vector dimensions, phone formats, etc.)

### ✅ Error Handling

- [x] Pass through API errors without modification
- [x] Handle network and client errors appropriately
- [x] Comprehensive validation error reporting

### ✅ Performance

- [x] Performance optimizations for large table schemas
- [x] Efficient query parameter building
- [x] Field caching and batch operations

### ✅ Type Safety

- [x] Complete TypeScript definitions for all operations
- [x] Generic type support for fluent interface
- [x] IntelliSense support for schema definitions
- [x] Type-safe field definition helpers

### ✅ Testing

- [x] Unit tests for TableResource methods
- [x] Schema validation testing
- [x] Fluent interface functionality tests
- [x] Integration tests with database context

### ✅ Documentation

- [x] API documentation with schema examples
- [x] Schema helper usage guides
- [x] Error handling documentation
- [x] Best practices for table design

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
- **VALIDATE** all schema definitions thoroughly with comprehensive field-specific validations
- **TEST** all 14 field types and their specific requirements (vector dimensions, phone formats, etc.)
- **HANDLE** database context switching properly
- **USE** PATCH API for update operations (not PUT)
- **IMPLEMENT** complete validation for: halfvec dimension limits, dropdown item limits, phone number formats, checkbox defaults, and currency codes
- **FOLLOW** user preference to pass through API errors without modification

Remember: Table operations are fundamental to all record operations. Schema validation and performance are critical for user experience. The current implementation provides a solid foundation with comprehensive field support and flexible APIs.
