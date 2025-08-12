# Column Operations Guide

This guide covers all column/field operations available in the Boltic Tables SDK, including both direct API and fluent API approaches.

## Overview

The Column SDK provides comprehensive field management capabilities for tables, supporting all field types defined in the PRD with full CRUD operations, filtering, sorting, and pagination.

## Quick Start

```typescript
import { createClient } from '@boltic/database-js';

const client = createClient('your-api-key', {
  environment: 'sit',
});

// Method 1: Direct API - Single Column Creation
const result = await client.columns.create('my_table', {
  name: 'customer_name',
  type: 'text',
});

// Method 2: Direct API - Multiple Columns (creates one by one)
const result = await client.columns.create('my_table', {
  columns: [
    {
      name: 'customer_name',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      description: 'Customer email',
      is_unique: true,
    },
  ],
});

// Method 3: Fluent API (with custom values)
const result = await client
  .from('my_table')
  .column()
  .create({
    columns: [
      {
        name: 'email',
        type: 'email',
        description: 'Customer email',
        is_unique: true,
      },
    ],
  });
```

**Note**: Only `name` and `type` are required. All other properties have sensible defaults. The API supports creating one column at a time, but the SDK provides convenience methods for creating multiple columns.

## Default Values

The SDK provides sensible defaults for all column properties. Only `name` and `type` are required:

### Global Defaults

- `description`: `null`
- `default_value`: `null`
- `is_nullable`: `true`
- `is_indexed`: `false`
- `is_primary_key`: `false`
- `is_unique`: `false`
- `is_visible`: `true`
- `is_readonly`: `false`
- `alignment`: `"center"`

### Type-Specific Defaults

- **Numeric fields**: `decimals: "0.00"`
- **Currency fields**: `currency_format: "INR"`
- **Date-time fields**: `date_format: "MMDDYY"`, `timezone: "utc"`
- **Phone fields**: `phone_format: "+91 123 456 7890"`
- **Dropdown fields**: `selection_source: "provide-static-list"`

### Time Format

Time format is only set if explicitly provided by the user.

## Field Types

The SDK supports all field types defined in the PRD:

### Basic Types

- **text**: Simple text field
- **email**: Email address with validation
- **long-text**: Multi-line text field
- **number**: Numeric field with decimal support
- **currency**: Currency field with format support
- **checkbox**: Boolean field
- **phone-number**: Phone number with format support
- **link**: URL field
- **json**: JSON data field

### Advanced Types

- **date-time**: Date and time field with format support
- **dropdown**: Selection field with predefined options
- **vector**: Vector field for AI/ML operations
- **sparsevec**: Sparse vector field
- **halfvec**: Half-precision vector field

## API Methods

### Method 1: Direct API

#### Create Single Column

```typescript
const result = await client.columns.create(tableName, {
  name: 'customer_name',
  type: 'text',
  description: 'Customer full name',
  is_nullable: false,
  is_unique: false,
  is_indexed: true,
  is_primary_key: false,
  alignment: 'left',
});
```

#### Create Multiple Columns (one by one)

```typescript
const result = await client.columns.create(tableName, {
  columns: [
    {
      name: 'customer_name',
      type: 'text',
      description: 'Customer full name',
      is_nullable: false,
      is_unique: false,
      is_indexed: true,
      is_primary_key: false,
      alignment: 'left',
    },
    {
      name: 'balance',
      type: 'currency',
      description: 'Account balance',
      currency_format: 'USD',
      decimals: '0.00',
      is_nullable: false,
    },
  ],
});
```

#### List Columns

```typescript
// List all columns
const result = await client.columns.findAll(tableName);

// List with filtering and pagination
const result = await client.columns.findAll(tableName, {
  where: { type: 'text' },
  sort: [{ field: 'name', order: 'asc' }],
  limit: 10,
  offset: 0,
});
```

#### Find Column

```typescript
// Find by name
const result = await client.columns.findOne(tableName, {
  where: { name: 'customer_name' },
});

// Find by ID
const result = await client.columns.findOne(tableName, {
  where: { id: 'column_id' },
});
```

#### Update Column

```typescript
const result = await client.columns.update(tableName, {
  where: { name: 'customer_name' },
  set: {
    description: 'Updated description',
    is_visible: true,
    alignment: 'center',
  },
});
```

