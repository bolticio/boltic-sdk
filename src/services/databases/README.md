# Boltic SDK - Database Operations

A powerful TypeScript SDK for seamless integration with Boltic Tables infrastructure. Provides comprehensive database operations including table management, column operations, record handling, and authentication.

## Features

- 🔧 **Full TypeScript Support**: Comprehensive type definitions and IntelliSense
- 🚀 **Modern Architecture**: ES modules and CommonJS support
- 🔐 **Built-in Authentication**: Integrated API key management
- 📊 **Database Operations**: Complete table and column management
- 📝 **Record Operations**: Full CRUD operations with advanced querying
- 🧪 **Testing Utilities**: Built-in testing helpers and mocks
- 📦 **Zero Dependencies**: Lightweight with optional peer dependencies
- 🌐 **Multi-Region Support**: Asia Pacific and US Central regions
- 🔍 **Advanced Filtering**: FilterBuilder with comprehensive query operators
- 🛠️ **Helper Classes**: Schema and column creation utilities
- ⚡ **HTTP Adapters**: Support for both Axios and Fetch
- 🎯 **Vector Support**: AI/ML vector fields with multiple precisions

## Prerequisites

- **Node.js:** >=18.0.0
- **NPM:** >=8.0.0

## Installation

```bash
npm install boltic-sdk
```

## Quick Start

```typescript
import { createClient } from 'boltic-sdk';

// Initialize the client
const client = createClient('your-api-key');

// Use the SDK...
```

## Authentication

### API Key Setup

