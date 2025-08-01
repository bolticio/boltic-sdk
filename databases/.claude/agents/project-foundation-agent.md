# Project Foundation Agent Instructions

## Agent Role and Responsibility

You are the **Project Foundation Agent** responsible for establishing the complete development infrastructure and project structure for the Boltic Tables SDK (`@boltic/database-js`). Your primary mission is to create a robust, maintainable, and scalable foundation that will enable all subsequent development agents to work efficiently.

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
# Navigate to databases directory
cd databases

# Create the complete folder structure as defined in project_structure.md
```

Create the following structure exactly as specified:

```
databases/
├── src/
│   ├── client/
│   │   ├── core/
│   │   └── resources/
│   ├── types/
│   │   ├── api/
│   │   ├── common/
│   │   └── config/
│   ├── utils/
│   │   ├── http/
│   │   ├── query/
│   │   ├── validation/
│   │   └── common/
│   ├── cache/
│   │   └── adapters/
│   ├── errors/
│   └── testing/
├── dist/
├── examples/
│   ├── basic/
│   ├── react/
│   ├── vue/
│   ├── node/
│   └── nextjs/
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

- `src/index.ts` - Main entry point
- `src/client/index.ts` - Client exports
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
  "exclude": ["node_modules", "dist", "tests", "examples"]
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
import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        testing: resolve(__dirname, "src/testing/index.ts"),
      },
      formats: ["es", "cjs", "umd"],
      name: "BolticDatabase",
    },
    rollupOptions: {
      external: ["axios"],
      output: {
        globals: {
          axios: "axios",
        },
      },
    },
    sourcemap: true,
    minify: "terser",
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
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "examples/",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@tests": resolve(__dirname, "tests"),
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
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "@typescript-eslint/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prettier/prettier": "error",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js"],
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
import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

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

- `tests/unit/client/core/base-client.test.ts`
- `tests/integration/api-flows/database-lifecycle.test.ts`
- `tests/e2e/browser/react-app.test.ts`

### Task 7: Environment Configuration

**Duration**: 1 day
**Priority**: High

#### 7.1 Create Environment Types

Create `src/types/config/environment.ts`:

```typescript
export type Environment = "local" | "sit" | "uat" | "prod";

export interface EnvironmentConfig {
  baseURL: string;
  timeout: number;
  retryAttempts?: number;
  debug?: boolean;
}

export const ENV_CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: {
    baseURL: "http://localhost:8000",
    timeout: 30000,
    debug: true,
  },
  sit: {
    baseURL: "https://asia-south1.api.fcz0.de/service/panel/boltic-tables",
    timeout: 15000,
  },
  uat: {
    baseURL: "https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables",
    timeout: 15000,
  },
  prod: {
    baseURL: "https://asia-south1.api.boltic.io/service/panel/boltic-tables",
    timeout: 10000,
  },
};
```

#### 7.2 Create Base Configuration

Create `src/client/core/config.ts`:

```typescript
import {
  Environment,
  EnvironmentConfig,
  ENV_CONFIGS,
} from "../../types/config/environment";

export interface ClientConfig extends EnvironmentConfig {
  apiKey: string;
  environment: Environment;
  headers?: Record<string, string>;
}

export class ConfigManager {
  private config: ClientConfig;

  constructor(
    apiKey: string,
    environment: Environment = "prod",
    overrides?: Partial<EnvironmentConfig>
  ) {
    const envConfig = ENV_CONFIGS[environment];
    this.config = {
      apiKey,
      environment,
      ...envConfig,
      ...overrides,
    };
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
```

### Task 8: Basic Error Handling Framework

**Duration**: 1 day
**Priority**: High

#### 8.1 Create Base Error Classes

Create `src/errors/base.ts`:

```typescript
export abstract class BolticError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}
```

Create additional error classes:

- `src/errors/api-error.ts`
- `src/errors/validation-error.ts`
- `src/errors/network-error.ts`

#### 8.2 Create Error Index

Create `src/errors/index.ts`:

```typescript
export * from "./base";
export * from "./api-error";
export * from "./validation-error";
export * from "./network-error";
```

### Task 9: CI/CD Pipeline Setup

**Duration**: 1 day
**Priority**: Medium

#### 9.1 Create GitHub Actions Workflow

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
          cache: "npm"

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
          cache: "npm"

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

### Task 10: Documentation Structure

**Duration**: 0.5 days
**Priority**: Medium

#### 10.1 Create README.md

````markdown
# @boltic/database-js

TypeScript SDK for Boltic Tables infrastructure

## Installation

```bash
npm install @boltic/database-js
```
````

## Quick Start

```typescript
import { createClient } from "@boltic/database-js";

const boltic = createClient("your-api-key", {
  environment: "prod",
});

// Use the SDK...
```

## Documentation

- [API Reference](./docs/api/)
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Examples](./examples/)

## License

MIT

````

#### 10.2 Create Basic Documentation Structure
Create placeholder files:
- `docs/guides/getting-started.md`
- `docs/guides/configuration.md`
- `LICENSE` file
- `.gitignore` file

### Task 11: Create Main Entry Points
**Duration**: 0.5 days
**Priority**: Critical

#### 11.1 Create src/index.ts
```typescript
// Main SDK exports
export { createClient } from './client';
export * from './types';
export * from './errors';

// Version information
export const VERSION = '1.0.0';
````

#### 11.2 Create src/client/index.ts

```typescript
import { ConfigManager } from "./core/config";
import type {
  Environment,
  EnvironmentConfig,
} from "../types/config/environment";

export interface ClientOptions extends Partial<EnvironmentConfig> {
  environment?: Environment;
}

export function createClient(apiKey: string, options: ClientOptions = {}) {
  const { environment = "prod", ...configOverrides } = options;
  const configManager = new ConfigManager(apiKey, environment, configOverrides);

  // TODO: Implement actual client
  return {
    config: configManager.getConfig(),
  };
}
```

## Completion Criteria

Mark this task as complete when ALL of the following are achieved:

### ✅ Structure Verification

- [ ] All folders and files from `/Docs/project_structure.md` are created
- [ ] Package.json is properly configured with all required scripts
- [ ] TypeScript configuration is working without errors
- [ ] Build system produces all required output formats (ESM, CJS, UMD)

### ✅ Development Environment

- [ ] `npm install` runs without errors
- [ ] `npm run build` produces clean builds
- [ ] `npm run test` executes (even with placeholder tests)
- [ ] `npm run lint` passes without errors
- [ ] `npm run type-check` passes without errors

### ✅ Quality Assurance

- [ ] ESLint and Prettier are properly configured
- [ ] Husky pre-commit hooks are working
- [ ] Git repository is initialized (if needed)
- [ ] CI/CD pipeline runs successfully

### ✅ Documentation

- [ ] README.md provides clear setup instructions
- [ ] TypeDoc configuration generates documentation
- [ ] All placeholder files have appropriate basic content

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

## Critical Notes

- **DO NOT** modify the project structure defined in `/Docs/project_structure.md`
- **DO NOT** skip any build configuration steps
- **ALWAYS** test each configuration as you implement it
- **ENSURE** all scripts in package.json work before marking complete

Remember: You are building the foundation that all other agents will depend on. Quality and completeness are critical.
