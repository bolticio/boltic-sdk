# boltic-sdk

A powerful TypeScript SDK for seamless integration with the Boltic platform. Simplifies database operations, table management, column operations, record handling, and authentication for building modern applications.

## Features

- 🔧 **Full TypeScript Support**: Comprehensive type definitions and IntelliSense
- 🚀 **Modern Architecture**: ES modules and CommonJS support
- 🔐 **Built-in Authentication**: Integrated API key management
- 📊 **Database Operations**: Complete table and column management
- 📝 **Record Operations**: Full CRUD operations with advanced querying
- 🧪 **Testing Utilities**: Built-in testing helpers and mocks
- 📦 **Zero Dependencies**: Lightweight with optional peer dependencies
- 🌐 **Multi-Region Support**: Asia Pacific and US Central regions

## Installation

```bash
npm install boltic-sdk
```

## Quick Start

```typescript
import { createClient } from 'boltic-sdk';

// Initialize the client
const client = createClient('your-api-key', {
  region: 'asia-south1', // 'asia-south1' or 'us-central1'
  debug: false,
});

// Use the client
const tables = client.tables;
const columns = client.columns;
const records = client.record;
```

## API Key Setup

Get your API key from [boltic.io](https://boltic.io) and use it to initialize the client:

```typescript
import { createClient } from 'boltic-sdk';

const client = createClient('your-api-key-here', {
  region: 'asia-south1',
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

## Environment Variables

```typescript
import dotenv from 'dotenv';
import { createClient } from 'boltic-sdk';

dotenv.config();

const client = createClient(process.env.BOLTIC_API_KEY!, {
  region: process.env.BOLTIC_REGION || 'asia-south1',
  debug: process.env.DEBUG === 'true',
});
```

## Database Context

The client automatically uses a default database context for all operations:

```typescript
// Get current database context
const currentDb = client.getCurrentDatabase();
console.log('Current database:', currentDb);
```

## Basic Operations

### Table Operations

**Note**: The following columns are automatically added to all tables and cannot be modified:

- `id`: Primary key (text, unique, not nullable)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

```typescript
// Create a table
const tableResult = await client.tables.create({
  name: 'users',
  description: 'User management table',
  fields: [
    {
      name: 'name',
      type: 'text',
      is_nullable: false,
    },
    {
      name: 'email',
      type: 'email',
      is_nullable: false,
      is_unique: true,
    },
  ],
});

// Note: The following columns are automatically added to all tables:
// - 'id': Primary key (text, unique, not nullable)
// - 'created_at': Timestamp when record was created
// - 'updated_at': Timestamp when record was last updated

// List all tables
const allTables = await client.tables.findAll();

// Get a specific table
const table = await client.tables.findOne({
  where: { name: 'users' },
});
```

### Column Operations

```typescript
// Create a column
const columnResult = await client.columns.create('users', {
  name: 'age',
  type: 'number',
  decimals: '0.00',
  description: 'User age',
});

// List all columns in a table
const allColumns = await client.columns.findAll('users');

// Update a column
const updateResult = await client.columns.update('users', {
  where: { name: 'age' },
  set: { description: 'Updated age description' },
});
```

### Record Operations

```typescript
// Insert a record
const recordData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
};

const insertResult = await client.record.insert('users', recordData);

// Find all records
const allRecords = await client.record.findAll('users');

// Find records with filters
const filteredRecords = await client.record.findAll('users', {
  filters: [{ age: { $gte: 25 } }, { name: { $like: 'John%' } }],
});

// Update records
const updateResult = await client.record.update('users', {
  set: { age: 31 },
  filters: [{ email: 'john.doe@example.com' }],
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

for (const vectorColumn of vectorColumns) {
  await client.columns.create('users', vectorColumn);
}
```

### Interceptors

```typescript
// Add request interceptor
const requestId = client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Add response interceptor
const responseId = client.addResponseInterceptor((response) => {
  console.log('Response received:', response.status);
  return response;
});

// Remove interceptors
client.removeInterceptor('request', requestId);
client.removeInterceptor('response', responseId);
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

Each region has its own API endpoints and environment configurations.

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

### TypeScript

```typescript
import { createClient, ClientOptions, BolticClient } from 'boltic-sdk';

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
const { createClient } = require('boltic-sdk');

const client = createClient('your-api-key');

async function main() {
  const tables = await client.tables.findAll();
  console.log('Tables:', tables);
}

main().catch(console.error);
```

### TypeScript (.ts)

```typescript
import { createClient, ClientOptions } from 'boltic-sdk';

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
import { createClient } from 'boltic-sdk';

const client = createClient('your-api-key');

async function main() {
  const tables = await client.tables.findAll();
  console.log('Tables:', tables);
}

main().catch(console.error);
```

## Complete Example

```typescript
import { createClient } from 'boltic-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize client
  const client = createClient(process.env.BOLTIC_API_KEY!);

  try {
    // Create a table
    const tableResult = await client.tables.create({
      name: 'users',
      description: 'User management table',
      fields: [
        { name: 'name', type: 'text', is_nullable: false },
        { name: 'email', type: 'email', is_unique: true },
        { name: 'age', type: 'number', decimals: '0.00' },
      ],
    });

    // Note: 'id', 'created_at', and 'updated_at' columns are automatically added

    if (tableResult.error) {
      console.error('Table creation failed:', tableResult.error);
      return;
    }

    console.log('Table created:', tableResult.data);

    // Insert a record
    const recordResult = await client.record.insert('users', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });

    if (recordResult.error) {
      console.error('Record insertion failed:', recordResult.error);
      return;
    }

    console.log('Record inserted:', recordResult.data);

    // Query records
    const records = await client.record.findAll('users', {
      filters: [{ age: { $gte: 25 } }],
      sort: [{ field: 'name', order: 'asc' }],
    });

    console.log('Records found:', records);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
```

## Database Operations

For comprehensive database operations including advanced table management, column operations, and record handling, see the [@boltic/database-js README](./src/services/databases/README.md).

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
- **`client.tables.getMetadata(name)`**: Get table metadata

### Columns

- **`client.columns.create(tableName, data)`**: Create a new column
- **`client.columns.findAll(tableName, options?)`**: List columns with optional filtering
- **`client.columns.findOne(tableName, options)`**: Get a specific column
- **`client.columns.update(tableName, options)`**: Update column properties
- **`client.columns.delete(tableName, options)`**: Delete a column

### Records

- **`client.record.insert(tableName, data)`**: Insert a new record
- **`client.record.findAll(tableName, options?)`**: List records with optional filtering
- **`client.record.findOne(tableName, options)`**: Get a specific record
- **`client.record.update(tableName, options)`**: Update records by filters
- **`client.record.updateById(tableName, options)`**: Update record by ID
- **`client.record.delete(tableName, options)`**: Delete records by filters
- **`client.record.deleteByIds(tableName, options)`**: Delete records by IDs

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

## Support

For support, email support@boltic.io or create an issue on [GitHub](https://github.com/bolticio/boltic-sdk).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
