# Project Foundation Agent Instructions

## Agent Role and Responsibility

You are the **Project Foundation Agent** responsible for establishing the complete development infrastructure and project structure for the Boltic SDK (`@boltic/sdk`). Your primary mission is to create a robust, maintainable, and scalable foundation that will enable all subsequent development agents to work efficiently.

## Prerequisites

Before starting, you MUST:

1. **Consult Documentation**: Read `/Docs/Implementation.md` for Stage 1 requirements
2. **Follow Project Structure**: Strictly adhere to `/Docs/project_structure.md`
3. **Check Bug Tracking**: Review `/Docs/Bug_tracking.md` for any known setup issues

## Primary Tasks

### Task 1: Project Structure Setup

**Duration**: 1-2 days
**Priority**: Critical

#### 1.1 Create Root Directory Structure

```bash
# The root directory is now the main SDK module
# Create the complete folder structure as defined in project_structure.md
```

Create the following structure exactly as specified:

```
boltic-sdk/
├── src/
│   ├── auth/                    # Generic auth module (used by all components)
│   │   ├── auth-manager.ts
│   │   └── index.ts
│   ├── client/
│   │   ├── core/
│   │   └── resources/
│   ├── databases/               # Database-specific module
│   │   └── index.ts
│   ├── types/
│   │   ├── auth.ts             # Generic auth types
│   │   ├── config/
│   │   └── common/
│   ├── utils/
│   │   ├── http/
│   │   ├── query/
│   │   ├── validation/
│   │   └── common/
│   ├── cache/
│   │   └── adapters/
│   ├── errors/
│   ├── testing/
│   └── index.ts                # Main SDK entry point
├── dist/
├── examples/
│   ├── basic/
│   ├── react/
│   ├── vue/
│   ├── node/
│   └── nextjs/
├── demos/                       # Demo scripts outside SDK
│   ├── demo.js                 # CommonJS demo
│   ├── demo.mjs                # ES Module demo
│   ├── demo.ts                 # TypeScript demo
│   └── README.md
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── mocks/
│   ├── fixtures/
│   └── setup/
├── docs/
│   ├── api/
│   ├── guides/
│   ├── migration/
│   └── examples/
├── scripts/
└── .github/
    └── workflows/
```

#### 1.2 Create Essential Files

Create these placeholder files with appropriate directory structure:

- `src/index.ts` - Main SDK entry point
- `src/auth/index.ts` - Auth module exports
- `src/databases/index.ts` - Databases module exports
- `src/types/index.ts` - Type exports
- `src/utils/index.ts` - Utility exports
- `src/cache/index.ts` - Cache exports
- `src/errors/index.ts` - Error exports
- `src/testing/index.ts` - Testing utilities export

### Task 2: Package Configuration

**Duration**: 1 day
**Priority**: Critical

#### 2.1 Create package.json

Use the exact configuration from `/Docs/project_structure.md`:

```json
{
  "name": "@boltic/sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for Boltic infrastructure",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./auth": {
      "import": "./dist/esm/auth/index.js",
      "require": "./dist/cjs/auth/index.js",
      "types": "./dist/types/auth/index.d.ts"
    },
    "./databases": {
      "import": "./dist/esm/databases/index.js",
      "require": "./dist/cjs/databases/index.js",
      "types": "./dist/types/databases/index.d.ts"
    },
    "./testing": {
      "import": "./dist/esm/testing/index.js",
      "require": "./dist/cjs/testing/index.js",
      "types": "./dist/types/testing/index.d.ts"
    }
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "sideEffects": false,
  "keywords": ["boltic", "sdk", "typescript", "api", "database", "auth"],
  "repository": {
    "type": "git",
    "url": "https://github.com/bolticio/boltic-sdk.git"
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
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitest/ui": "^1.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "terser": "^5.0.0",
    "typedoc": "^0.25.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.0.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "axios": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "axios": {
      "optional": true
    }
  }
}
```

#### 2.2 Install Dependencies

```bash
npm install
```

### Task 3: TypeScript Configuration

**Duration**: 0.5 days
**Priority**: Critical

#### 3.1 Create tsconfig.json

Use the exact configuration from `/Docs/project_structure.md`:

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
  "exclude": ["node_modules", "dist", "tests", "examples", "demos"]
}
```

#### 3.2 Create Additional TypeScript Configs

- `tsconfig.build.json` - For build-specific settings
- `tsconfig.test.json` - For test-specific settings

### Task 4: Build System Configuration

**Duration**: 1-2 days
**Priority**: Critical

#### 4.1 Create vite.config.ts

Use the exact configuration from `/Docs/project_structure.md`:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        auth: resolve(__dirname, 'src/auth/index.ts'),
        databases: resolve(__dirname, 'src/databases/index.ts'),
        testing: resolve(__dirname, 'src/testing/index.ts'),
      },
      formats: ['es', 'cjs', 'umd'],
      name: 'BolticSDK',
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

#### 4.2 Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'examples/',
        'demos/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
});
```

