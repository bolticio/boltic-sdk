# Boltic SDK — Agent Guide

## Overview

`@boltic/sdk` is a TypeScript SDK for the Boltic platform (databases, workflows, and future modules). It builds to ESM + CJS via Vite with full type declarations.

- **Package**: `@boltic/sdk` v0.1.3
- **Entry**: `src/index.ts` → `dist/sdk.mjs` (ESM) / `dist/sdk.js` (CJS)
- **Node**: >=18, npm >=8
- **Test**: Vitest
- **Lint**: ESLint + Prettier (semi, singleQuote, trailingComma es5, printWidth 80, tabWidth 2)

## Architecture

```
src/
├── index.ts                          # Root exports — ALL public API surfaces
├── auth/                             # Auth helpers (standalone)
├── errors/                           # Error factories (standalone)
├── types/                            # Root-level type re-exports
├── utils/                            # Root-level utilities
├── testing/                          # Test helpers
└── services/
    ├── common/                       # Shared infrastructure (base classes, HTTP, types)
    │   ├── client/                   # BaseClient, BaseResource, BaseApiClient, ConfigManager, AuthManager
    │   ├── http/                     # HttpAdapter, FetchAdapter, AxiosAdapter
    │   ├── types/                    # BolticSuccessResponse, BolticErrorResponse, Environment, Region
    │   └── errors/                   # Error formatting utilities
    ├── databases/                    # Database service module (tables, columns, records, SQL, indexes)
    │   └── src/
    │       ├── api/clients/          # *ApiClient classes (extend BaseApiClient)
    │       ├── api/endpoints/        # Endpoint path + method definitions
    │       ├── api/transformers/     # SDK ↔ API format converters
    │       ├── client/resources/     # *Resource classes (extend BaseResource)
    │       ├── client/boltic-client.ts  # Main BolticClient facade
    │       ├── types/                # Domain types per resource
    │       └── utils/                # Filters, helpers, streaming
    └── workflows/                    # Workflow service module
        └── src/
            ├── api/clients/          # WorkflowApiClient
            ├── api/endpoints/        # WORKFLOW_ENDPOINTS
            ├── client/resources/     # WorkflowResource
            ├── types/                # Workflow domain types
            └── utils/                # Form transformers
```

## Service Module Pattern

Every service module follows this 5-layer architecture:

```
Layer 1: types/         → TypeScript interfaces for request/response shapes
Layer 2: api/endpoints/ → Endpoint definitions (path, method, authenticated)
Layer 3: api/clients/   → API client class extending BaseApiClient (HTTP calls)
Layer 4: client/resources/ → Resource class extending BaseResource (business logic)
Layer 5: BolticClient   → Facade getter wiring resource into public API
```

### Adding a New Operation

When adding an operation to an existing service, you must touch all 5 layers:

1. **types/** — Add request params interface + response data type
2. **api/endpoints/** — Add endpoint to the endpoints object + interface
3. **api/clients/** — Add method to the API client class
4. **client/resources/** — Add method to the resource class
5. **boltic-client.ts** — Wire into the `get <service>()` accessor
6. **index.ts** (service) — Export new types
7. **src/index.ts** (root) — Export new types from root

### Creating a New Module

A new module needs this file structure:

```
src/services/<module>/
├── src/
│   ├── index.ts              # Module exports
│   ├── constants.ts          # Module constants (optional)
│   ├── api/
│   │   ├── index.ts          # API layer exports
│   │   ├── clients/<module>-api-client.ts
│   │   └── endpoints/<module>.ts
│   ├── client/
│   │   ├── index.ts          # Client layer exports
│   │   └── resources/<module>.ts
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   └── <module>.ts       # Domain types
│   └── utils/                # Module-specific utilities (optional)
└── examples/
    └── <module>-test.ts      # CLI test script
```

Plus wiring in `BolticClient` and root `src/index.ts`.

## Base Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `BaseApiClient` | `common/client/base-api-client.ts` | HTTP + auth + error handling. Subclasses pass `servicePath`. |
| `BaseResource` | `common/client/base-resource.ts` | Resource with `makeRequest()`, `buildQueryParams()`, `handleResponse()` |
| `BaseClient` | `common/client/base-client.ts` | Full HTTP client with interceptors + retries |
| `ConfigManager` | `common/client/config.ts` | Environment/region/timeout config |
| `AuthManager` | `common/client/auth-manager.ts` | API key validation + headers |

## Service Paths

```typescript
SERVICE_PATHS = {
  DATABASES: '/service/sdk/boltic-tables/v1',
  WORKFLOW_TEMPORAL: '/service/panel/temporal/v1.0',
  INTEGRATION: '/service/panel/integration/v1',
}
```

New modules add their service path here.

## Response Types

All API methods return `BolticSuccessResponse<T> | BolticErrorResponse`:

```typescript
interface BolticSuccessResponse<T> { data: T; message?: string; }
interface BolticErrorResponse { error: { code: string; message: string; meta: string[]; }; }
```

Use `isErrorResponse(result)` guard to check.

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Vite build + post-build script |
| `npm run dev` | Watch mode |
| `npm test` | Vitest |
| `npm run test:coverage` | Coverage report |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run lint:fix` | Auto-fix lint |

## Environment

- `.env` file with `BOLTIC_API_KEY`, `BOLTIC_ENVIRONMENT` (sit/uat/prod), `BOLTIC_TABLE_NAME`
- Regions: `asia-south1`, `us-central1`
- Environments: `local`, `sit`, `uat`, `prod`

## Conventions

- Strict TypeScript, explicit types on all public APIs
- No `any` — use `unknown` + type guards
- Error handling: always return `BolticErrorResponse`, never throw from API/resource methods
- Endpoint definitions use `{param}` placeholder syntax resolved by `buildEndpointPath()`
- API client methods: try/catch wrapping `httpAdapter.request()`, returning `formatErrorResponse()` on failure
- Resource methods: orchestrate API client calls, add business logic (polling, transforms, ID resolution)
- Auth header: `x-boltic-token` (not Bearer)
