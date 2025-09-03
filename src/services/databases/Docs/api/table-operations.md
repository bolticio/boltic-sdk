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
      decimals: '2',
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
  .currency('price', { currencyFormat: 'USD', decimals: '2' })
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
.phoneNumber('phone', {
  phoneFormat: 'international', // 'international' | 'national' | 'e164'
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
  decimals: '2',
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
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
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
- `decimals`: Number of decimal places (default: '2')

##### Dropdown Fields

- `selectable_items`: Array of selectable options
- `multiple_selections`: Whether multiple selections allowed (default: false)

##### Phone Number Fields

- `phone_format`: Format type ('international', 'national', 'e164')

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
  .number('price', { nullable: false, decimals: '2' })
  .currency('cost', { currencyFormat: 'USD', decimals: '2' })
  .checkbox('is_active', { nullable: false })
  .dropdown('category', {
    selectableItems: ['electronics', 'clothing', 'books', 'home'],
    multipleSelections: false,
    nullable: false,
  })
  .email('support_email', { nullable: true })
  .phoneNumber('support_phone', { phoneFormat: 'international' })
  .link('product_url', { nullable: true })
  .json('specifications', { nullable: true })
  .dateTime('created_at', {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
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
  .phoneNumber('phone', { phoneFormat: 'international' })
  .dateTime('date_of_birth', {
    dateFormat: 'YYYY-MM-DD',
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
  .dropdown('status', {
    selectableItems: ['draft', 'published', 'archived'],
    multipleSelections: false,
    nullable: false,
  })
  .dropdown('category', {
    selectableItems: ['technology', 'business', 'lifestyle'],
    multipleSelections: false,
    nullable: true,
  })
  .dateTime('published_at', {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    timezone: 'UTC',
    nullable: true,
  })
  .vector('content_embedding', 768, { nullable: true })
  .create();
```
