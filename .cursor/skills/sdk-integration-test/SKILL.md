---
name: sdk-integration-test
description: Create and run integration tests for the Boltic SDK before publishing. Use when the user wants to test SDK operations, run integration tests, validate API calls, create test suites, or verify the SDK works end-to-end before a release.
---

# SDK Integration Testing

Create and run integration tests to validate SDK operations against a live API before publishing.

## Test Architecture

The SDK uses two testing approaches:

1. **CLI example scripts** (`examples/<module>-test.ts`) — manual integration tests run via `npx tsx`
2. **Vitest unit/integration tests** (`tests/`) — automated tests run via `npm test`

## Running Existing Tests

```bash
# Run all vitest tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Type check
npm run type-check

# Run CLI integration tests
npx tsx src/services/workflows/examples/workflow-test.ts all
npx tsx src/services/databases/examples/basic/comprehensive-database-operations-demo.ts
```

## Creating a New Integration Test Suite

### Step 1: Create Vitest Test File

File: `src/services/<module>/tests/<module>.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '../../../index';
import type { BolticSuccessResponse, BolticErrorResponse } from '../../../services/common';

const API_KEY = process.env.BOLTIC_API_KEY || '';
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'sit') as 'sit' | 'uat' | 'prod';
const REGION = 'asia-south1' as const;

function isError(result: { error?: unknown; data?: unknown }): result is BolticErrorResponse {
  return 'error' in result && !!result.error && !('data' in result && result.data !== undefined);
}

describe('<Module> Integration Tests', () => {
  const client = createClient(API_KEY, { region: REGION, environment: ENVIRONMENT });

  describe('operationName', () => {
    it('should succeed with valid params', async () => {
      const result = await client.moduleName.operationName({ /* params */ });
      expect(isError(result)).toBe(false);
      if (!isError(result)) {
        expect(result.data).toBeDefined();
      }
    });

    it('should return error for invalid params', async () => {
      const result = await client.moduleName.operationName({ /* bad params */ });
      expect(isError(result)).toBe(true);
    });
  });
});
```

### Step 2: Create CLI Example Test

File: `src/services/<module>/examples/<module>-test.ts`

Follow the existing pattern — see workflow-test.ts for reference:

```typescript
import * as dotenv from 'dotenv';
import { createClient } from '../../../index';

dotenv.config({ path: '.env' });

const API_KEY = process.env.BOLTIC_API_KEY || '<YOUR_API_KEY>';
const REGION = 'asia-south1' as const;
const ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT || 'prod') as 'sit' | 'uat' | 'prod';

function separator(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function isError(result: { error?: unknown; data?: unknown }): boolean {
  return 'error' in result && !!result.error && !result.data;
}

function getClient(debug = false) {
  return createClient(API_KEY, { region: REGION, environment: ENVIRONMENT, debug });
}

// Individual test functions...

async function testOperation1(): Promise<void> {
  separator('operation1');
  const client = getClient();
  const result = await client.moduleName.operation1({ /* params */ });
  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('SUCCESS:', JSON.stringify(result, null, 2));
}

// CLI router
const TESTS: Record<string, (...args: string[]) => Promise<void>> = {
  'operation1': async () => { await testOperation1(); },
  'all': async () => { await testOperation1(); /* ...more */ },
};

async function main() {
  const [testName, ...rest] = process.argv.slice(2);
  console.log(`Boltic SDK – <Module> Integration Tests`);
  console.log(`Region: ${REGION} | Environment: ${ENVIRONMENT}`);

  if (!testName || !TESTS[testName]) {
    console.log('\nAvailable tests:');
    Object.keys(TESTS).forEach(t => console.log(`  ${t}`));
    process.exit(testName ? 1 : 0);
  }

  await TESTS[testName](...rest);
  separator('Done');
}

main().catch(err => { console.error('Unhandled error:', err); process.exit(1); });
```

## Pre-Publish Validation Checklist

Run all of these before publishing a new version:

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Build
npm run build

# 4. Module import validation
npm run test:module

# 5. Unit tests
npm test

# 6. Integration tests (requires BOLTIC_API_KEY in .env)
npx tsx src/services/workflows/examples/workflow-test.ts all
npx tsx src/services/databases/examples/basic/comprehensive-database-operations-demo.ts

# 7. Coverage report
npm run test:coverage
```

## Environment Setup

All config comes from `.env` in the repo root. Never hardcode keys or ask the user which environment — just read from `.env`:

```
BOLTIC_API_KEY=your-api-key-here
BOLTIC_ENVIRONMENT=sit
BOLTIC_TABLE_NAME=optional-default-table
```

Tests always read `process.env.BOLTIC_API_KEY` and `process.env.BOLTIC_ENVIRONMENT` via `dotenv.config({ path: '.env' })`.

## Testing Patterns

### Test Response Shape

```typescript
it('should return expected data shape', async () => {
  const result = await client.moduleName.operation({ /* params */ });
  if (!isError(result)) {
    const data = result.data as Record<string, unknown>;
    expect(data).toHaveProperty('expected_field');
  }
});
```

### Test Pagination

```typescript
it('should support pagination', async () => {
  const page1 = await client.moduleName.list({ page: 1, per_page: 5 });
  expect(isError(page1)).toBe(false);
});
```

### Test Error Handling

```typescript
it('should handle not found gracefully', async () => {
  const result = await client.moduleName.getById('non-existent-id');
  expect(isError(result)).toBe(true);
  if (isError(result)) {
    expect(result.error.code).toBeDefined();
  }
});
```
