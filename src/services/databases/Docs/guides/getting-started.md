# Getting Started with @boltic/database-js

## Prerequisites

Before you begin, ensure you have:

- Node.js >=18.0.0
- NPM >=8.0.0
- A Boltic API key

## Installation

Install the SDK using npm:

```bash
npm install @boltic/database-js
```

## Basic Usage

### Initialize the Client

```typescript
import { createClient } from '@boltic/database-js';

// Initialize with your API key
const boltic = createClient('your-api-key');

// Or with custom environment
const boltic = createClient('your-api-key', {
  environment: 'sit', // 'local', 'sit', 'uat', 'prod'
  timeout: 30000,
  debug: true,
});
```

### Environment Configuration

The SDK supports multiple environments:

- `local` - http://localhost:8000
- `sit` - https://asia-south1.api.fcz0.de/service/panel/boltic-tables
- `uat` - https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables
- `prod` - https://asia-south1.api.boltic.io/service/panel/boltic-tables (default)

## Next Steps

- [API Reference](../api/)
- [Examples](../../examples/)
- [Configuration Guide](./configuration.md)
