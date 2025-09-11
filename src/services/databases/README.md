# Boltic SDK - Database Operations

This is the database-specific documentation for the Boltic SDK. For the complete SDK documentation, see the [main README](../../README.md).

## Overview

The Boltic Database SDK provides comprehensive database operations including table management, column operations, record handling, and advanced features like vector support for AI/ML applications.

## Quick Start

```typescript
import { createClient } from 'boltic-sdk';

// Initialize the client
const client = createClient('your-api-key', {
  region: 'asia-south1',
  debug: true,
});

// Use the client for database operations
const tables = client.tables;
const columns = client.columns;
const records = client.records;
```

Run your file to create client:

```sh
npx tsx create-client.ts
```

## Reserved Columns

The following columns are automatically added to all tables and cannot be modified or deleted:

- **`id`**: Primary key field (uuid type, unique, not nullable)
- **`created_at`**: Timestamp when the record was created
- **`updated_at`**: Timestamp when the record was last updated

These columns are managed by the system and provide essential functionality for record identification and tracking.

## Table Operations

### Creating Tables

```typescript
// Create a table with schema
const tableResult = await client.tables.create({
  name: 'users',
  description: 'User management table',
  fields: [
    {
      name: 'name',
      type: 'text',
      is_nullable: false,
      description: 'User name',
    },
    {
      name: 'email',
      type: 'email',
      is_nullable: false,
      is_unique: true,
      description: 'User email',
    },
    {
      name: 'age',
      type: 'number',
      decimals: '0.00',
      description: 'User age',
    },
    {
      name: 'salary',
      type: 'currency',
      currency_format: 'USD',
      decimals: '0.00',
      description: 'User salary',
    },
    {
      name: 'is_active',
      type: 'checkbox',
      default_value: true,
      description: 'User status',
    },
    {
      name: 'role',
      type: 'dropdown',
      selectable_items: ['Admin', 'User', 'Guest'],
      multiple_selections: false,
      description: 'User role',
    },
  ],
});

// Note: The following columns are automatically added to all tables:
// - 'id': Primary key (uuid, unique, not nullable)
// - 'created_at': Timestamp when record was created
// - 'updated_at': Timestamp when record was last updated

if (tableResult.error) {
  console.error('Table creation failed:', tableResult.error);
} else {
  console.log('Table created:', tableResult.data);
}
```

### Listing and Filtering Tables

```typescript
// List all tables
const allTables = await client.tables.findAll();

// Filter tables by name
const filteredTables = await client.tables.findAll({
  where: { name: 'users' },
});

// Get a specific table
const table = await client.tables.findOne({
  where: { name: 'users' },
});

// Get table by name
const tableByName = await client.tables.findByName('users');
```

### Updating Tables

```typescript
// Update table properties
const updateResult = await client.tables.update('users', {
  name: 'updated_users',
  is_shared: true,
});

// Rename table
const renameResult = await client.tables.rename('users', 'new_users');

// Set table access
const accessResult = await client.tables.setAccess({
  table_name: 'new_users',
  is_shared: true,
});
```

### Deleting Tables

```typescript
// Delete table by name
const deleteResult = await client.tables.delete('users');
```

## Column Operations

### Creating Columns

```typescript
// Create different types of columns
const columnTypes = [
  {
    name: 'description',
    type: 'long-text',
    description: 'User description',
  },
  {
    name: 'age',
    type: 'number',
    decimals: '0.00',
    description: 'User age',
  },
  {
    name: 'salary',
    type: 'currency',
    currency_format: 'USD',
    decimals: '0.00',
    description: 'User salary',
  },
  {
    name: 'is_active',
    type: 'checkbox',
    default_value: true,
    description: 'User status',
  },
  {
    name: 'role',
    type: 'dropdown',
    selectable_items: ['Admin', 'User', 'Guest'],
    multiple_selections: false,
    description: 'User role',
  },
  {
    name: 'phone',
    type: 'phone-number',
    phone_format: '+91 123 456 7890',
    description: 'Phone number',
  },
  {
    name: 'embedding',
    type: 'vector',
    vector_dimension: 1536,
    description: 'Text embedding vector',
  },
];

for (const columnData of columnTypes) {
  const result = await client.columns.create('users', columnData);
  if (result.error) {
    console.error(`Failed to create ${columnData.type} column:`, result.error);
  } else {
    console.log(`Created ${columnData.type} column:`, result.data);
  }
}
```

