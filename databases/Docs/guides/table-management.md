# Table Management

This guide covers all table management operations in the Boltic Tables SDK.

## Getting Started

Before working with tables, you need to set up the client and select a database context:

```typescript
import { BolticClient } from '@boltic/database-js';

const client = new BolticClient('your-api-key');

// Set database context (required for table operations)
client.useDatabase('your-database-id', 'My Database');
```

## Creating Tables

### Method 1: Direct API

```typescript
const { data: table, error } = await client.tables.create({
  table_name: 'products',
  schema: [
    {
      name: 'title',
      type: 'text',
      is_nullable: true,
      is_visible: true,
    },
    {
      name: 'price',
      type: 'currency',
      is_nullable: false,
      currency_format: 'USD',
      decimals: 2,
    },
    {
      name: 'embedding',
      type: 'vector',
      vector_dimension: 1536,
      is_visible: false,
    },
  ],
  description: 'Product catalog table',
});

if (error) {
  console.error('Failed to create table:', error);
} else {
  console.log('Table created:', table);
}
```

### Method 2: Fluent Interface

```typescript
const { data: table, error } = await client.table().create({
  table_name: 'products',
  schema: [
    SchemaHelpers.textField('title'),
    SchemaHelpers.currencyField('price', 'USD'),
    SchemaHelpers.vectorField('embedding', 1536),
  ],
  description: 'Product catalog table',
});
```

## Schema Helper Functions

Use schema helpers for easier field creation:

```typescript
import { SchemaHelpers } from '@boltic/database-js/utils';

const schema = [
  SchemaHelpers.textField('title', { is_unique: true }),
  SchemaHelpers.longTextField('description'),
  SchemaHelpers.numberField('quantity'),
  SchemaHelpers.currencyField('price', 'USD'),
  SchemaHelpers.checkboxField('is_featured', { default_value: false }),
  SchemaHelpers.dropdownField('category', ['electronics', 'books', 'clothing']),
  SchemaHelpers.emailField('contact_email'),
  SchemaHelpers.phoneNumberField('phone', 'international'),
  SchemaHelpers.linkField('website'),
  SchemaHelpers.vectorField('embedding', 1536),
  SchemaHelpers.halfVectorField('compact_embedding', 512),
  SchemaHelpers.sparseVectorField('sparse_features', 2048),
  SchemaHelpers.jsonField('metadata'),
  SchemaHelpers.dateTimeField('created_at'),
];
```

### Available Field Types

- **Text Fields**: `textField()`, `longTextField()`, `emailField()`, `linkField()`
- **Numeric Fields**: `numberField()`, `currencyField()`
- **Selection Fields**: `dropdownField()`, `checkboxField()`
- **Contact Fields**: `phoneNumberField()`
- **Date/Time Fields**: `dateTimeField()`
- **Advanced Fields**: `vectorField()`, `halfVectorField()`, `sparseVectorField()`, `jsonField()`

## Listing Tables

### Method 1: Direct API

```typescript
const { data: tables, pagination } = await client.tables.findAll({
  where: { is_public: true },
  sort: [{ field: 'name', order: 'asc' }],
  limit: 50,
});

console.log(`Found ${tables.length} tables`);
console.log(`Total: ${pagination.total}, Page: ${pagination.page}`);
```

### Method 2: Fluent Interface

```typescript
const { data: tables, pagination } = await client
  .table()
  .where({ is_public: true })
  .sort([{ field: 'name', order: 'asc' }])
  .limit(50)
  .findAll();
```

### Finding a Single Table

```typescript
// Method 1
const { data: table } = await client.tables.findOne({
  where: { name: 'products' },
});

// Method 2
const { data: table } = await client
  .table()
  .where({ name: 'products' })
  .findOne();
```

## Table Updates and Management

### Renaming Tables

```typescript
// Method 1
await client.tables.rename('old_table_name', 'new_table_name');

// Method 2
await client
  .table()
  .where({ name: 'old_table_name' })
  .set({ name: 'new_table_name' })
  .rename();
```

### Setting Access Permissions

```typescript
// Method 1
await client.tables.setAccess({
  table_name: 'products',
  is_shared: true,
});

// Method 2
await client
  .table()
  .where({ name: 'products' })
  .set({ is_shared: true })
  .setAccess();
```

### Getting Table Metadata

```typescript
const { data: metadata } = await client.tables.getMetadata('products');

console.log('Table info:', {
  id: metadata.id,
  name: metadata.name,
  description: metadata.description,
  created_at: metadata.created_at,
  is_public: metadata.is_public,
});
```

## Deleting Tables

```typescript
// Method 1: Delete by name
await client.tables.delete('table_name');

// Method 1: Delete with options
await client.tables.delete({
  where: { name: 'table_name' },
});

// Method 2: Fluent interface
await client.table().where({ name: 'table_name' }).delete();
```

## Error Handling

