# Configuration Guide

## Environment Configuration

The SDK is designed to work across different environments with appropriate configurations for each.

### Supported Environments

| Environment | Base URL                                                        | Default Timeout | Debug Mode |
| ----------- | --------------------------------------------------------------- | --------------- | ---------- |
| `local`     | http://localhost:8000                                           | 30s             | Yes        |
| `sit`       | https://asia-south1.api.fcz0.de/service/panel/boltic-tables     | 15s             | No         |
| `uat`       | https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables | 15s             | No         |
| `prod`      | https://asia-south1.api.boltic.io/service/panel/boltic-tables   | 10s             | No         |

### Custom Configuration

You can override default settings:

```typescript
import { createClient } from '@boltic/database-js';

const boltic = createClient('your-api-key', {
  environment: 'prod',
  timeout: 60000, // Override timeout to 60 seconds
  debug: true, // Enable debug mode in production
  headers: {
    // Add custom headers
    'X-Custom-Header': 'value',
  },
});
```

### API Key Management

Store your API keys securely:

```typescript
// Use environment variables
const apiKey = process.env.BOLTIC_API_KEY;

// Or load from secure configuration
const boltic = createClient(apiKey, {
  environment: process.env.NODE_ENV === 'production' ? 'prod' : 'sit',
});
```

## Error Handling

The SDK provides utilities for handling different types of errors:

```typescript
import { isNetworkError, formatError } from '@boltic/database-js';

try {
  // SDK operations
} catch (error) {
  if (isNetworkError(error)) {
    console.log('Network error occurred:', formatError(error));
  } else {
    console.log('Other error:', formatError(error));
  }
}
```