### Task 5: Code Quality Configuration

**Duration**: 1 day
**Priority**: High

#### 5.1 Create .eslintrc.js

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', '@typescript-eslint/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
```

#### 5.2 Create .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### 5.3 Create .prettierignore

```
node_modules
dist
coverage
.nyc_output
*.log
package-lock.json
```

#### 5.4 Setup Husky and lint-staged

```bash
# Initialize husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### Task 6: Testing Framework Setup

**Duration**: 1 day
**Priority**: High

#### 6.1 Create Test Setup Files

Create `tests/setup/vitest.setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});
```

#### 6.2 Create Basic Test Structure

Create placeholder test files:

- `tests/unit/auth/auth-manager.test.ts`
- `tests/unit/errors/utils.test.ts`
- `tests/integration/auth-flows/authentication.test.ts`

### Task 7: Generic Auth Module

**Duration**: 1 day
**Priority**: Critical

#### 7.1 Create Generic Auth Manager

Create `src/auth/auth-manager.ts`:

```typescript
import { createErrorWithContext } from '../errors';
import { AuthConfig, AuthHeaders, TokenInfo } from '../types/auth';

export class AuthManager {
  private config: AuthConfig;
  private tokenInfo: TokenInfo | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.validateApiKey(config.apiKey);
  }

  private validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw createErrorWithContext(
        'API key is required and must be a non-empty string',
        {
          name: 'AuthenticationError',
          code: 'INVALID_API_KEY',
        }
      );
    }

    // Basic format validation (adjust based on actual key format)
    if (apiKey.length < 10) {
      throw createErrorWithContext(
        'API key appears to be invalid (too short)',
        {
          name: 'AuthenticationError',
          code: 'INVALID_API_KEY_FORMAT',
        }
      );
    }
  }

  getAuthHeaders(): AuthHeaders {
    return {
      'x-boltic-token': this.config.apiKey,
    };
  }

  updateApiKey(newApiKey: string): void {
    this.validateApiKey(newApiKey);
    this.config.apiKey = newApiKey;
    this.tokenInfo = null; // Reset token info
  }

  isAuthenticated(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKeyAsync(): Promise<boolean> {
    // TODO: Implement actual API key validation endpoint call
    // For now, return basic validation
    try {
      this.validateApiKey(this.config.apiKey);
      return true;
    } catch {
      return false;
    }
  }

  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo ? { ...this.tokenInfo } : null;
  }

  // Generic method to get headers for any Boltic service
  getServiceHeaders(service?: string): AuthHeaders {
    const headers = this.getAuthHeaders();

    if (service) {
      headers['x-boltic-service'] = service;
    }

    return headers;
  }

  // Method to validate API key for specific service
  async validateForService(service: string): Promise<boolean> {
    try {
      const isValid = await this.validateApiKeyAsync();
      if (isValid) {
        // TODO: Add service-specific validation logic
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
```

#### 7.2 Create Auth Types

Create `src/types/auth.ts`:

```typescript
export interface AuthConfig {
  apiKey: string;
  tokenRefreshThreshold?: number; // seconds before expiry to refresh
  maxRetries?: number;
}

export interface AuthHeaders {
  'x-boltic-token': string;
  'x-boltic-service'?: string;
  [key: string]: string | undefined;
}

export interface TokenInfo {
  token: string;
  expiresAt?: Date;
  isValid: boolean;
}

export interface ServiceAuthConfig extends AuthConfig {
  service: string;
  serviceEndpoint?: string;
}
```

### Task 8: Error Handling Utilities

**Duration**: 0.5 days
**Priority**: High

#### 8.1 Create Error Utility Functions

Create `src/errors/index.ts`:

```typescript
/**
 * Utility functions for working with standard Error classes
 */

/**
 * Creates a structured error object with additional context
 */
export function createErrorWithContext(
  message: string,
  context?: Record<string, any>
): Error {
  const error = new Error(message);
  if (context) {
    // Add context as a property for debugging
    (error as any).context = context;
  }
  return error;
}

/**
 * Checks if an error is a network/HTTP related error
 */
export function isNetworkError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.name === 'AbortError')
  );
}

/**
 * Extracts HTTP status code from axios or fetch errors
 */
export function getHttpStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object') {
    // Axios error structure
    if (
      'response' in error &&
      error.response &&
      typeof error.response === 'object'
    ) {
      const response = error.response as any;
      if ('status' in response && typeof response.status === 'number') {
        return response.status;
      }
    }
    // Fetch Response error
    if ('status' in error && typeof (error as any).status === 'number') {
      return (error as any).status;
    }
  }
  return null;
}

/**
 * Formats error for logging/debugging
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    const context = (error as any).context;
    const statusCode = getHttpStatusCode(error);

    let formatted = `${error.name}: ${error.message}`;

    if (statusCode) {
      formatted += ` (HTTP ${statusCode})`;
    }

    if (context) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return formatted;
  }

  return String(error);
}
```