```typescript
try {
  const result = await client.tables.create({
    table_name: 'test_table',
    schema: [
      SchemaHelpers.textField('title'),
      SchemaHelpers.vectorField('embedding', 1536),
    ],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Schema validation errors:', error.failures);
    error.failures.forEach((failure) => {
      console.log(`- ${failure.field}: ${failure.message}`);
    });
  } else if (error instanceof ApiError) {
    console.log('API error:', error.statusCode, error.message);
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Schema Validation

### Built-in Validation

The SDK automatically validates:

- **Table Names**: Must start with letter, contain only letters/numbers/hyphens/underscores
- **Field Names**: Must start with letter, contain only letters/numbers/underscores
- **Required Properties**: Vector fields need `vector_dimension`, dropdown fields need `selectable_items`
- **Unique Names**: No duplicate field names within a schema

#### Field-Specific Validations

- **Vector Fields** (`vector`, `halfvec`, `sparsevec`):
  - Must have positive `vector_dimension`
  - Half-vectors limited to 65,535 dimensions maximum
- **Dropdown Fields**:
  - Must have `selectable_items` array with at least one item
  - Maximum 100 selectable items supported
- **Phone Number Fields**:
  - `phone_format` must be one of: `'international'`, `'national'`, `'e164'`
- **Checkbox Fields**:
  - `default_value` must be boolean if specified
- **Number/Currency Fields**:
  - `decimals` must be non-negative if specified
- **Date-Time Fields**:
  - `date_format` and `time_format` must use valid pattern characters
- **Currency Fields**:
  - `currency_format` must be 3-letter ISO code (e.g., 'USD', 'EUR')

### Custom Validation

```typescript
import { SchemaHelpers } from '@boltic/database-js/utils';

const schema = [
  SchemaHelpers.textField('title'),
  SchemaHelpers.vectorField('embedding', 1536),
];

const validation = SchemaHelpers.validateSchema(schema);

if (!validation.isValid) {
  console.log('Schema errors:');
  validation.errors.forEach((error) => console.log(`- ${error}`));
}
```

## Advanced Examples

### E-commerce Product Table

```typescript
const productSchema = [
  SchemaHelpers.textField('name', { is_unique: true }),
  SchemaHelpers.longTextField('description'),
  SchemaHelpers.currencyField('price', 'USD'),
  SchemaHelpers.numberField('stock_quantity'),
  SchemaHelpers.checkboxField('is_featured', { default_value: false }),
  SchemaHelpers.dropdownField('category', [
    'electronics',
    'clothing',
    'books',
    'home-garden',
  ]),
  SchemaHelpers.emailField('vendor_email'),
  SchemaHelpers.phoneNumberField('vendor_phone', 'international'),
  SchemaHelpers.linkField('product_url'),
  SchemaHelpers.jsonField('specifications'),
  SchemaHelpers.vectorField('search_embedding', 1536),
  SchemaHelpers.halfVectorField('compact_embedding', 512),
  SchemaHelpers.sparseVectorField('feature_vector', 2048),
  SchemaHelpers.dateTimeField('created_at'),
];

const { data: table } = await client.tables.create({
  table_name: 'products',
  schema: productSchema,
  description: 'E-commerce product catalog with comprehensive field types',
  is_public: false,
});
```

### User Profile Table

```typescript
const userSchema = [
  SchemaHelpers.textField('username', { is_unique: true }),
  SchemaHelpers.emailField('email', { is_unique: true }),
  SchemaHelpers.textField('first_name'),
  SchemaHelpers.textField('last_name'),
  SchemaHelpers.phoneNumberField('phone', 'e164'),
  SchemaHelpers.linkField('profile_url'),
  SchemaHelpers.checkboxField('email_verified', { default_value: false }),
  SchemaHelpers.checkboxField('marketing_opt_in', { default_value: true }),
  SchemaHelpers.dateTimeField('date_of_birth'),
  SchemaHelpers.dropdownField('subscription_tier', [
    'free',
    'premium',
    'enterprise',
  ]),
  SchemaHelpers.longTextField('bio'),
  SchemaHelpers.jsonField('preferences'),
  SchemaHelpers.dateTimeField('created_at'),
  SchemaHelpers.dateTimeField('last_login'),
];

const { data: table } = await client.tables.create({
  table_name: 'users',
  schema: userSchema,
  description: 'User profiles and preferences with comprehensive validation',
});
```

## Database Context Management

```typescript
// Switch between databases
client.useDatabase('production-db', 'Production Database');
const prodTables = await client.tables.findAll();

client.useDatabase('staging-db', 'Staging Database');
const stagingTables = await client.tables.findAll();

// Check current database
const currentDb = client.getCurrentDatabase();
console.log('Current database:', currentDb?.databaseName);
```

## Best Practices

### Schema Design

1. **Use descriptive field names**: `user_email` instead of `email`
2. **Set appropriate field orders**: Important fields first
3. **Use proper field types**: `email` for emails, `currency` for money
4. **Add descriptions**: Document what each field contains
5. **Consider nullability**: Required fields should be `is_nullable: false`

### Performance

1. **Index frequently queried fields**: Set `is_indexed: true`
2. **Limit vector dimensions**: Use smallest dimension that meets accuracy needs
3. **Use pagination**: Don't load all tables at once

### Error Handling

1. **Always handle ValidationError**: Check schema before creating tables
2. **Implement retry logic**: For network-related ApiErrors
3. **Log detailed errors**: Include field-level validation failures

### Security

1. **Use appropriate visibility**: Set `is_public: false` for sensitive data
2. **Validate input**: Don't trust user-provided schema definitions
3. **Limit access**: Use `is_shared` carefully in multi-tenant environments
