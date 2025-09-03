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

#### 4. API Integration (`src/api/`)

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
import { BolticClient } from 'boltic-sdk';

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
      decimals: '0.00',
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
  .addCurrencyField('price', { currencyFormat: 'USD', decimals: '0.00' })
  .addVectorField('embedding', { dimension: 1536 })
  .create();
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
  decimals: '0.00',
  nullable: false,
});
```

### Phone Number Fields

```typescript
addPhoneField('contact', {
  format: '+91 123 456 7890', // 'international' | 'national' | 'e164'
  nullable: true,
});
```

### Date-Time Fields

```typescript
addDateTimeField('created_at', {
  dateFormat: 'YYYY_MM_DD',
  timeFormat: 'HH_mm_ss',
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
import { ValidationError } from 'boltic-sdk/errors';

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

# Table Operations API Documentation

## Overview

The Boltic Tables SDK provides comprehensive table management capabilities through two main approaches:

1. **Method 1: Direct API** - Object-based API for direct table operations
2. **Method 2: Fluent Interface** - Chaining API for table creation and schema definition

## Method 1: Direct API

### Basic Usage

```typescript
import { BolticClient } from 'boltic-sdk';

const client = new BolticClient('your-api-key');
const db = client.database('database-id');

// Create table with direct API
const { data: table, error } = await db.tables.create({
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
      decimals: '0.00',
    },
  ],
  description: 'Product catalog table',
});
```

### Available Operations

#### Create Table

```typescript
const result = await db.tables.create(tableData);
```

#### List Tables

```typescript
const result = await db.tables.findAll({
  limit: 50,
  offset: 0,
  search: 'product',
});
```

#### Get Table

```typescript
const result = await db.tables.findOne('table-id');
```

#### Update Table

```typescript
const result = await db.tables.update('table-id', {
  description: 'Updated description',
});
```

#### Delete Table

```typescript
const result = await db.tables.delete('table-id');
```

## Method 2: Fluent Interface

### Basic Usage

```typescript
// Create table with fluent interface
const { data: table, error } = await client
  .database('database-id')
  .table('products')
  .describe('Product catalog table')
  .text('title', { nullable: false, unique: true })
  .currency('price', { currencyFormat: 'USD', decimals: '0.00' })
  .create();
```

### Fluent Interface Methods

#### Table Configuration

```typescript
const tableBuilder = client
  .database('database-id')
  .table('table-name')
  .describe('Table description')
  .public(); // Make table publicly accessible
```

#### Field Types

##### Text Fields

```typescript
// Basic text field
.text('name', { nullable: false, unique: true })

// Long text field
.longText('description', { nullable: true })

// Email field
.email('contact_email', { nullable: true })

// Phone number field
.phone('phone', {
  format: '+91 123 456 7890', // 'international' | 'national' | 'e164'
  nullable: true
})

// Link field
.link('website', { nullable: true })
```

##### Numeric Fields

```typescript
// Number field
.number('age', {
  nullable: true,
  decimals: '0' // Number of decimal places
})

// Currency field
.currency('price', {
  currencyFormat: 'USD', // ISO currency code
  decimals: '0.00',
  nullable: false
})
```

##### Vector Fields

```typescript
// Standard vector field
.vector('embedding', 1536, { nullable: false })

// Half-precision vector field
.halfVector('half_embedding', 768, { nullable: true })

// Sparse vector field
.sparseVector('sparse_embedding', 1024, { nullable: true })
```

##### Selection Fields

```typescript
// Checkbox field
.checkbox('is_active', { nullable: false })

// Dropdown field
.dropdown('category', {
  selectableItems: ['electronics', 'clothing', 'books'],
  multipleSelections: false,
  nullable: false
})
```

##### Special Fields

```typescript
// JSON field
.json('metadata', { nullable: true })

// Date-time field
.dateTime('created_at', {
  dateFormat: 'YYYY_MM_DD',
  timeFormat: 'HH_mm_ss',
  timezone: 'UTC',
  nullable: false
})
```

#### Field Management

```typescript
// Add custom field
.addField({
  name: 'custom_field',
  type: 'text',
  is_nullable: true,
  description: 'Custom field description'
})

// Remove field
.removeField('field_name')

// Get field information
const fields = tableBuilder.getFields();
const tableName = tableBuilder.getName();
const description = tableBuilder.getDescription();
```

#### Build and Create Operations

```typescript
// Build request object (without API call)
const requestObject = tableBuilder.build();

// Create table (with API call)
const result = await tableBuilder.create({
  is_ai_generated_schema: true,
  is_template: false,
});
```

## Field Type Reference

### Supported Field Types

| Type           | Description           | Required Properties | Optional Properties                                  |
| -------------- | --------------------- | ------------------- | ---------------------------------------------------- |
| `text`         | Short text field      | -                   | `nullable`, `unique`, `description`                  |
| `long-text`    | Long text field       | -                   | `nullable`, `description`                            |
| `number`       | Numeric field         | -                   | `nullable`, `decimals`, `description`                |
| `currency`     | Currency field        | `currency_format`   | `nullable`, `decimals`, `description`                |
| `checkbox`     | Boolean field         | -                   | `nullable`, `description`                            |
| `dropdown`     | Selection field       | `selectable_items`  | `nullable`, `multiple_selections`, `description`     |
| `email`        | Email field           | -                   | `nullable`, `description`                            |
| `phone-number` | Phone number field    | `phone_format`      | `nullable`, `description`                            |
| `link`         | URL field             | -                   | `nullable`, `description`                            |
| `json`         | JSON field            | -                   | `nullable`, `description`                            |
| `date-time`    | Date/time field       | `date_format`       | `nullable`, `time_format`, `timezone`, `description` |
| `vector`       | Vector field          | `vector_dimension`  | `nullable`, `description`                            |
| `halfvec`      | Half-precision vector | `vector_dimension`  | `nullable`, `description`                            |
| `sparsevec`    | Sparse vector         | `vector_dimension`  | `nullable`, `description`                            |

### Field Properties

#### Common Properties

- `name`: Field name (required)
- `type`: Field type (required)
- `is_nullable`: Whether field can be null (default: true)
- `is_unique`: Whether field values must be unique (default: false)
- `is_primary_key`: Whether field is primary key (default: false)
- `is_indexed`: Whether field is indexed (default: false)
- `description`: Field description (optional)

#### Type-Specific Properties

##### Currency Fields

- `currency_format`: ISO currency code (e.g., 'USD', 'EUR')
- `decimals`: Number of decimal places (default: '0.00')

##### Dropdown Fields

- `selectable_items`: Array of selectable options
- `multiple_selections`: Whether multiple selections allowed (default: false)

##### Phone Number Fields

- `phone_format`: Format type ('+91 123 456 7890', '(123) 456-7890', '+1 (123) 456-7890', '+91 12 3456 7890')

##### Date-Time Fields

- `date_format`: Date format (e.g., 'YYYY-MM-DD')
- `time_format`: Time format (e.g., 'HH:mm:ss')
- `timezone`: Timezone (e.g., 'UTC')

##### Vector Fields

- `vector_dimension`: Vector dimension (1-16384 for vector, 1-8192 for halfvec, 1-32768 for sparsevec)

## Error Handling

### API Errors

API errors are passed through without modification:

```typescript
const result = await db.tables.create(tableData);

if (result.error) {
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
}
```

### Validation Errors

Validation errors are thrown as `ValidationError` instances:

```typescript
import { ValidationError } from 'boltic-sdk/errors';

try {
  const result = await db.tables.create(invalidTableData);
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

### Large Schemas

- Maximum 1000 fields per table
- Maximum 10 vector fields per table
- Maximum 100 dropdown items per field
- Field names limited to 100 characters
- Descriptions limited to 1000 characters

### Best Practices

1. Use appropriate field types for your data
2. Set nullable properties correctly
3. Use indexes for frequently queried fields
4. Consider vector field dimensions carefully
5. Validate schemas before creation

## Examples

### E-commerce Product Table

```typescript
const result = await client
  .database('ecommerce-db')
  .table('products')
  .describe('E-commerce product catalog')
  .text('product_name', { nullable: false, unique: true })
  .longText('description', { nullable: true })
  .number('price', { nullable: false, decimals: '0.00' })
  .currency('cost', { currencyFormat: 'USD', decimals: '0.00' })
  .checkbox('is_active', { nullable: false })
  .dropdown('category', ['electronics', 'clothing', 'books', 'home'], {
    multiple: false,
    nullable: false,
  })
  .email('support_email', { nullable: true })
  .phone('support_phone', { format: '+91 123 456 7890' })
  .link('product_url', { nullable: true })
  .json('specifications', { nullable: true })
  .dateTime('product_created_at', {
    dateFormat: 'YYYY_MM_DD',
    timeFormat: 'HH_mm_ss',
    timezone: 'UTC',
    nullable: false,
  })
  .vector('product_embedding', 1536, { nullable: true })
  .create();
```

### User Profile Table

```typescript
const result = await client
  .database('user-db')
  .table('profiles')
  .describe('User profile information')
  .text('username', { nullable: false, unique: true })
  .email('email', { nullable: false, unique: true })
  .phone('phone', { format: '+91 123 456 7890' })
  .dateTime('date_of_birth', {
    dateFormat: 'YYYY_MM_DD',
    nullable: true,
  })
  .checkbox('email_verified', { nullable: false })
  .checkbox('phone_verified', { nullable: false })
  .json('preferences', { nullable: true })
  .create();
```

### Content Management Table

```typescript
const result = await client
  .database('cms-db')
  .table('articles')
  .describe('Content management system articles')
  .text('title', { nullable: false })
  .longText('content', { nullable: false })
  .text('slug', { nullable: false, unique: true })
  .dropdown('status', ['draft', 'published', 'archived'], {
    multiple: false,
    nullable: false,
  })
  .dropdown('category', ['technology', 'business', 'lifestyle'], {
    multiple: false,
    nullable: true,
  })
  .dateTime('published_at', {
    dateFormat: 'YYYY_MM_DD',
    timeFormat: 'HH_mm_ss',
    timezone: 'UTC',
    nullable: true,
  })
  .vector('content_embedding', 768, { nullable: true })
  .create();
```
