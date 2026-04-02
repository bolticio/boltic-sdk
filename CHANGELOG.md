# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.6] - 2026-04-02

> Added

- **Storage SDK** — File storage on the same `BoticClient` / `createClient` instance as databases and other services via `client.storage`.
- **Storage operations**: `list` (files and folders with a stable row shape), `upload` (multipart; optional temporary or public URL per options), `createFolder`, `deleteFile`, `makePublic` / `makePrivate` (returns a small object summary: name, size, updated, public), and `downloadFile` (file bytes for a path).
- **Public exports**: `StorageResource`, `StorageApiClient`, `STORAGE_ENDPOINTS`, `buildStorageEndpointPath`, storage constants (`DEFAULT_STORAGE_TYPE`, `MAX_SIGNED_URL_EXPIRE_MINUTES`), and storage TypeScript types (list/upload/folder/delete/access/download params and response shapes).
- **Example**: `src/services/storage/examples/storage-test.ts` for exercising the storage API.
  > Changed
- **HTTP layer**: Support for binary response bodies (used for downloads) in the shared HTTP adapters; added `binary-response-body` helper.

## [v0.1.5] - 2026-03-27

> Added

- Add `x-request-source: sdk` header to SQL requests (`/tables/query/execute` and `/tables/query/text-to-sql`) to identify executions originating from SDK functions.

## [v0.1.2] - 2026-02-24

> Changed

- Tables are now always public; removed table sharing APIs and `is_public` filtering.

## [v0.0.10] - 2026-02-01

> Fixed

- Table list/findByName send db_id and resource_id in the request body filters; TableQueryOptions.where.resource_id for optional override (default 'boltic').
- Use `options.where.resource_id` if provided; otherwise default to `'boltic'`.

## [v0.0.9] - 2026-01-14

> Added

- New encrypted-columns-demo example showcasing deterministic and non-deterministic encrypted columns, default show_decrypted behavior, validation of default_value, encrypted inserts, decryption overrides, and filtering behavior.

> Changed

- Enhanced database SDK records/columns/tables client APIs, transformers, and type definitions to better support encrypted columns and related operations.

- Updated database service README and package metadata/scripts to reflect the new examples and capabilities.
