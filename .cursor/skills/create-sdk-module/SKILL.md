---
name: create-sdk-module
description: Scaffold a new Boltic SDK service module from scratch with all required files, base classes, types, and wiring. Use when the user wants to create a new module, add a new service like serverless or pipelines, or introduce a new API surface area to the SDK.
---

# Create New SDK Module

Scaffold a complete new service module following the SDK's 5-layer architecture.

## Required Input

Gather from the user before starting:

1. **Module name** (e.g., `serverless`, `pipelines`) — used for directory and class names
2. **Service path(s)** — the user will provide the backend API base path(s) (e.g., `/service/panel/serverless/v1`). Some modules need multiple paths (like workflows uses both `WORKFLOW_TEMPORAL` and `INTEGRATION`).
3. **Operations** — list of operations with: name, HTTP method, URL path, request params. Response shape is optional — default to `Record<string, unknown>`.
4. **Constants** — any polling intervals, retry configs, or defaults (optional)

## Step 1: Add Service Path(s)

File: `src/services/common/client/base-api-client.ts`

```typescript
export const SERVICE_PATHS = {
  // ... existing
  NEW_MODULE: '/service/panel/module-name/v1',
  // If module needs a second service path:
  NEW_MODULE_SECONDARY: '/service/panel/module-other/v1',
} as const;
```

If the module uses multiple service paths, the API client constructor uses the primary one via `super()`, and resolves the secondary one via `this.resolveAdditionalServiceURL()` (see `WorkflowApiClient` for reference).

## Step 2: Create Directory Structure

```
src/services/<module>/
├── src/
│   ├── index.ts
│   ├── constants.ts          (if needed)
│   ├── api/
│   │   ├── index.ts
│   │   ├── clients/<module>-api-client.ts
│   │   └── endpoints/<module>.ts
│   ├── client/
│   │   ├── index.ts
│   │   └── resources/<module>.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── <module>.ts
│   └── utils/                (if needed)
│       └── <utility>.ts
└── examples/
    └── <module>-test.ts
```

## Step 3: Create Types

File: `src/services/<module>/src/types/<module>.ts`

```typescript
import type {
  Region,
  Environment,
  BolticSuccessResponse,
  BolticErrorResponse,
  BaseApiClientConfig,
} from '../../../common';

export type { Region, Environment, BolticSuccessResponse, BolticErrorResponse, BaseApiClientConfig };

export interface ModuleApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
}

// Add request/response interfaces for each operation
```

File: `src/services/<module>/src/types/index.ts`

```typescript
export * from './<module>';
```

## Step 4: Create Endpoints

File: `src/services/<module>/src/api/endpoints/<module>.ts`

Define `MODULE_ENDPOINTS` object and `buildModuleEndpointPath()` function. Follow the pattern from `src/services/workflows/src/api/endpoints/workflows.ts`.

## Step 5: Create API Client

File: `src/services/<module>/src/api/clients/<module>-api-client.ts`

```typescript
import {
  BaseApiClient,
  SERVICE_PATHS,
  type BaseApiClientConfig,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type { /* param/response types */ } from '../../types/<module>';
import { MODULE_ENDPOINTS, buildModuleEndpointPath } from '../endpoints/<module>';

type ModuleResponse<T> = BolticSuccessResponse<T> | BolticErrorResponse;

export class ModuleApiClient extends BaseApiClient {
  // If module uses a secondary service path:
  private secondaryBaseURL: string;

  constructor(apiKey: string, config: Omit<BaseApiClientConfig, 'apiKey'> = {}) {
    super(apiKey, config, SERVICE_PATHS.NEW_MODULE);
    // Only if module needs a secondary service path:
    this.secondaryBaseURL = this.resolveAdditionalServiceURL(SERVICE_PATHS.NEW_MODULE_SECONDARY);
  }

  // Add methods for each operation following the API client pattern
  // Use this.baseURL for primary service, this.secondaryBaseURL for secondary
}
```

File: `src/services/<module>/src/api/index.ts`

```typescript
export { ModuleApiClient } from './clients/<module>-api-client';
export { MODULE_ENDPOINTS, buildModuleEndpointPath } from './endpoints/<module>';
```

## Step 6: Create Resource

File: `src/services/<module>/src/client/resources/<module>.ts`

```typescript
import { ModuleApiClient } from '../../api/clients/<module>-api-client';
import {
  BaseResource,
  BaseClient,
  isErrorResponse,
  type BolticErrorResponse,
  type BolticSuccessResponse,
} from '../../../../common';
import type { /* types */ } from '../../types/<module>';

export class ModuleResource extends BaseResource {
  private apiClient: ModuleApiClient;

  constructor(client: BaseClient) {
    super(client, '/<module>');
    const config = client.getConfig();
    this.apiClient = new ModuleApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
    });
  }

  // Add methods for each operation
}
```

File: `src/services/<module>/src/client/index.ts`

```typescript
export { ModuleResource } from './resources/<module>';
```

## Step 7: Create Module Index

File: `src/services/<module>/src/index.ts`

```typescript
export { ModuleResource } from './client';
export { ModuleApiClient } from './api';
export { MODULE_ENDPOINTS, buildModuleEndpointPath } from './api';
// Export constants if they exist
// Export all domain types
export type { /* all types */ } from './types';
```

## Step 8: Wire into BolticClient

File: `src/services/databases/src/client/boltic-client.ts`

1. Import the resource class:
```typescript
import { ModuleResource } from '../../../<module>/src/client/resources/<module>';
```

2. Import needed param types:
```typescript
import type { Op1Params, Op2Params } from '../../../<module>/src/types/<module>';
```

3. Add private field:
```typescript
private moduleResource: ModuleResource;
```

4. Initialize in constructor:
```typescript
this.moduleResource = new ModuleResource(this.baseClient);
```

5. Add getter:
```typescript
get moduleName() {
  return {
    op1: (params: Op1Params) => this.moduleResource.op1(params),
    op2: (id: string) => this.moduleResource.op2(id),
  };
}
```

6. Add to `updateAllResourcesConfig()`:
```typescript
this.moduleResource = new ModuleResource(this.baseClient);
```

## Step 9: Update Root Exports

File: `src/index.ts`

```typescript
// Export module
export { ModuleResource } from './services/<module>/src/client';
export type { /* all public types */ } from './services/<module>/src/types';
// Export utilities if any
```

## Step 10: Create Example Test

File: `src/services/<module>/examples/<module>-test.ts`

Follow the pattern from `src/services/workflows/examples/workflow-test.ts`:
- dotenv config
- createClient helper
- Individual test functions per operation
- CLI router with named commands
- `main()` entry point

## Checklist

- [ ] Service path added to `SERVICE_PATHS`
- [ ] Directory structure created
- [ ] Types file with all interfaces
- [ ] Endpoints file with path/method definitions
- [ ] API client class with all methods
- [ ] Resource class with all methods + JSDoc
- [ ] Module index.ts with all exports
- [ ] BolticClient: import, field, constructor init, getter, updateAllResourcesConfig
- [ ] Root index.ts exports
- [ ] Example test script
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
