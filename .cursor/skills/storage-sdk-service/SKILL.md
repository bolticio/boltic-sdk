---
name: storage-sdk-service
description: Edit Boltic SDK panel storage. Use when changing src/services/storage, SERVICE_PATHS.STORAGE, or BolticClient.storage.
---

# Storage SDK

**Principles:** smallest change that works; match existing serverless/workflow patterns; no extra abstractions.

**On every storage change:** update **this file** and **`references/storage-sdk-module.md`** together.

## Scope — do not change other services

Edit **only** storage-related surface:

| OK | Not (unless a shared bug blocks storage) |
|----|---------------------------------------------|
| `src/services/storage/**` | `src/services/workflows/**`, `serverless/**` |
| `SERVICE_PATHS.STORAGE` in `common/client/base-api-client.ts` | Other `SERVICE_PATHS` entries |
| Minimal `BolticClient` wiring: `storage` import + field + ctor + `get storage()` + `updateAllResourcesConfig()` | Tables/columns/records/sql/workflow/serverless getters or resources |
| Root `src/index.ts` storage exports only | Refactors of unrelated exports |
| `scripts/test-module-boltic-storage.mjs` | — |

Do **not** refactor `common/http`, `databases` resources, or other modules for storage work.

## Facts

- Base URL: `SERVICE_PATHS.STORAGE` in `src/services/common/client/base-api-client.ts` (same `resolveServiceURL` / host as `DATABASES`).
- Backend: panel storage routes + controllers — verify path/query/body before coding.
- **Upload:** `upload` → `POST /upload` (multipart, field `file`). Server persists objects. Wire may return `shareable_link`; SDK maps it to **`temporary_sharable_link`** on `UploadData`.
- **List:** `GET .../list` — SDK normalizes each row to **only**: `name`, `path`, `folderName`, `parentPath`, `isDirectory`, `isPublic`, `cdnUrl`, `fullPath`, `size`, `updatedAt` (metadata flattened).
- **ACL:** `makePublic` / `makePrivate` → `POST /change-object-access`, then a follow-up list to return **`ObjectAccessSummary`**: `{ name, size, updated, public }` only (no raw ACL body).
- **Download:** `downloadFile` → `POST /file-export` (binary body via `arraybuffer` on the HTTP layer).

## Layers (touch only what you need)

types → `api/endpoints/storage.ts` → `storage-api-client.ts` → `storage.ts` resource → `boltic-client.ts` `storage` getter → `src/services/storage/src/index.ts` + root `src/index.ts` exports.

- API client: `try` / `catch` → `formatErrorResponse(error, 'STORAGE')`.
- Multipart: `FormData`, strip `Content-Type` after `buildHeaders()` (see `upload`).
- Headers: `StorageApiClient` forwards `client.getConfig().headers` when set (`ClientOptions.headers` on `BolticClient`). Smoke script and TS example omit it; use only if your deployment needs extra headers.
- Config refresh: `updateAllResourcesConfig()` must recreate `StorageResource`.

## Check

`npm run type-check` and eslint on files you changed.

**Local built SDK smoke test:** `npm run build` then `npm run test:module:storage -- help` / `full` / per-operation commands (see `scripts/test-module-boltic-storage.mjs`).

**Gyrate (public docs):** `Boltic/services/gyrate/docs/sdk/storage/` — update `overview.md` and method pages when you change `client.storage` behavior; follow the same structure as `docs/sdk/workflows/`.
