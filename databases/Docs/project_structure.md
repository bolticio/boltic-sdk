# Project Structure

## Root Directory

```
databases
├── src/                          # Source code
│   ├── client/                   # Core client implementation
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── cache/                    # Caching implementations
│   ├── errors/                   # Error classes and handling
│   └── index.ts                  # Main entry point
├── dist/                         # Built output (generated)
│   ├── esm/                      # ESM format output
│   ├── cjs/                      # CommonJS format output
│   ├── umd/                      # UMD format output
│   └── types/                    # Type declaration files
├── examples/                     # Usage examples
│   ├── basic/                    # Basic usage examples
│   ├── react/                    # React integration example
│   ├── vue/                      # Vue integration example
│   ├── node/                     # Node.js server example
│   └── nextjs/                   # Next.js full-stack example
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   ├── mocks/                    # Mock data and utilities
│   └── fixtures/                 # Test fixtures
├── docs/                         # Documentation
│   ├── api/                      # Generated API docs
│   ├── guides/                   # Usage guides
│   ├── migration/                # Migration guides
│   └── examples/                 # Code examples
├── scripts/                      # Build and development scripts
├── .github/                      # GitHub Actions and templates
│   ├── workflows/                # CI/CD workflows
│   └── ISSUE_TEMPLATE/           # Issue templates
├── package.json                  # Package configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

## Detailed Structure

### `/src` - Source Code

```
src/
├── client/
│   ├── core/
│   │   ├── base-client.ts        # Base HTTP client implementation
│   │   ├── config.ts             # Configuration management
│   │   └── interceptors.ts       # Request/response interceptors
│   ├── resources/
│   │   ├── database.ts           # Database operations
│   │   ├── table.ts              # Table operations
│   │   ├── column.ts             # Column operations
│   │   ├── record.ts             # Record operations
│   │   └── sql.ts                # SQL query interface
│   └── index.ts                  # Client exports
├── types/
│   ├── api/
│   │   ├── database.ts           # Database API types
│   │   ├── table.ts              # Table API types
│   │   ├── column.ts             # Column API types
│   │   ├── record.ts             # Record API types
│   │   └── sql.ts                # SQL API types
│   ├── common/
│   │   ├── pagination.ts         # Pagination types
│   │   ├── sorting.ts            # Sorting types
│   │   ├── filtering.ts          # Filtering types
│   │   └── responses.ts          # Response wrapper types
│   ├── config/
│   │   ├── client.ts             # Client configuration types
│   │   ├── environment.ts        # Environment types
│   │   └── auth.ts               # Authentication types
│   └── index.ts                  # Type exports
├── utils/
│   ├── http/
│   │   ├── fetch-adapter.ts      # Fetch API adapter
│   │   ├── axios-adapter.ts      # Axios adapter (fallback)
│   │   ├── request-builder.ts    # Request building utilities
│   │   └── response-parser.ts    # Response parsing utilities
│   ├── query/
│   │   ├── builder.ts            # Query builder
│   │   ├── validator.ts          # Query validation
│   │   └── serializer.ts         # Query serialization
│   ├── validation/
│   │   ├── schema.ts             # Schema validation
│   │   ├── field-types.ts        # Field type validation
│   │   └── sanitizer.ts          # Input sanitization
│   └── common/
│       ├── logger.ts             # Logging utilities
│       ├── debug.ts              # Debug helpers
│       └── helpers.ts            # Common helper functions
├── cache/
│   ├── adapters/
│   │   ├── memory.ts             # Memory cache adapter
│   │   ├── localStorage.ts       # localStorage adapter
│   │   └── custom.ts             # Custom cache adapter interface
│   ├── manager.ts                # Cache manager
│   ├── policies.ts               # Cache policies
│   └── index.ts                  # Cache exports
├── errors/
│   ├── base.ts                   # Base error class
│   ├── api-error.ts              # API error class
│   ├── validation-error.ts       # Validation error class
│   ├── network-error.ts          # Network error class
│   └── index.ts                  # Error exports
└── index.ts                      # Main SDK entry point
```

### `/examples` - Usage Examples

```
examples/
├── basic/
│   ├── package.json
│   ├── index.js                  # Basic usage example
│   └── README.md
├── react/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx               # React app with SDK
│   │   ├── hooks/
│   │   │   └── useBoltic.ts      # Custom React hook
│   │   └── components/
│   │       ├── DatabaseList.tsx
│   │       ├── TableManager.tsx
│   │       └── RecordEditor.tsx
│   └── README.md
├── vue/
│   ├── package.json
│   ├── src/
│   │   ├── App.vue               # Vue app with SDK
│   │   ├── composables/
│   │   │   └── useBoltic.ts      # Vue composable
│   │   └── components/
│   │       ├── DatabaseList.vue
│   │       ├── TableManager.vue
│   │       └── RecordEditor.vue
│   └── README.md
├── node/
│   ├── package.json
│   ├── server.js                 # Express server example
│   ├── data-migration.js         # Data migration script
│   └── README.md
└── nextjs/
    ├── package.json
    ├── pages/
    │   ├── api/
    │   │   └── boltic/            # API routes using SDK
    │   └── dashboard/             # Dashboard pages
    ├── components/                # React components
    └── README.md