### Task 9: Demo Scripts

**Duration**: 1 day
**Priority**: High

#### 9.1 Create Demo Scripts

Create demo scripts in the `demos/` directory:

- `demos/demo.js` - CommonJS demo
- `demos/demo.mjs` - ES Module demo
- `demos/demo.ts` - TypeScript demo
- `demos/README.md` - Demo documentation

#### 9.2 Demo Features

Each demo should demonstrate:

- SDK import in different formats
- Authentication setup
- Error handling
- Type safety (TypeScript)
- Service-specific usage

### Task 10: CI/CD Pipeline Setup

**Duration**: 1 day
**Priority**: Medium

#### 10.1 Create GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Build
        run: npm run build

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Task 11: Documentation Structure

**Duration**: 0.5 days
**Priority**: Medium

#### 11.1 Create README.md

````markdown
# @boltic/sdk

TypeScript SDK for Boltic infrastructure

## Installation

```bash
npm install @boltic/sdk
```
````

## Quick Start

```typescript
import { AuthManager } from '@boltic/sdk';

const authManager = new AuthManager({
  apiKey: 'your-api-key',
});

// Use the SDK...
```

## Documentation

- [API Reference](./docs/api/)
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Examples](./examples/)
- [Demos](./demos/)

## License

MIT

````

#### 11.2 Create Basic Documentation Structure
Create placeholder files:
- `docs/guides/getting-started.md`
- `docs/guides/configuration.md`
- `LICENSE` file
- `.gitignore` file

### Task 12: Create Main Entry Points
**Duration**: 0.5 days
**Priority**: Critical

#### 12.1 Create src/index.ts
```typescript
// Main SDK exports
export * from './auth';
export * from './types/auth';
export * from './errors';

// Version information
export const VERSION = '1.0.0';

// Re-export databases module when available
// export * from './databases';
````

#### 12.2 Create src/auth/index.ts

```typescript
export { AuthManager } from './auth-manager';
export * from '../types/auth';
```

#### 12.3 Create src/databases/index.ts

```typescript
// Databases module exports
// This will be populated when the databases module is implemented

export const DATABASES_VERSION = '1.0.0';

// Placeholder for future database exports
export interface DatabaseClient {
  // TODO: Implement database client interface
}
```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Structure Verification

- [x] All folders and files from `/Docs/project_structure.md` are created
- [x] Package.json is properly configured with all required scripts
- [x] TypeScript configuration is working without errors
- [x] Build system produces all required output formats (ESM, CJS, UMD)

### ✅ Development Environment

- [x] `npm install` runs without errors
- [x] `npm run build` produces clean builds
- [x] `npm run test` executes (even with placeholder tests)
- [x] `npm run lint` passes without errors
- [x] `npm run type-check` passes without errors

### ✅ Quality Assurance

- [x] ESLint and Prettier are properly configured
- [x] Husky pre-commit hooks are working
- [x] Git repository is initialized (if needed)
- [x] CI/CD pipeline runs successfully

### ✅ Documentation

- [x] README.md provides clear setup instructions
- [x] TypeDoc configuration generates documentation
- [x] All placeholder files have appropriate basic content
- [x] Demo scripts are created and documented

### ✅ Multi-Format Support

- [x] SDK works when imported in .js files (CommonJS)
- [x] SDK works when imported in .mjs files (ES Modules)
- [x] SDK works when imported in .ts files (TypeScript)
- [x] All demo scripts demonstrate proper usage

## Error Handling Protocol

If you encounter any issues:

1. **FIRST**: Check `/Docs/Bug_tracking.md` for similar issues
2. **Log the issue** using the template in Bug_tracking.md
3. **Include**: Full error messages, environment details, and steps attempted
4. **Document the solution** once resolved

## Dependencies for Next Agents

After completion, the following agents can begin work:

- **Core Infrastructure Agent** (depends on this foundation)
- **API Integration Agent** (can work on HTTP client structure)
- **Database Module Agent** (can work on database-specific features)

## Critical Notes

- **DO NOT** modify the project structure defined in `/Docs/project_structure.md`
- **DO NOT** skip any build configuration steps
- **ALWAYS** test each configuration as you implement it
- **ENSURE** all scripts in package.json work before marking complete
- **VERIFY** multi-format support works correctly
- **TEST** all demo scripts before completion

Remember: You are building the foundation that all other agents will depend on. Quality and completeness are critical. The SDK must work across all supported formats (.js, .mjs, .ts).