### Listing and Filtering Columns

```typescript
// List all columns in a table
const allColumns = await client.columns.findAll('users');

// Filter columns by type
const textColumns = await client.columns.findAll('users', {
  where: { type: 'text' },
});

// Get a specific column
const column = await client.columns.findOne('users', {
  where: { name: 'email' },
});

// Get column by UUID
const columnById = await client.columns.findById('users', 'column-id');
```

### Updating Columns

```typescript
// Update column properties
const updateResult = await client.columns.update('users', 'description', {
  description: 'Updated user description',
});
```

### Deleting Columns

```typescript
// Delete a column
const deleteResult = await client.columns.delete('users', 'description');
```

## Record Operations

### Inserting Records

```typescript
// Insert a single record
const recordData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  salary: 75000,
  is_active: true,
  role: 'Admin',
};

const insertResult = await client.records.insert('users', recordData);

if (insertResult.error) {
  console.error('Record insertion failed:', insertResult.error);
} else {
  console.log('Record inserted:', insertResult.data);
}

// Insert multiple records using insertMany() for better performance
const multipleRecords = [
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 28,
    salary: 65000,
    is_active: true,
    role: 'User',
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    age: 35,
    salary: 70000,
    is_active: true,
    role: 'Admin',
  },
];

// Bulk insert with validation (default)
const bulkResult = await client.records.insertMany('users', multipleRecords);

if (bulkResult.error) {
  console.error('Bulk insertion failed:', bulkResult.error);
} else {
  console.log(`Successfully inserted ${bulkResult.data.insert_count} records`);
  console.log('Inserted records:', bulkResult.data.records);
}

// Bulk insert without validation
const bulkNoValidationResult = await client.records.insertMany(
  'users',
  multipleRecords,
  { validation: false }
);

// Note: Unlike single insert(), insertMany() requires complete records
// All required fields must be provided - partial record insertion is not supported

// Alternative: Insert records one by one (for partial record support)
for (const record of multipleRecords) {
  await client.records.insert('users', record);
}
```

### Bulk Insert Operations

The SDK provides an efficient `insertMany()` method for inserting multiple records in a single API call:

```typescript
// Bulk insert with validation (default behavior)
const records = [
  {
    name: 'User 1',
    email: 'user1@example.com',
    age: 25,
    salary: 55000,
    is_active: true,
    role: 'User',
  },
  {
    name: 'User 2',
    email: 'user2@example.com',
    age: 30,
    salary: 60000,
    is_active: true,
    role: 'User',
  },
  {
    name: 'User 3',
    email: 'user3@example.com',
    age: 35,
    salary: 65000,
    is_active: true,
    role: 'Admin',
  },
];

const result = await client.records.insertMany('users', records);

if (result.error) {
  console.error('Bulk insertion failed:', result.error);
} else {
  console.log(`Successfully inserted ${result.data.insert_count} records`);
  console.log('Response:', result.data);
}

// Insert without validation (faster, less safe)
const resultNoValidation = await client.records.insertMany('users', records, {
  validation: false,
});
```

### Querying Records

```typescript
// Find all records
const allRecords = await client.records.findAll('users');

// Find records with pagination
const paginatedRecords = await client.records.findAll('users', {
  page: {
    page_no: 1,
    page_size: 10,
  },
});

// Find records with filters
const filteredRecords = await client.records.findAll('users', {
  filters: [
    { field: 'age', operator: '>=', values: [25] },
    { field: 'is_active', operator: '=', values: [true] },
    { field: 'role', operator: 'IN', values: ['Admin', 'User'] },
  ],
});

// Find records with sorting
const sortedRecords = await client.records.findAll('users', {
  sort: [
    { field: 'age', order: 'desc' },
    { field: 'name', order: 'asc' },
  ],
});

// Find a specific record
const specificRecord = await client.records.findOne('users', 'record-id');

// Find one record with filters
const filteredRecord = await client.records.findAll('users', {
  filters: [
    { field: 'email', operator: '=', values: ['john.doe@example.com'] },
  ],
});
```

