# Project Structure - Boltic SDK

## Overview

The Boltic SDK is organized as a main SDK package that exposes the databases functionality as its primary feature. The databases module contains the complete implementation for table and column operations.

## Root Directory Structure

```
boltic-sdk/
├── src/                          # Main SDK source code
│   ├── auth/                     # Generic auth module
│   ├── errors/                   # Error handling utilities
│   ├── databases/                # Databases module facade
│   ├── utils/                    # Basic utilities
│   ├── testing/                  # Testing utilities
│   └── index.ts                  # Main SDK entry point
├── databases/                    # Complete databases implementation
│   ├── src/                      # Database-specific source code
│   │   ├── client/               # Core client implementation
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Database utility functions
│   │   ├── cache/                # Caching implementations
│   │   ├── errors/               # Database error classes
│   │   └── index.ts              # Databases module entry point
│   ├── examples/                 # Database usage examples
│   ├── tests/                    # Database-specific tests
│   └── docs/                     # Database documentation
├── dist/                         # Built SDK output (generated)
├── examples/                     # SDK usage examples
├── tests/                        # SDK-level tests
├── docs/                         # SDK documentation
└── scripts/                      # Build and development scripts
```

## Main SDK Structure (`/src`)

The main SDK provides a clean interface to the databases functionality:

```
src/
├── auth/                         # Generic authentication
│   ├── auth-manager.ts          # Generic auth manager
│   └── index.ts                 # Auth exports
├── errors/                       # Error utilities
│   └── index.ts                 # Common error functions
├── databases/                    # Databases facade
│   └── index.ts                 # Re-exports createClient from databases
├── utils/                        # Basic utilities
│   └── index.ts                 # Common utility functions
├── testing/                      # Testing utilities
│   └── index.ts                 # Testing exports
└── index.ts                      # Main SDK entry point
```

## Databases Module Structure (`/databases/src`)

The complete databases implementation:

```
databases/src/
├── client/
│   ├── core/
│   │   ├── base-client.ts        # Base HTTP client implementation
│   │   ├── config.ts             # Configuration management
│   │   ├── auth-manager.ts       # Database auth manager
│   │   ├── base-resource.ts      # Base resource class
│   │   └── interceptors.ts       # Request/response interceptors
│   ├── resources/
│   │   ├── table.ts              # Table operations
│   │   ├── table-builder.ts      # Table builder utility
│   │   ├── column.ts             # Column operations
│   │   └── column-builder.ts     # Column builder utility
│   ├── boltic-client.ts          # Main database client
│   └── index.ts                  # Client exports (createClient)
├── types/
│   ├── api/
│   │   ├── table.ts              # Table API types
│   │   └── column.ts             # Column API types
│   ├── common/
│   │   ├── operations.ts         # Common operation types
│   │   └── responses.ts          # Response wrapper types
│   ├── config/
│   │   ├── auth.ts               # Auth configuration types
│   │   └── environment.ts        # Environment types
│   └── index.ts                  # Type exports
├── utils/
│   ├── http/                     # HTTP utilities
│   ├── query/                    # Query building utilities
│   ├── validation/               # Validation utilities
│   ├── table/                    # Table-specific utilities
│   ├── column/                   # Column-specific utilities
│   └── filters/                  # Filter utilities
├── errors/                       # Database error handling
├── testing/                      # Database testing utilities
└── index.ts                      # Main databases entry point
```

## Usage Patterns

### Primary Usage (Databases Client)

```typescript
import { createClient } from '@boltic/sdk';

const client = createClient('your-api-key', {
  environment: 'prod',
  debug: false
});

// Set database context
client.useDatabase('my-database', 'My Database');

// Use table operations
const tables = await client.tables.findAll();
const table = await client.tables.create({ name: 'users', fields: [...] });

// Use column operations
const columns = await client.columns.findAll('users');
const column = await client.columns.create('users', { name: 'email', type: 'email' });
```

### Alternative Imports

```typescript
// Import specific client
import { BolticClient, ClientOptions } from '@boltic/sdk';

// Import auth utilities
import { AuthManager } from '@boltic/sdk';

// Import error utilities
import { createErrorWithContext, formatError } from '@boltic/sdk';
```

## Package Configuration

### Main Package.json

```json
{
  "name": "@boltic/sdk",
  "main": "dist/sdk.js",
  "module": "dist/sdk.mjs",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/sdk.mjs",
      "require": "./dist/sdk.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

### Build Configuration

#### TypeScript Configuration

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

#### Vite Configuration

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

## Module Organization

### Core Architecture

- **Main SDK Entry** (`src/index.ts`): Exposes databases functionality
- **Databases Facade** (`src/databases/index.ts`): Provides createClient function
- **Implementation** (`databases/src`): Complete databases functionality
- **Auth Layer** (`src/auth`): Generic authentication utilities
- **Error Handling** (`src/errors`): Common error utilities

### Key Features

- **Unified API**: Single createClient function for database operations
- **Type Safety**: Complete TypeScript support across all modules
- **Modular Design**: Clear separation between SDK facade and implementation
- **Environment Support**: Multiple environment configurations (dev, sit, staging, prod)
- **Error Handling**: Comprehensive error utilities and structured responses
- **Testing Support**: Built-in testing utilities and mock implementations

### Dependencies

- **Runtime**: axios (peer dependency)
- **Development**: TypeScript, Vite, Vitest, ESLint, Prettier
- **Build Output**: ESM, CommonJS, and TypeScript declarations

This structure provides a clean, focused SDK for database operations while maintaining flexibility for future expansion.
