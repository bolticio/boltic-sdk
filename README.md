# boltic-sdk

A powerful TypeScript SDK for seamless integration with the Boltic platform. Simplifies database operations, table management, column operations, and authentication for building modern applications.

## Features

- 🔧 **Full TypeScript Support**: Comprehensive type definitions and IntelliSense
- 🚀 **Modern Architecture**: ES modules and CommonJS support
- 🔐 **Built-in Authentication**: Integrated API key management
- 📊 **Database Operations**: Complete table and column management
- 🧪 **Testing Utilities**: Built-in testing helpers and mocks
- 📦 **Zero Dependencies**: Lightweight with optional peer dependencies
- 🌐 **Environment Support**: Production, development, and SIT environments

## Installation

```bash
npm install boltic-sdk
```

## Quick Start

```typescript
import { createClient } from 'boltic-sdk';

// Initialize the client
const client = createClient('your-api-key', {
  environment: 'production', // 'production', 'development', 'sit', or 'uat'
  region: 'asia-south1', // 'asia-south1' or 'us-central1'
  debug: false,
});

// Set database context
client.useDatabase('your-database-id', 'Your Database Name');

// Use the client
const tables = client.tables;
const columns = client.columns;
```

## Authentication

```typescript
import { createClient } from 'boltic-sdk';

const client = createClient('your-api-key', {
  environment: 'production',
  region: 'asia-south1', // Defaults to 'asia-south1'
});

// Validate API key
const isValid = await client.validateApiKey();
console.log('API Key valid:', isValid);

// Check authentication status
const isAuthenticated = client.isAuthenticated();
```

## Database and Table Operations

### Setting Database Context

```typescript
// Set the database context before performing operations
client.useDatabase('comprehensive-demo-db', 'My Demo Database');
```

### Creating Tables

```typescript
// Create a table with schema
const tableResult = await client.tables.create({
  name: 'users',
  fields: [
    {
      name: 'id',
      type: 'text',
      is_primary_key: true,
      is_nullable: false,
      is_unique: true,
      description: 'User ID',
    },
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
  ],
});

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
```

### Updating Table Access

```typescript
// Make table public/shared
const updateResult = await client.tables.setAccess({
  table_name: 'users',
  is_shared: true,
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
```

### Updating Columns

```typescript
// Update column properties
const updateResult = await client.columns.update('users', {
  where: { name: 'description' },
  set: {
    description: 'Updated user description',
    is_visible: true,
    is_indexed: true,
  },
});
```

### Deleting Columns

```typescript
// Delete a column
const deleteResult = await client.columns.delete('users', {
  where: { name: 'description' },
});
```

## Advanced Vector Columns

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
    vector_dimension: 1024,
    description: 'Sparse vector features',
  },
];

for (const vectorColumn of vectorColumns) {
  await client.columns.create('users', vectorColumn);
}
```

## Configuration Options

```typescript
interface ClientOptions {
  environment?: 'production' | 'development' | 'sit' | 'uat';
  region?: 'asia-south1' | 'us-central1';
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

const client = createClient('your-api-key', {
  environment: 'production',
  region: 'asia-south1',
  debug: true,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetries: 3,
  timeout: 30000,
  headers: {
    'Custom-Header': 'value',
  },
});
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
    // Handle specific error cases
    if (result.error.includes('already exists')) {
      console.log('Table already exists, continuing...');
    }
  } else {
    console.log('Success:', result.data);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Regions

The SDK supports multiple regions for global deployment:

- **`asia-south1`** (default): Asia Pacific (Mumbai) region
- **`us-central1`**: US Central (Iowa) region

Each region has its own API endpoints and environment configurations (SIT, UAT, Production).

## Environment Variables

```env
BOLTIC_API_KEY=your-api-key-here
DEBUG=false
```

Then use with dotenv:

```typescript
import { createClient } from 'boltic-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient(process.env.BOLTIC_API_KEY!, {
  environment: 'production',
  region: 'asia-south1',
  debug: process.env.DEBUG === 'true',
});
```

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

## API Reference

### Core Client

- **`createClient(apiKey: string, options?: ClientOptions)`**: Initialize the Boltic client

### Database Context

- **`client.useDatabase(databaseId: string, databaseName?: string)`**: Set database context

### Authentication

- **`client.validateApiKey()`**: Validate the API key
- **`client.isAuthenticated()`**: Check authentication status

### Tables

- **`client.tables.create(data)`**: Create a new table
- **`client.tables.findAll(options?)`**: List tables with optional filtering
- **`client.tables.findOne(options)`**: Get a specific table
- **`client.tables.setAccess(options)`**: Update table access settings
- **`client.tables.delete(tableName)`**: Delete a table

### Columns

- **`client.columns.create(tableName, data)`**: Create a new column
- **`client.columns.findAll(tableName, options?)`**: List columns with optional filtering
- **`client.columns.findOne(tableName, options)`**: Get a specific column
- **`client.columns.update(tableName, options)`**: Update column properties
- **`client.columns.delete(tableName, options)`**: Delete a column

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@boltic.io or create an issue on GitHub.