### Updating Records

```typescript
// Update records by filters
const updateResult = await client.records.update('users', {
  set: { is_active: false },
  filters: [{ field: 'role', operator: '=', values: ['Guest'] }],
});

// Update record by ID
const updateByIdResult = await client.records.updateById(
  'users',
  'record-id-here',
  { salary: 80000 }
);
```

### Deleting Records

```typescript
// Delete records by filters
const deleteResult = await client.records.delete('users', {
  filters: [{ field: 'is_active', operator: '=', values: [false] }],
});

// Delete records by IDs
const deleteByIdsResult = await client.records.delete('users', {
  record_ids: ['id1', 'id2', 'id3'],
});

// Delete with multiple filter conditions
const deleteWithFilters = await client.records.delete('users', {
  filters: [{ field: 'is_active', operator: '=', values: [false] }],
});
```

## SQL Operations

### Text-to-SQL Conversion

Convert natural language to SQL queries with AI assistance:

```typescript
// Basic text-to-SQL conversion (streaming)
const sqlStream = await client.sql.textToSQL('Find all active users');

// Collect the streaming response
let generatedSQL = '';
for await (const chunk of sqlStream) {
  generatedSQL += chunk;
}

console.log('Generated SQL:', generatedSQL);
```

### SQL Query Execution

Execute SQL queries directly:

```typescript
// Execute SQL query
const result = await client.sql.executeSQL(
  `SELECT "name", "email" FROM "users" WHERE "is_active" = true`
);

if (result.error) {
  console.error('SQL execution failed:', result.error);
} else {
  const [resultRows, metadata] = result.data;
  console.log('Query results:', resultRows);
  console.log('Row count:', metadata);
}

// When joining or comparing id fields with other columns, cast to text using ::text
const joinQuery = await client.sql.executeSQL(`
  SELECT u.name, p.title 
  FROM "users" u
  JOIN "posts" p ON u.id::text = p.user_id
`);
```

**Note:** When joining or comparing an `id` field with a different-typed column, you need to cast using `::text` (e.g., `u.id::text = p.user_id`) since `id` fields are UUID type.

### Query Refinement

Refine existing queries with additional instructions:

```typescript
const baseQuery = `SELECT * FROM "users"`;

const refinedStream = await client.sql.textToSQL(
  'Add filtering for active users and sort by name',
  { currentQuery: baseQuery }
);

let refinedSQL = '';
for await (const chunk of refinedStream) {
  refinedSQL += chunk;
}

console.log('Refined SQL:', refinedSQL);
```

### Working with UUID ID Fields in SQL

**Important:** The `id` field in Boltic tables contains UUID values. When joining tables or comparing `id` fields with other column types, you must cast the `id` field to text using `::text`:

```typescript
// Cast UUID id to text for comparison
const query = `
  SELECT u.name, p.title 
  FROM "users" u
  JOIN "posts" p ON u.id::text = p.user_id
`;

const result = await client.sql.executeSQL(query);

// More examples of UUID casting:

// Filtering by UUID id
const filterByIdQuery = `
  SELECT * FROM "users" 
  WHERE id::text = 'some-uuid-string'
`;

// Joining multiple tables with UUID references
const complexJoinQuery = `
  SELECT u.name, p.title, c.content
  FROM "users" u
  JOIN "posts" p ON u.id::text = p.user_id
  JOIN "comments" c ON p.id::text = c.post_id
  WHERE u.id::text IN ('uuid1', 'uuid2', 'uuid3')
`;

// Using UUID id in subqueries
const subqueryExample = `
  SELECT * FROM "users" u
  WHERE u.id::text IN (
    SELECT DISTINCT user_id 
    FROM "posts" 
    WHERE created_at > '2024-01-01'
  )
`;
```

**Why UUID Casting is Required:**

