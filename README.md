# boltic-sdk

Boltic SDK is a TypeScript SDK that simplifies integration with the Boltic platform. It provides utilities, type definitions, and helper methods to streamline building, testing, and deploying cloud integrations, webhooks, and workflows.

## Features

- 🔧 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🚀 **Modern Build**: ES modules and CommonJS support
- 🔐 **Authentication**: Built-in authentication management
- 📊 **Database Operations**: Simplified database and table management
- 🧪 **Testing Utilities**: Built-in testing helpers
- 📦 **Zero Dependencies**: Lightweight with optional peer dependencies

## Installation

```bash
npm install boltic-sdk
```

## Quick Start

```typescript
import { BolticSDK } from 'boltic-sdk';

// Initialize the SDK
const sdk = new BolticSDK({
  apiKey: 'your-api-key',
  environment: 'production', // or 'development'
});

// Use the SDK
const databases = sdk.databases;
const auth = sdk.auth;
```

## Usage Examples

### Authentication

```typescript
import { BolticSDK } from 'boltic-sdk';

const sdk = new BolticSDK({
  apiKey: 'your-api-key',
});

// Authenticate
await sdk.auth.authenticate();
```

### Database Operations

```typescript
import { BolticSDK } from 'boltic-sdk';

const sdk = new BolticSDK({
  apiKey: 'your-api-key',
});

// Create a table
const table = await sdk.databases.tables.create({
  name: 'users',
  columns: [
    { name: 'id', type: 'uuid', primary: true },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'text', unique: true },
  ],
});

// Query data
const users = await sdk.databases.tables.query('users', {
  select: ['id', 'name', 'email'],
  where: { email: 'user@example.com' },
});
```

## API Reference

### Configuration

```typescript
interface BolticConfig {
  apiKey: string;
  environment?: 'production' | 'development';
  baseUrl?: string;
}
```

### Core Modules

- **`sdk.auth`**: Authentication management
- **`sdk.databases`**: Database and table operations
- **`sdk.testing`**: Testing utilities

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

For support, email support@boltic.io or join our Slack channel.