#### Delete Column

```typescript
const result = await client.columns.delete(tableName, {
  where: { name: 'customer_name' },
});
```

### Method 2: Fluent API

#### Create Single Column

```typescript
const result = await client.from(tableName).column().create({
  name: 'product_name',
  type: 'text',
  description: 'Product name',
  is_nullable: false,
  is_indexed: true,
});
```

#### Create Multiple Columns (one by one)

```typescript
const result = await client
  .from(tableName)
  .column()
  .create({
    columns: [
      {
        name: 'product_name',
        type: 'text',
        description: 'Product name',
        is_nullable: false,
        is_indexed: true,
      },
    ],
  });
```

#### Find Columns

```typescript
// Find all columns
const result = await client.from(tableName).column().findAll();

// Find with filtering
const result = await client
  .from(tableName)
  .column()
  .where({ type: 'number' })
  .sort([{ field: 'name', order: 'asc' }])
  .limit(10)
  .findAll();
```

#### Find Single Column

```typescript
const result = await client
  .from(tableName)
  .column()
  .where({ name: 'product_name' })
  .findOne();
```

#### Update Column

```typescript
const result = await client
  .from(tableName)
  .column()
  .where({ name: 'product_name' })
  .set({
    description: 'Updated description',
    is_visible: true,
  })
  .update();
```

#### Delete Column

```typescript
const result = await client
  .from(tableName)
  .column()
  .where({ name: 'product_name' })
  .delete();
```

## Field Type Examples

### Text Fields

```typescript
{
  name: 'customer_name',
  type: 'text',
  description: 'Customer full name',
  is_nullable: false,
  is_indexed: true,
  alignment: 'left'
}
```

### Email Fields

```typescript
{
  name: 'email',
  type: 'email',
  description: 'Customer email address',
  is_nullable: false,
  is_unique: true,
  is_indexed: true
}
```

### Number Fields

```typescript
{
  name: 'price',
  type: 'number',
  description: 'Product price',
  is_nullable: false,
  is_indexed: true,
  decimals: '0.00'
}
```

### Currency Fields

```typescript
{
  name: 'balance',
  type: 'currency',
  description: 'Account balance',
  is_nullable: false,
  is_indexed: true,
  currency_format: 'USD',
  decimals: '0.00'
}
```

### Date-Time Fields

```typescript
{
  name: 'created_date',
  type: 'date-time',
  description: 'Account creation date',
  is_nullable: false,
  is_indexed: true,
  date_format: 'YYYY_MM_DD',
  time_format: 'HH_mm_ss',
  timezone: 'UTC'
}
```

### Dropdown Fields

```typescript
{
  name: 'status',
  type: 'dropdown',
  description: 'Account status',
  is_nullable: false,
  is_indexed: true,
  selectable_items: ['Active', 'Inactive', 'Suspended'],
  multiple_selections: false
}
```

### Phone Number Fields

```typescript
{
  name: 'phone',
  type: 'phone-number',
  description: 'Customer phone number',
  is_nullable: true,
  phone_format: '+91 123 456 7890' // Format pattern for display
}
```

**Note**: The `phone_format` property stores the display format pattern, not the actual phone number. The actual phone number should be a 10-digit number that will be formatted according to this pattern.

### Vector Fields

```typescript
{
  name: 'product_embedding',
  type: 'vector',
  description: 'Product embedding for similarity search',
  is_nullable: true,
  is_indexed: true,
  vector_dimension: 768
}
```

### JSON Fields

```typescript
{
  name: 'metadata',
  type: 'json',
  description: 'Complex metadata as JSON',
  is_nullable: true
}
```

## Date and Time Formats

The SDK supports user-friendly date and time format enums:

### Date Formats

- `MMDDYY`: 12/31/23
- `MMDDYYYY`: 12/31/2023
- `MM_DD_YYYY`: 12-31-2023
- `DD_MM_YYYY`: 31-12-2023
- `DDMMYYYY`: 31/12/2023
- `DDMMYY`: 31/12/23
- `YYYY_MM_DD`: 2023-12-31
- `MMMM__DD__YYYY`: December 31 2023
- `MMM__DD__YYYY`: Dec 31 2023
- `ddd__MMM__DD__YYYY`: Mon Dec 31 2023

