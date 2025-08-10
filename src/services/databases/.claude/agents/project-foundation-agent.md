# Project Foundation Agent Instructions - Updated

## Agent Role and Responsibility

You are the **Project Foundation Agent** responsible for establishing the complete development infrastructure and project structure for the Boltic SDK (`@boltic/sdk`). The SDK's primary mission is to provide a unified interface for database operations through the `createClient` function, which exposes table and column management capabilities.

## Current Architecture Overview

The Boltic SDK is structured as:

- **Main SDK** (`/src`): Provides unified entry point and facade for databases functionality
- **Databases Module** (`/databases`): Contains complete implementation of database operations
- **Core Features**: Table operations (create, read, update, delete) and Column operations (create, read, update, delete)

## Prerequisites

Before starting, you MUST:

1. **Consult Documentation**: Read `/databases/Docs/Implementation.md` for Stage 1 requirements
2. **Follow Project Structure**: Strictly adhere to `/databases/Docs/project_structure.md`
3. **Check Bug Tracking**: Review `/databases/Docs/Bug_tracking.md` for any known setup issues

## Primary Tasks - Updated Structure

### Task 1: Main SDK Structure Setup

**Duration**: 1 day
**Priority**: Critical

#### 1.1 Main SDK Directory Structure (`/src`)

The main SDK provides a clean facade to databases functionality:

```bash
src/
├── auth/                    # Generic auth module (for future expansion)
│   ├── auth-manager.ts     # Generic auth manager
│   └── index.ts            # Auth exports
├── errors/                  # Error handling utilities
│   └── index.ts            # Common error functions
├── databases/               # Databases module facade
│   └── index.ts            # Re-exports createClient from databases
├── utils/                   # Basic utilities
│   └── index.ts            # Common utility functions
├── testing/                 # Testing utilities reference
│   └── index.ts            # Testing exports
└── index.ts                 # Main SDK entry point
```

#### 1.2 Key Integration Points

**Main Entry Point** (`src/index.ts`):

```typescript
// Main SDK exports - Boltic SDK for databases
export * from './auth';
export * from './errors';

// Export databases module - Primary functionality
export * from './databases';

// Version information
export const VERSION = '1.0.0';

// Main convenience exports for databases client
export { createClient } from './databases';
export type { ClientOptions, BolticClient } from './databases';
```

**Databases Facade** (`src/databases/index.ts`):

```typescript
// Export the databases client functionality
export interface ClientOptions {
  environment?: 'dev' | 'sit' | 'staging' | 'prod';
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  timeout?: number;
  debug?: boolean;
}

export function createClient(
  apiKey: string,
  options: ClientOptions = {}
): BolticClient {
  const { BolticClient } = require('../../databases/src/client/boltic-client');
  return new BolticClient(apiKey, options);
}
```

### Task 2: Package Configuration Updates

**Duration**: 0.5 days
**Priority**: Critical

#### 2.1 Main package.json Configuration

Ensure the main package.json is configured for the unified SDK:

```json
{
  "name": "@boltic/sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for Boltic databases infrastructure",
  "main": "dist/sdk.js",
  "module": "dist/sdk.mjs",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/sdk.mjs",
      "require": "./dist/sdk.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "sideEffects": false,
  "keywords": ["boltic", "sdk", "typescript", "api", "database"],
  "scripts": {
    "build": "vite build && node scripts/build.js",
    "dev": "vite build --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  }
}
```

### Task 3: Build System Configuration

**Duration**: 0.5 days  
**Priority**: Critical

#### 3.1 TypeScript Configuration

Ensure `tsconfig.json` is properly configured:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "examples"]
}
```

#### 3.2 Vite Configuration

Ensure `vite.config.ts` builds the unified SDK:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BolticSDK',
      formats: ['es', 'cjs'],
      fileName: (format) => `sdk.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['axios'],
    },
  },
});
```

### Task 4: Usage Validation

**Duration**: 1 day
**Priority**: High

#### 4.1 Verify SDK Usage Pattern

Ensure the SDK works as intended based on the comprehensive demo:

```typescript
import { createClient } from '@boltic/sdk';

const client = createClient('your-api-key', {
  environment: 'sit',
  debug: true
});

// Set database context
client.useDatabase('demo-db', 'Demo Database');

// Table operations
await client.tables.create({ name: 'users', fields: [...] });
await client.tables.findAll();
await client.tables.findOne({ where: { name: 'users' } });
await client.tables.delete('users');