```

### `/tests` - Test Files

```
tests/
├── unit/
│   ├── client/
│   │   ├── core/
│   │   │   ├── base-client.test.ts
│   │   │   ├── config.test.ts
│   │   │   └── interceptors.test.ts
│   │   └── resources/
│   │       ├── database.test.ts
│   │       ├── table.test.ts
│   │       ├── column.test.ts
│   │       ├── record.test.ts
│   │       └── sql.test.ts
│   ├── utils/
│   │   ├── http/
│   │   ├── query/
│   │   ├── validation/
│   │   └── common/
│   ├── cache/
│   └── errors/
├── integration/
│   ├── api-flows/
│   │   ├── database-lifecycle.test.ts
│   │   ├── table-management.test.ts
│   │   └── record-operations.test.ts
│   ├── caching/
│   │   ├── cache-strategies.test.ts
│   │   └── cache-invalidation.test.ts
│   └── error-handling/
│       ├── network-errors.test.ts
│       └── validation-errors.test.ts
├── e2e/
│   ├── browser/
│   │   ├── react-app.test.ts
│   │   └── vue-app.test.ts
│   └── node/
│       └── server-usage.test.ts
├── mocks/
│   ├── api/
│   │   ├── responses/            # Mock API responses
│   │   └── handlers.ts           # MSW handlers
│   ├── data/
│   │   ├── databases.ts          # Mock database data
│   │   ├── tables.ts             # Mock table data
│   │   └── records.ts            # Mock record data
│   └── index.ts
├── fixtures/
│   ├── configs/                  # Test configurations
│   ├── schemas/                  # Test schemas
│   └── data/                     # Test data files
└── setup/
    ├── vitest.setup.ts           # Test setup
    ├── msw.setup.ts              # MSW setup
    └── helpers.ts                # Test helpers
```

### `/docs` - Documentation

```
docs/
├── api/                          # Generated API documentation
├── guides/
│   ├── getting-started.md
│   ├── configuration.md
│   ├── database-operations.md
│   ├── table-management.md
│   ├── record-operations.md
│   ├── sql-queries.md
│   ├── caching.md
│   ├── error-handling.md
│   ├── testing.md
│   └── troubleshooting.md
├── migration/
│   ├── from-raw-api.md
│   └── version-upgrades.md
└── examples/
    ├── basic-usage.md
    ├── advanced-queries.md
    ├── framework-integration.md
    └── best-practices.md
```

### `/scripts` - Build and Development Scripts

```
scripts/
├── build.ts                      # Build script
├── dev.ts                        # Development script
├── test.ts                       # Test script
├── docs.ts                       # Documentation generation
├── release.ts                    # Release script
└── clean.ts                      # Cleanup script
```

## Configuration Files

### Package Configuration

#### `package.json`

```json
{
  "name": "@boltic/database-js",
  "version": "1.0.0",
  "description": "TypeScript SDK for Boltic Tables infrastructure",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./testing": {
      "import": "./dist/esm/testing/index.js",
      "require": "./dist/cjs/testing/index.js",
      "types": "./dist/types/testing/index.d.ts"
    }
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "sideEffects": false,
  "keywords": ["boltic", "database", "sdk", "typescript", "api"],
  "repository": {
    "type": "git",
    "url": "https://github.com/boltic/database-js.git"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src tests examples",
    "lint:fix": "eslint src tests examples --fix",
    "format": "prettier --write src tests examples docs",
    "docs:generate": "typedoc src/index.ts",
    "docs:serve": "npx serve docs/api",
    "release": "npm run build && npm run test && npm publish",
    "prepare": "husky install"
  }
}
```

### TypeScript Configuration

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "sourceMap": true,
    "removeComments": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "examples"]
}
```

### Build Configuration

#### `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        testing: resolve(__dirname, 'src/testing/index.ts'),
      },
      formats: ['es', 'cjs', 'umd'],
      name: 'BolticDatabase',
    },
    rollupOptions: {
      external: ['axios'],
      output: {
        globals: {
          axios: 'axios',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
});
```

## Module Organization

### Core Modules

- **Client Core**: Base HTTP client, configuration, interceptors
- **Resources**: API resource implementations (Database, Table, Column, Record, SQL)
- **Types**: Complete TypeScript type definitions
- **Utils**: Reusable utilities for HTTP, querying, validation
- **Cache**: Multi-level caching system
- **Errors**: Comprehensive error handling

### Feature Modules

- **Authentication**: API key management and validation
- **Query Builder**: Fluent query building interface
- **Field Types**: Type-specific validation and serialization
- **Progress Tracking**: Upload/download progress monitoring
- **Request Management**: Timeout, cancellation, retry logic

### Testing Modules

- **Mocks**: Mock implementations for testing
- **Fixtures**: Test data and configurations
- **Utilities**: Testing helper functions
- **Adapters**: Framework-specific test utilities

## Environment-Specific Configurations

### Development

- Source maps enabled
- Debug logging active
- Hot module replacement
- Type checking in watch mode

### Testing

- Mock API endpoints
- Coverage reporting
- Parallel test execution
- Environment isolation

### Production

- Minified bundles
- Tree-shaking enabled
- Source maps (external)
- Performance monitoring