### Time Formats

- `HH_mm_ss`: 14:30:45
- `HH_mm_ssZ`: 14:30:45Z
- `HH_mm_ss_SSS`: 14:30:45.123
- `HH_mm_ss__Z`: 14:30:45 UTC
- `HH_mm__AMPM`: 2:30 PM
- `HH_mm_ss__AMPM`: 2:30:45 PM

## Phone Number Formats

- `+91 123 456 7890`
- `(123) 456-7890`
- `+1 (123) 456-7890`
- `+91 12 3456 7890`

## Decimal Formats

- `00`: No decimals
- `0.0`: One decimal place
- `0.00`: Two decimal places
- `0.000`: Three decimal places
- `0.0000`: Four decimal places
- `0.00000`: Five decimal places
- `0.000000`: Six decimal places

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const result = await client.columns.create(tableName, data);

  if (result.error) {
    console.error('Column creation failed:', result.error);
    return;
  }

  console.log('Columns created:', result.data);
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Common Error Types

- **ValidationError**: Invalid column data or constraints
- **ApiError**: API-level errors with status codes
- **NetworkError**: Connection or network issues

## Best Practices

### 1. Column Naming

- Use descriptive, lowercase names with underscores
- Avoid reserved words and special characters
- Keep names under 64 characters

### 2. Field Type Selection

- Use `text` for short strings
- Use `long-text` for multi-line content
- Use `email` for email addresses with validation
- Use `number` for numeric data
- Use `currency` for monetary values
- Use `date-time` for timestamps
- Use `dropdown` for predefined options
- Use `vector` for AI/ML embeddings

### 3. Indexing Strategy

- Index frequently queried fields
- Index unique fields for performance
- Avoid over-indexing to maintain write performance

### 4. Data Validation

- Set appropriate `is_nullable` flags
- Use `is_unique` for unique constraints
- Validate data formats (email, phone, etc.)

### 5. Performance Optimization

- Use pagination for large column lists
- Apply filters to reduce data transfer
- Use appropriate field types for data size

## Integration with Tables API

The Column API integrates seamlessly with the Tables API:

```typescript
// Create a table first
const tableResult = await client.tables.create({
  name: 'customers',
  description: 'Customer data table',
  fields: [
    {
      name: 'id',
      type: 'text',
      is_primary_key: true,
      is_nullable: false,
    },
  ],
});

// Then add more columns
const columnResult = await client.columns.create('customers', {
  columns: [
    {
      name: 'email',
      type: 'email',
      is_unique: true,
    },
  ],
});
```

## Advanced Features

### Vector Similarity Search

```typescript
// Create vector column for embeddings
const vectorColumn = await client.columns.create(tableName, {
  columns: [
    {
      name: 'product_embedding',
      type: 'vector',
      vector_dimension: 768,
      is_indexed: true,
    },
  ],
});
```

### Complex JSON Data

```typescript
// Store complex metadata
const jsonColumn = await client.columns.create(tableName, {
  columns: [
    {
      name: 'product_metadata',
      type: 'json',
      description: 'Complex product metadata',
    },
  ],
});
```

### Multi-Selection Dropdowns

```typescript
// Allow multiple selections
const multiDropdown = await client.columns.create(tableName, {
  columns: [
    {
      name: 'tags',
      type: 'dropdown',
      selectable_items: ['Electronics', 'Clothing', 'Books'],
      multiple_selections: true,
    },
  ],
});
```

## Migration from Direct API

If you're migrating from direct API calls to the SDK:

```typescript
// Before: Direct API call
const response = await fetch('/api/tables/table_id/fields', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({ fields: [...] })
});

// After: SDK call
const result = await client.columns.create('table_name', {
  columns: [...]
});
```

## Troubleshooting

### Common Issues

1. **Column name conflicts**: Ensure unique column names within a table
2. **Invalid field types**: Use supported field types only
3. **Missing required fields**: Include all required properties
4. **Authentication errors**: Verify API key and permissions
5. **Network timeouts**: Check connection and retry logic

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const client = createClient('api-key', {
  environment: 'sit',
  debug: true,
});
```

This completes the Column Operations Guide. The SDK now provides comprehensive column management capabilities with full E2E integration.
