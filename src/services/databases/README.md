# @boltic/database-js

TypeScript SDK for Boltic Tables infrastructure

## Prerequisites

- **Node.js:** >=18.0.0
- **NPM:** >=8.0.0

## Installation

```bash
npm install @boltic/database-js
```

## Quick Start

```typescript
import { createClient } from '@boltic/database-js';

const boltic = createClient('your-api-key', {
  environment: 'prod',
});

// Use the SDK...
```

## Documentation

- [API Reference](./docs/api/)
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Examples](./examples/)

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/bolticio/boltic-sdk.git
cd boltic-sdk/databases

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

## License

MIT
