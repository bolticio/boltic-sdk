# Boltic SDK

Boltic SDK is an open-source TypeScript library, developed by Fynd, designed to empower developers worldwide with integration to the Boltic platform. Effortlessly manage databases, tables, columns, records, and run SQL queries to build robust, modern applications with ease and confidence.

## Documentation

- **[Boltic SDK Documentation](https://docs.boltic.io/sdk/intro)** - Complete SDK documentation

## Features

- 🔧 **Full TypeScript Support**: Comprehensive type definitions and IntelliSense
- 🚀 **Modern Architecture**: ES modules and CommonJS support
- 🔐 **Built-in Authentication**: Integrated API key management
- 📊 **Database Operations**: Complete table and column management
- 📝 **Record Operations**: Full CRUD operations with advanced querying
- 🌐 **Multi-Region Support**: Asia Pacific and US Central regions
- 🔍 **Advanced Filtering**: Comprehensive query operators
- 🛠️ **Helper Classes**: Schema and column creation utilities
- 🎯 **Vector Support**: AI/ML vector fields with multiple precisions

## Prerequisites

- **Node.js:** >=18.0.0
- **NPM:** >=8.0.0

## Installation

```bash
npm install @boltic/sdk
```

## Quick Start

```typescript
import { createClient } from '@boltic/sdk';

// Initialize the client
const client = createClient('your-api-key', {
  region: 'asia-south1', // 'asia-south1' or 'us-central1'
  debug: false,
});

// Use the client for database operations
const tables = client.tables;
const columns = client.columns;
const records = client.records;
```

## Authentication

### API Key Setup

You can get your API key from [boltic.io](https://boltic.io).

1. Log into your [Boltic](https://boltic.io) account
2. Go to Settings → PAT Tokens
3. Generate and copy your API key

```typescript
import { createClient } from '@boltic/sdk';

const client = createClient('your-api-key-here', {
  region: 'asia-south1',
});
```

### Environment Variables

```typescript
import dotenv from 'dotenv';
import { createClient } from '@boltic/sdk';

dotenv.config();

const client = createClient(process.env.BOLTIC_API_KEY!, {
  region: process.env.BOLTIC_REGION || 'asia-south1',
  debug: process.env.DEBUG === 'true',
});
```

## Configuration Options

```typescript
interface ClientOptions {
  region?: 'asia-south1' | 'us-central1';
  retryAttempts?: number;
  retryDelay?: number;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
}

const client = createClient('your-api-key', {
  region: 'asia-south1',
  debug: true,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetries: 3,
  timeout: 30000,
});
```

Run your file to create client:

```sh
npx tsx create-client.ts
```

## Database Context

The client automatically uses a default database context for all operations:

```typescript
// Get current database context
const currentDb = client.getCurrentDatabase();
console.log('Current database:', currentDb);
```

## Table Operations

### Reserved Columns

The following columns are automatically added to all tables and cannot be modified or deleted:

- **`id`**: Primary key field (uuid type, unique, not nullable)
- **`created_at`**: Timestamp when the record was created
- **`updated_at`**: Timestamp when the record was last updated

These columns are managed by the system and provide essential functionality for record identification and tracking.

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
// - 'id': Primary key (text, unique, not nullable)
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
```

**Note:**

- Unlike single insert(), insertMany() requires complete records. All required fields must be provided in insertMany() call.

### Bulk Insert Operations

The SDK provides an efficient `insertMany()` method for inserting multiple records in a single API call:

```typescript
// Bulk insert with validation (default behavior)
const records = [
  { name: 'User 1', email: 'user1@example.com', age: 25 },
  { name: 'User 2', email: 'user2@example.com', age: 30 },
  { name: 'User 3', email: 'user3@example.com', age: 35 },
];

const result = await client.records.insertMany('users', records);

if (result.error) {
  console.error('Bulk insertion failed:', result.error);
} else {
  console.log(`Successfully inserted ${result.data.insert_count} records`);
  console.log('Response:', result.data);
}

// Bulk insert without validation (faster, less safe)
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

// Find records with filters (API format)
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

### Advanced Filtering

The SDK supports comprehensive filtering with various operators:

```typescript
// Text field filters
const textFilters = [
  { field: 'name', operator: '=', values: ['John'] }, // Equals
  { field: 'name', operator: '!=', values: ['Admin'] }, // Not equals
  { field: 'name', operator: 'LIKE', values: ['%John%'] }, // Contains (case sensitive)
  { field: 'name', operator: 'ILIKE', values: ['%john%'] }, // Contains (case insensitive)
  { field: 'name', operator: 'STARTS WITH', values: ['J'] }, // Starts with
  { field: 'name', operator: 'IN', values: ['John', 'Jane'] }, // Is one of
  { field: 'name', operator: 'IS EMPTY', values: [false] }, // Is not empty
];

// Number field filters
const numberFilters = [
  { field: 'age', operator: '>', values: [30] }, // Greater than
  { field: 'age', operator: '>=', values: [30] }, // Greater than or equal
  { field: 'age', operator: '<', values: [35] }, // Less than
  { field: 'age', operator: '<=', values: [35] }, // Less than or equal
  { field: 'age', operator: 'BETWEEN', values: [25, 35] }, // Between
  { field: 'age', operator: 'IN', values: [25, 30, 35] }, // Is one of
];

// Boolean field filters
const booleanFilters = [
  { field: 'is_active', operator: '=', values: [true] }, // Is true
  { field: 'is_active', operator: '=', values: [false] }, // Is false
];

// Date field filters
const dateFilters = [
  { field: 'created_at', operator: '>', values: ['2024-01-01T00:00:00Z'] },
  {
    field: 'created_at',
    operator: 'BETWEEN',
    values: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
  },
  { field: 'created_at', operator: 'WITHIN', values: ['last-30-days'] },
];

// Array/dropdown field filters
const arrayFilters = [
  { field: 'tags', operator: '@>', values: [['tag1']] }, // Array contains
  { field: 'tags', operator: 'ANY', values: ['tag1'] }, // Any element matches
  { field: 'category', operator: 'IS ONE OF', values: ['tech', 'business'] },
];

// Vector field filters
const vectorFilters = [
  { field: 'embedding', operator: '!=', values: [null] }, // Not null
  { field: 'embedding', operator: '<->', values: ['[0.1,0.2,0.3]'] }, // Euclidean distance
  { field: 'embedding', operator: '<=>', values: ['[0.1,0.2,0.3]'] }, // Cosine distance
];

// Multiple conditions (AND logic)
const multipleFilters = await client.records.findAll('users', {
  filters: [
    { field: 'age', operator: '>=', values: [25] },
    { field: 'is_active', operator: '=', values: [true] },
    { field: 'salary', operator: '>', values: [50000] },
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
  {
    salary: 80000,
  }
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

The Boltic SDK provides powerful SQL capabilities including natural language to SQL conversion and direct SQL query execution.

### Text-to-SQL Conversion

Convert natural language descriptions into SQL queries using AI:

```typescript
// Basic text-to-SQL conversion (streaming)
const sqlStream = await client.sql.textToSQL(
  'Find all active users who registered this year'
);

// Collect the streaming response
let generatedSQL = '';
for await (const chunk of sqlStream) {
  process.stdout.write(chunk); // Real-time output
  generatedSQL += chunk;
}

console.log('\nGenerated SQL:', generatedSQL);
```

### SQL Query Refinement

Refine existing SQL queries with additional instructions:

```typescript
// Start with a base query
const baseQuery = `SELECT * FROM "users" WHERE "created_at" > '2024-01-01'`;

// Refine it with additional instructions
const refinedStream = await client.sql.textToSQL(
  'Add sorting by registration date and limit to 10 results',
  {
    currentQuery: baseQuery,
  }
);

// Process the refined query
let refinedSQL = '';
for await (const chunk of refinedStream) {
  refinedSQL += chunk;
}

console.log('Refined SQL:', refinedSQL);
```

### SQL Query Execution

Execute SQL queries directly with built-in safety measures:

```typescript
// Execute a simple SQL query
const result = await client.sql.executeSQL(
  `SELECT "name", "email" FROM "users" WHERE "is_active" = true`
);

if (result.error) {
  console.error('SQL execution failed:', result.error);
} else {
  // Extract data from Boltic API Response Structure
  const [resultRows, metadata] = result.data;

  console.log('Query results:', resultRows);
  console.log('Metadata:', metadata);

  if (result.pagination) {
    console.log('Total records:', result.pagination.total_count);
    console.log('Current page:', result.pagination.current_page);
  }
}

// When joining or comparing id fields with other columns, cast to text using ::text
const joinQuery = await client.sql.executeSQL(`
  SELECT u.name, p.title 
  FROM "users" u
  JOIN "posts" p ON u.id::text = p.user_id
`);
```

**Note:** When joining or comparing an `id` field with a different-typed column, you need to cast using `::text` (e.g., `u.id::text = p.user_id`) since `id` fields are UUID type.

### Working with UUID ID Fields in SQL

**Important:** The `id` field in Boltic tables contains UUID values. When joining tables or comparing `id` fields with other column types, you must cast the `id` field to text using `::text`:

```typescript
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

### SQL Error Handling

```typescript
try {
  const result = await client.sql.executeSQL(
    'SELECT * FROM "non_existent_table"'
  );

  if (result.error) {
    console.error('SQL Error:', result.error);

    // Access detailed error information
    console.log('Error code:', result.error.code);
    console.log('Error details:', result.error.details);
  }
} catch (error) {
  console.error('SQL execution exception:', error);
}
```

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

### Configuration Management

```typescript
// Update API key
client.updateApiKey('new-api-key');

// Update configuration
client.updateConfig({
  debug: true,
  timeout: 45000,
});

// Get current configuration
const config = client.getConfig();
console.log('Current config:', config);
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
    console.log('Error details:', result.error.details);
    console.log('Error message:', result.error.message);
  } else {
    console.log('Success:', result.data);
  }
} catch (error) {
  console.error('API Error:', error.message);
}
```

### Error Object Structure

```typescript
interface ErrorResponse {
  error: {
    message: string; // Human-readable error message
    code?: string; // Specific error code
    details?: string[]; // Additional details
  };
  data?: null;
}
```

## Regions

The SDK supports multiple regions for global deployment:

- **`asia-south1`** (default): Asia Pacific (Mumbai) region
- **`us-central1`**: US Central (Iowa) region

Each region has its own API endpoints and environment configurations.

## Module Formats

The SDK supports both ES modules and CommonJS:

### ES Modules (Recommended)

```typescript
import { createClient } from '@boltic/sdk';
```

### CommonJS

```javascript
const { createClient } = require('@boltic/sdk');
```

### TypeScript

```typescript
import { createClient, ClientOptions, BolticClient } from '@boltic/sdk';

const options: ClientOptions = {
  region: 'asia-south1',
  debug: true,
  timeout: 30000,
  maxRetries: 3,
};

const client: BolticClient = createClient('your-api-key', options);
```

## File Format Examples

### JavaScript (.js)

```javascript
const { createClient } = require('@boltic/sdk');

const client = createClient('your-api-key');

async function main() {
  const tables = await client.tables.findAll();
  console.log('Tables:', tables);
}

main().catch(console.error);
```

### TypeScript (.ts)

```typescript
import { createClient, ClientOptions } from '@boltic/sdk';

const options: ClientOptions = {
  region: 'asia-south1',
  debug: true,
};

const client = createClient('your-api-key', options);

async function main(): Promise<void> {
  const tables = await client.tables.findAll();
  console.log('Tables:', tables);
}

main().catch(console.error);
```

### ES Modules (.mjs)

```javascript
import { createClient } from '@boltic/sdk';

const client = createClient('your-api-key');

async function main() {
  const tables = await client.tables.findAll();
  console.log('Tables:', tables);
}

main().catch(console.error);
```

## API Reference

### Core Client

- **`createClient(apiKey: string, options?: ClientOptions)`**: Initialize the Boltic client

### Tables

- **`client.tables.create(data)`**: Create a new table
- **`client.tables.findAll(options?)`**: List tables with optional filtering
- **`client.tables.findOne(options)`**: Get a specific table
- **`client.tables.findByName(name)`**: Get table by name
- **`client.tables.update(identifier, data)`**: Update table properties
- **`client.tables.rename(oldName, newName)`**: Rename a table
- **`client.tables.setAccess(data)`**: Update table access settings
- **`client.tables.delete(name)`**: Delete a table by name

### Columns

- **`client.columns.create(tableName, data)`**: Create a new column
- **`client.columns.findAll(tableName, options?)`**: List columns with optional filtering
- **`client.columns.findOne(tableName, options)`**: Get a specific column
- **`client.columns.findById(tableName, columnId)`**: Get column by ID
- **`client.columns.update(tableName, columnName, data)`**: Update column properties
- **`client.columns.delete(tableName, columnName)`**: Delete a column

### Records

- **`client.records.insert(tableName, data)`**: Insert a new record
- **`client.records.insertMany(tableName, records, options?)`**: Insert multiple records in bulk
- **`client.records.findAll(tableName, options?)`**: List records with optional filtering
- **`client.records.findOne(tableName, idOrOptions)`**: Get a specific record
- **`client.records.update(tableName, options)`**: Update records by filters
- **`client.records.updateById(tableName, options)`**: Update record by ID
- **`client.records.delete(tableName, options)`**: Delete records by filters or IDs

### SQL Operations

- **`client.sql.textToSQL(prompt, options?)`**: Convert natural language to SQL query (streaming)
- **`client.sql.executeSQL(query)`**: Execute SQL query with safety measures

## Examples and Demos

Check out the comprehensive demo files for complete usage examples:

- **[Comprehensive Database Operations Demo](./src/services/databases/examples/basic/comprehensive-database-operations-demo.ts)** - Complete SDK functionality demo
- **[SQL Operations Demo](./src/services/databases/examples/basic/comprehensive-sql-operations-demo.ts)** - SQL operations and text-to-SQL demo

These demos cover:

- All column types and their properties
- Advanced filtering and querying
- Error handling patterns
- Vector operations
- SQL operations and text-to-SQL conversion

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, email support@boltic.io or create an issue on [GitHub](https://github.com/bolticio/boltic-sdk).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