- The `id` field uses PostgreSQL's UUID type internally
- When comparing UUIDs with text columns (like foreign key references), PostgreSQL requires explicit type casting
- The `::text` operator converts the UUID to its string representation for comparison
- This applies to all system-generated `id` fields (`id`, and potentially foreign key references)

## Advanced Features

### Vector Columns for AI/ML

```typescript
// Create vector columns for AI/ML applications
const vectorColumns = [
  {
    name: 'embedding',
    type: 'vector',
    vector_dimension: 1536,
    description: 'Text embedding vector',
  },
  {
    name: 'half_embedding',
    type: 'halfvec',
    vector_dimension: 768,
    description: 'Half precision vector',
  },
  {
    name: 'sparse_features',
    type: 'sparsevec',
    vector_dimension: 5,
    description: 'Sparse vector features (example: {1:1,3:2,5:3}/5)',
  },
];

// Sparse Vector Format Example:
// {1:1,3:2,5:3}/5 represents a 5-dimensional vector where:
// - Position 1 has value 1
// - Position 3 has value 2
// - Position 5 has value 3
// - Positions 2 and 4 are implicitly 0

for (const vectorColumn of vectorColumns) {
  await client.columns.create('vectors', vectorColumn);
}
```

## Error Handling

The SDK provides comprehensive error handling with detailed error objects:

```typescript
try {
  const result = await client.tables.create({
    name: 'test-table',
    fields: [{ name: 'id', type: 'text' }],
  });

  if (result.error) {
    console.error('Operation failed:', result.error);

    // Handle specific error cases
    if (
      result.error.message &&
      result.error.message.includes('already exists')
    ) {
      console.log('Table already exists, continuing...');
    }

    // Access error details
    console.log('Error code:', result.error.code);
    console.log('Error message:', result.error.message);
  } else {
    console.log('Success:', result.data);
  }
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.statusCode);
    console.error('Error details:', error.details);
  } else if (error instanceof ValidationError) {
    console.error('Validation Error:', error.failures);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Development Setup

```bash
# Clone the repository
git clone https://github.com/bolticio/boltic-sdk.git
cd boltic-sdk/src/services/databases

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Build in watch mode
- `npm test` - Run tests
- `npm run type-check` - Type check without compilation
- `npm run lint` - Lint the codebase
- `npm run format` - Format code with Prettier

## Examples and Demos

Check out the comprehensive demo files for complete usage examples:

- **[Comprehensive Database Operations Demo](./examples/basic/comprehensive-database-operations-demo.ts)** - Complete SDK functionality demo
- **[SQL Operations Demo](./examples/basic/comprehensive-sql-operations-demo.ts)** - SQL operations and text-to-SQL demo

These demos cover:

- All column types and their properties
- Advanced filtering and querying
- Error handling patterns
- Vector operations
- SQL operations and text-to-SQL conversion

## API Reference

For the complete API reference including all methods, parameters, and return types, see the [main README](../../README.md).

### Key Methods

#### Tables

- **`client.tables.create(data)`**: Create a new table
- **`client.tables.findAll(options?)`**: List tables with optional filtering
- **`client.tables.findByName(name)`**: Get table by name
- **`client.tables.delete(name)`**: Delete a table by name

#### Columns

- **`client.columns.create(tableName, data)`**: Create a new column
- **`client.columns.findAll(tableName, options?)`**: List columns with optional filtering
- **`client.columns.delete(tableName, columnName)`**: Delete a column

#### Records

- **`client.records.insert(tableName, data)`**: Insert a new record
- **`client.records.insertMany(tableName, records, options?)`**: Insert multiple records
- **`client.records.findAll(tableName, options?)`**: List records with optional filtering
- **`client.records.update(tableName, options)`**: Update records by filters
- **`client.records.delete(tableName, options)`**: Delete records by filters or IDs

#### SQL Operations

- **`client.sql.textToSQL(prompt, options?)`**: Convert natural language to SQL query (streaming)
- **`client.sql.executeSQL(query)`**: Execute SQL query with safety measures

## Complete Documentation

For the complete SDK documentation including all features, examples, and API reference, see the [main README](../../README.md).

## Support

For support, email support@boltic.io or create an issue on [GitHub](https://github.com/bolticio/boltic-sdk).
