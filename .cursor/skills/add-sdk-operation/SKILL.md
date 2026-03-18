---
name: add-sdk-operation
description: Add a new API operation to an existing Boltic SDK service module from a cURL reference or API specification. Use when the user wants to add an endpoint, operation, method, or API call to an existing service like workflows or databases, or provides a cURL command to implement.
---

# Add SDK Operation from cURL / API Reference

Add a new operation to an existing service module by touching all 5 layers of the SDK architecture.

## Step 1: Parse the Browser cURL

The user will paste a **browser cURL** (copied from Chrome/Firefox DevTools → "Copy as cURL"). These are verbose. Extract only what matters:

| Field | How to extract | Example |
|-------|---------------|---------|
| **HTTP method** | `-X POST` or `--request POST`. If absent, it's GET | `POST` |
| **Full URL** | First quoted string after `curl` | `https://api.boltic.io/service/panel/temporal/v1.0/workflows/execute/activity` |
| **Relative path** | Strip base domain + service path prefix. Match prefix against `SERVICE_PATHS` in `src/services/common/client/base-api-client.ts` | `/workflows/execute/activity` |
| **Path params** | Dynamic URL segments (IDs, slugs) → replace with `{param_name}` | `/workflows/run/abc-123` → `/workflows/run/{run_id}` |
| **Query params** | `?key=value` pairs in URL | `?page=1&per_page=10` |
| **Request body** | `--data-raw '{...}'` or `-d '{...}'` or `--data '{...}'` | JSON object |
| **Response shape** | User provides separately if needed; otherwise use `Record<string, unknown>` | — |

**IGNORE these browser cURL fields** (handled by BaseApiClient):
- All `-H` headers (especially `cookie`, `user-agent`, `accept-*`, `sec-*`, `referer`, `origin`)
- `--compressed` flag
- `x-boltic-token` header (injected by `buildHeaders()`)
- `content-type` header (always `application/json`)

**Determine the target module** by matching the URL's service path prefix:
- `/service/sdk/boltic-tables/v1` → databases
- `/service/panel/temporal/v1.0` → workflows
- `/service/panel/integration/v1` → workflows (integration base URL)
- Other → ask user which module, or create new module

## Step 2: Add Types

File: `src/services/<module>/src/types/<module>.ts`

```typescript
/** Params accepted by `<module>.<operationName>()` */
export interface OperationNameParams {
  required_field: string;
  optional_field?: number;
}

/** Data returned from the operation API */
export type OperationNameResponseData = Record<string, unknown>;
// Use concrete interface if response shape is known
```

Also add to the type barrel: `src/services/<module>/src/types/index.ts`

## Step 3: Add Endpoint

File: `src/services/<module>/src/api/endpoints/<module>.ts`

1. Add to the endpoints interface:
```typescript
export interface ModuleEndpoints {
  // ... existing
  operationName: ModuleApiEndpoint;
}
```

2. Add to the endpoints object:
```typescript
export const MODULE_ENDPOINTS: ModuleEndpoints = {
  // ... existing
  operationName: {
    path: '/resource/{param}/action',
    method: 'POST',
    authenticated: true,
  },
};
```

## Step 4: Add API Client Method

File: `src/services/<module>/src/api/clients/<module>-api-client.ts`

Add a method following this pattern:

```typescript
async operationName(
  params: OperationNameParams
): Promise<ModuleResponse<OperationNameResponseData>> {
  try {
    const endpoint = MODULE_ENDPOINTS.operationName;
    // If path params exist:
    const path = buildModuleEndpointPath(endpoint, { param: params.param_field });
    // If query params exist:
    const query = new URLSearchParams({ key: String(params.optional_field ?? default) });
    // Build URL:
    const url = `${this.baseURL}${path}?${query.toString()}`;
    // Or without query: const url = `${this.baseURL}${path}`;

    const response = await this.httpAdapter.request<
      ModuleResponse<OperationNameResponseData>
    >({
      url,
      method: endpoint.method,
      headers: this.buildHeaders(),
      data: requestBody, // only for POST/PUT/PATCH
      timeout: this.config.timeout,
    });

    return response.data;
  } catch (error: unknown) {
    return this.formatErrorResponse(error, 'MODULE_PREFIX');
  }
}
```

## Step 5: Add Resource Method

File: `src/services/<module>/src/client/resources/<module>.ts`

```typescript
async operationName(
  params: OperationNameParams
): Promise<BolticSuccessResponse<OperationNameResponseData> | BolticErrorResponse> {
  return this.apiClient.operationName(params);
}
```

Add JSDoc with `@param`, `@returns`, and `@example` showing `client.<module>.operationName(...)`.

## Step 6: Wire into BolticClient

File: `src/services/databases/src/client/boltic-client.ts`

Add to the existing `get <module>()` getter:

```typescript
get moduleName() {
  return {
    // ... existing operations
    operationName: (params: OperationNameParams) =>
      this.moduleResource.operationName(params),
  };
}
```

Import the new params type at the top of the file.

## Step 7: Update Exports

1. **Service index** (`src/services/<module>/src/index.ts`):
   - Export new type(s)

2. **Root index** (`src/index.ts`):
   - Add new type(s) to the module's type export block

## Step 8: Add Example/Test

File: `src/services/<module>/examples/<module>-test.ts`

Add a test function and register it in the CLI router:

```typescript
async function testOperationName(): Promise<void> {
  separator('operationName');
  const client = getClient();
  const result = await client.moduleName.operationName({ ... });
  if (isError(result)) {
    console.error('ERROR:', JSON.stringify(result, null, 2));
    return;
  }
  console.log('SUCCESS:', JSON.stringify(result, null, 2));
}
```

## Handling Response Types

- If the user provides a response/result JSON, extract the shape and create a concrete interface.
- If the user does NOT provide a response shape, default to `Record<string, unknown>` — can be refined later.

```typescript
// When user provides response shape:
export interface OperationNameResponseData {
  id: string;
  status: string;
  created_at: string;
}

// When no response shape provided:
export type OperationNameResponseData = Record<string, unknown>;
```

## Checklist

- [ ] Types added (params + response)
- [ ] Endpoint added to interface and object
- [ ] API client method implemented
- [ ] Resource method implemented with JSDoc
- [ ] BolticClient getter updated
- [ ] Service index exports updated
- [ ] Root index exports updated
- [ ] Example/test added
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