// Column operations
await client.columns.create('users', { name: 'email', type: 'email' });
await client.columns.findAll('users');
await client.columns.update('users', { where: { name: 'email' }, set: {...} });
await client.columns.delete('users', { where: { name: 'email' } });
```

#### 4.2 Test Different Import Patterns

Verify all import patterns work:

```typescript
// Primary pattern
import { createClient } from '@boltic/sdk';

// Alternative patterns
import { BolticClient, ClientOptions } from '@boltic/sdk';
import { AuthManager } from '@boltic/sdk';
import { createErrorWithContext } from '@boltic/sdk';
```

### Task 5: Documentation Updates

**Duration**: 1 day
**Priority**: High

#### 5.1 Update README.md

Create a comprehensive README for the unified SDK:

````markdown
# @boltic/sdk

TypeScript SDK for Boltic databases infrastructure

## Installation

```bash
npm install @boltic/sdk
```
````

## Quick Start

```typescript
import { createClient } from '@boltic/sdk';

const client = createClient('your-api-key', {
  environment: 'prod'
});

client.useDatabase('my-database');

// Table operations
const tables = await client.tables.findAll();
const table = await client.tables.create({ name: 'users', fields: [...] });

// Column operations
const columns = await client.columns.findAll('users');
const column = await client.columns.create('users', { name: 'email', type: 'email' });
```

## Features

- ✅ Complete table management (CRUD operations)
- ✅ Comprehensive column operations (all types supported)
- ✅ Type-safe TypeScript interface
- ✅ Multiple environment support
- ✅ Built-in error handling
- ✅ Automatic retry mechanisms

## Documentation

- [Getting Started](./databases/Docs/guides/getting-started.md)
- [Table Operations](./databases/Docs/guides/table-management.md)
- [Column Operations](./databases/Docs/guides/column-operations.md)
- [Examples](./databases/examples/)

```

### Task 6: Clean Up Legacy Code

**Duration**: 0.5 days
**Priority**: Medium

#### 6.1 Remove Unused Modules

Ensure the `/src` directory only contains:
- Essential auth utilities (for future expansion)
- Error handling utilities
- Databases facade
- Basic utilities
- Testing references

#### 6.2 Verify No Duplicate Code

Ensure no functionality is duplicated between `/src` and `/databases` directories.

## Updated Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Structure Verification

- [x] Main SDK structure (`/src`) provides clean facade to databases
- [x] Databases implementation (`/databases`) contains complete functionality
- [x] No code duplication between main SDK and databases module
- [x] `createClient` function works from main SDK entry point

### ✅ Development Environment

- [x] `npm install` runs without errors
- [x] `npm run build` produces unified SDK bundle
- [x] `npm run test` executes successfully
- [x] `npm run type-check` passes without errors

### ✅ SDK Functionality

- [x] `createClient` function creates working database client
- [x] Table operations work (create, read, update, delete)
- [x] Column operations work (create, read, update, delete)
- [x] All column types are supported
- [x] Environment configuration works correctly

### ✅ Import Patterns

- [x] `import { createClient } from '@boltic/sdk'` works
- [x] `import { BolticClient, ClientOptions } from '@boltic/sdk'` works
- [x] TypeScript types are properly exported
- [x] CommonJS and ESM formats both work

### ✅ Documentation

- [x] README.md reflects unified SDK architecture
- [x] Project structure documentation is updated
- [x] All references point to correct implementation locations

## Dependencies for Next Agents

After completion, the following development can continue:

- **Feature Enhancement Agent** (can add new database features)
- **Testing Agent** (can create comprehensive SDK tests)
- **Documentation Agent** (can create detailed guides)
- **Examples Agent** (can create framework-specific examples)

## Critical Notes - Updated

- **DO NOT** duplicate functionality between `/src` and `/databases`
- **DO NOT** implement database operations in `/src` - use facade pattern only
- **ENSURE** `createClient` function properly instantiates the databases client
- **VERIFY** all usage patterns from comprehensive-demo.ts work correctly
- **MAINTAIN** clear separation between SDK facade and implementation
- **TEST** all import patterns work across different module systems

Remember: You are building a unified SDK that provides a clean interface to comprehensive database functionality. The main SDK should be a lightweight facade that exposes the full databases implementation through a simple, consistent API.
```