Get your API key from [boltic.io](https://boltic.io) and use it to initialize the client:

```typescript
import { createClient } from 'boltic-sdk';

const client = createClient('your-api-key-here');
```

### Environment Variables

```typescript
import dotenv from 'dotenv';
import { createClient } from 'boltic-sdk';

dotenv.config();

const client = createClient(process.env.BOLTIC_API_KEY!);
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
  timeout: 30000,
  maxRetries: 3,
});
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

- **`id`**: Primary key field (text type, unique, not nullable)
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

// Get table metadata
const metadata = await client.tables.getMetadata('users');
```

### Updating Tables

```typescript
// Update table properties
const updateResult = await client.tables.update('users', {
  name: 'updated_users',
  snapshot: 'new-snapshot',
  is_shared: true,
});

// Rename table
const renameResult = await client.tables.rename('users', 'new_users');

// Set table access
const accessResult = await client.tables.setAccess({
  table_name: 'users',
  is_shared: true,
});
```

### Deleting Tables

```typescript
// Delete table by name
const deleteResult = await client.tables.delete('users');

// Delete table with options
const deleteWithOptions = await client.tables.delete({
  table_name: 'users',
  force: true,
});
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
    phone_format: '+1 123 456 7890',
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

// Get column by ID
const columnById = await client.columns.findById('users', 'column-id');
```

### Updating Columns

```typescript
// Update column properties
const updateResult = await client.columns.update('users', 'description', {
  description: 'Updated user description',
  is_visible: true,
  is_indexed: true,
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

const insertResult = await client.record.insert('users', recordData);

if (insertResult.error) {
  console.error('Record insertion failed:', insertResult.error);
} else {
  console.log('Record inserted:', insertResult.data);
}

// Insert multiple records
const multipleRecords = [
  { name: 'Jane Smith', email: 'jane@example.com', age: 28 },
  { name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
];

for (const record of multipleRecords) {
  await client.record.insert('users', record);
}

// Insert record with sparse vector example
const sparseVectorRecord = {
  name: 'AI Model User',
  email: 'ai@example.com',
  age: 25,
  sparse_features: { 1: 1, 3: 2, 5: 3 }, // Sparse vector: {1:1,3:2,5:3}/5
  // This represents a 5-dimensional vector where positions 1, 3, 5 have values 1, 2, 3
  // and positions 2, 4 are implicitly 0
};

const sparseInsertResult = await client.record.insert(
  'users',
  sparseVectorRecord
);
```

### Advanced Filtering with FilterBuilder

```typescript
import { createFilter, FilterBuilder } from 'boltic-sdk';

// Create complex filters using FilterBuilder
const complexFilters = createFilter()
  .greaterThan('age', 25)
  .equals('is_active', true)
  .contains('name', 'John')
  .between('salary', 50000, 100000)
  .isOneOf('role', ['Admin', 'User'])
  .build();

// Use filters in queries
const filteredRecords = await client.record.findAll('users', {
  filters: complexFilters,
  sort: [{ field: 'age', order: 'desc' }],
  page: { page_no: 1, page_size: 10 },
});

// Available filter operators
const advancedFilters = createFilter()
  .equals('status', 'active')
  .notEquals('type', 'guest')
  .greaterThan('score', 80)
  .greaterThanOrEqual('rating', 4.0)
  .lessThan('attempts', 5)
  .lessThanOrEqual('age', 65)
  .between('created_at', '2024-01-01', '2024-12-31')
  .contains('description', 'urgent')
  .startsWith('name', 'A')
  .endsWith('email', '@company.com')
  .isNull('deleted_at')
  .isNotNull('confirmed_at')
  .isEmpty('notes')
  .isNotEmpty('tags')
  .isOneOf('category', ['tech', 'business'])
  .isNotOneOf('status', ['banned', 'suspended'])
  .arrayContains('skills', 'javascript')
  .arrayContainsAny('languages', ['en', 'es'])
  .arrayContainsAll('permissions', ['read', 'write'])
  .build();
```

### Querying Records

```typescript
// Find all records
const allRecords = await client.record.findAll('users');

// Find records with pagination
const paginatedRecords = await client.record.findAll('users', {
  page: {
    page_no: 1,
    page_size: 10,
  },
});

// Find records with filters
const filteredRecords = await client.record.findAll('users', {
  filters: [
    { field: 'age', operator: '>=', values: [25] },
    { field: 'is_active', operator: '=', values: [true] },
    { field: 'role', operator: 'IS ONE OF', values: ['Admin', 'User'] },
  ],
});

// Method 3: FilterBuilder (recommended)
const builderFilterRecords = await client.record.findAll('users', {
  filters: createFilter()
    .greaterThanOrEqual('age', 25)
    .equals('is_active', true)
    .isOneOf('role', ['Admin', 'User'])
    .build(),
});

// Find records with sorting
const sortedRecords = await client.record.findAll('users', {
  sort: [
    { field: 'age', order: 'desc' },
    { field: 'name', order: 'asc' },
  ],
});

// Find a specific record
const specificRecord = await client.record.findOne('users', 'record-id');

// Find one record with filters
const filteredRecord = await client.record.findOne('users', {
  filters: [{ email: 'john.doe@example.com' }],
});
```

### Updating Records

```typescript
// Update records by filters
const updateResult = await client.record.update('users', {
  set: { is_active: false },
  filters: [{ role: 'Guest' }],
});

// Update record by ID
const updateByIdResult = await client.record.updateById('users', {
  id: 'record-id-here',
  set: { salary: 80000 },
});
```

### Deleting Records

```typescript
// Delete records by filters
const deleteResult = await client.record.delete('users', {
  filters: [{ is_active: false }],
});

// Delete records by IDs
const deleteByIdsResult = await client.record.delete('users', {
  record_ids: ['id1', 'id2', 'id3'],
});

// Delete with FilterBuilder
const deleteWithFilters = await client.record.delete('users', {
  filters: createFilter()
    .lessThan('last_login', '2023-01-01')
    .equals('is_active', false)
    .build(),
});
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
  await client.columns.create('users', vectorColumn);
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

// Get effective configuration
const effectiveConfig = client.getEffectiveConfig();
console.log('Effective config:', effectiveConfig);
```

## Error Handling

```typescript
try {
  const result = await client.tables.create({
    name: 'test-table',
    fields: [{ name: 'id', type: 'text' }],
  });

  if (result.error) {
    console.error('Operation failed:', result.error);
  } else {
    console.log('Success:', result.data);
  }
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.statusCode);
  } else if (error instanceof ValidationError) {
    console.error('Validation Error:', error.failures);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Regions

The SDK supports multiple regions for global deployment:

- **`asia-south1`** (default): Asia Pacific (Mumbai) region
- **`us-central1`**: US Central (Iowa) region

## Module Formats

The SDK supports both ES modules and CommonJS:

### ES Modules (Recommended)

```typescript
import { createClient } from 'boltic-sdk';
```

### CommonJS

```javascript
const { createClient } = require('boltic-sdk');
```

## Development

### Setup

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

### Scripts

- `npm run build` - Build the project
- `npm run dev` - Build in watch mode
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Type check without compilation
- `npm run lint` - Lint the codebase
- `npm run format` - Format code with Prettier

## API Reference

### Core Client

- **`createClient(apiKey: string, options?: ClientOptions)`**: Initialize the Boltic client

### Database Context

- **`client.getCurrentDatabase()`**: Get current database context

### Authentication

- **`client.validateApiKey()`**: Validate the API key
- **`client.isAuthenticated()`**: Check authentication status

### Tables

- **`client.tables.create(data)`**: Create a new table
- **`client.tables.findAll(options?)`**: List tables with optional filtering
- **`client.tables.findOne(options)`**: Get a specific table
- **`client.tables.update(identifier, data)`**: Update table properties
- **`client.tables.rename(oldName, newName)`**: Rename a table
- **`client.tables.setAccess(data)`**: Update table access settings
- **`client.tables.delete(options)`**: Delete a table

### Columns

- **`client.columns.create(tableName, data)`**: Create a new column
- **`client.columns.findAll(tableName, options?)`**: List columns with optional filtering
- **`client.columns.findOne(tableName, options)`**: Get a specific column
- **`client.columns.findById(tableName, columnId)`**: Get column by ID
- **`client.columns.update(tableName, columnName, data)`**: Update column properties
- **`client.columns.delete(tableName, columnName)`**: Delete a column

### Records

- **`client.record.insert(tableName, data)`**: Insert a new record
- **`client.record.findAll(tableName, options?)`**: List records with optional filtering
- **`client.record.findOne(tableName, idOrOptions)`**: Get a specific record
- **`client.record.update(tableName, options)`**: Update records by filters
- **`client.record.updateById(tableName, options)`**: Update record by ID
- **`client.record.delete(tableName, options)`**: Delete records by filters or IDs

### Utilities

- **`createFilter()`**: Create a FilterBuilder instance
- **`SchemaHelpers`**: Helper class for creating field definitions
- **`ColumnHelpers`**: Utility functions for column operations
- **`createTestClient(options)`**: Create a test client for testing
- **`createMockResponse(data, pagination?)`**: Create mock responses for testing
- **`createErrorResponse(message, code?)`**: Create error responses for testing
- **`isErrorResponse(response)`**: Check if response is an error

### Builder Functions

- **`createTableBuilder(client)`**: Create a table builder instance
- **`createColumnBuilder(client, tableName)`**: Create a column builder instance
- **`createRecordBuilder(client, tableName)`**: Create a record builder instance

## Examples and Demos

Check out the comprehensive demo file for complete usage examples:

- [`comprehensive-database-operations-demo.ts`](./examples/basic/comprehensive-database-operations-demo.ts) - Complete SDK functionality demo

This demo covers:

- All column types and their properties
- Advanced filtering and querying
- Error handling patterns
- Testing utilities usage
- Vector operations
- Builder patterns
