# Storage module

Canonical notes for the Boltic SDK storage surface (`SERVICE_PATHS.STORAGE`). Keep in sync with **`../SKILL.md`** when you change behavior or paths.

**Scope:** change only `src/services/storage/**`, storage wiring on `BolticClient`, `SERVICE_PATHS.STORAGE`, root `src/index.ts` storage exports, and **`scripts/test-module-boltic-storage.mjs`** — **not** workflows, serverless, or databases table/SQL resources.

- **Gateway path:** `SERVICE_PATHS.STORAGE` in `base-api-client.ts` — same regional host resolution as `DATABASES` (`resolveServiceURL`).
- **Implementation reference:** backend panel `storage` routes + controllers (query/body field names).

**Layout:** `types/` → `api/endpoints/` → `api/clients/storage-api-client.ts` → `client/resources/storage.ts` → `BolticClient.storage` → exports in `storage/src/index.ts` and root `src/index.ts`.

**Auth:** `x-boltic-token` from base client. Optional `createClient(..., { headers })` merges into requests when needed; examples and `test-module-boltic-storage.mjs` do not set `headers`.

**Upload:** `client.storage.upload` → **`POST /upload`** (multipart, `file` field). Server persists objects. Response may include wire field `shareable_link`; the SDK exposes **`temporary_sharable_link`** on **`UploadData`** (and accepts either key when normalizing).

**List:** Each item is normalized to **only** these keys: `name`, `path`, `folderName`, `parentPath`, `isDirectory`, `isPublic`, `cdnUrl`, `fullPath`, `size`, `updatedAt` (object metadata flattened to `size` / `updatedAt`).

**ACL:** `makePublic` / `makePrivate` call **`POST /change-object-access`**. Prefer parsing the response **`{ message, name, size, updated, public }`**; if that shape is missing, list the parent folder and build **`ObjectAccessSummary`** (same fields, with default `message` strings).

**Download:** `downloadFile` → **`POST /file-export`**; response body is file bytes (`DownloadFileData.bytes`).

**User-facing docs (Gyrate):** `Boltic/services/gyrate/docs/sdk/storage/` — `overview.md` mirrors workflow-style SDK docs (`client.storage`, errors, end-to-end flow); per-method pages under the same folder.

**Docs:** When you change storage behavior or paths, update **`../SKILL.md`** and this file together; keep Gyrate storage docs aligned when the public surface changes.
