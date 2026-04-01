import type { BolticErrorResponse } from '../../../common';

export type StorageApiEndpoint = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
};

/** List query — forwarded to backend object listing. */
export interface ListStorageParams {
  storageType?: string;
  /** Folder prefix to list under */
  basePath?: string;
  pageSize?: number | string;
  nextPageToken?: string;
}

/** Response shape from `GET .../list` — `{ files: listResult }`. */
export interface StorageListFilesPayload {
  data?: StorageListItem[];
  next_page_token?: string;
  totalCount?: number;
}

/**
 * List row — only these fields are returned (size / `updatedAt` flattened from object metadata).
 */
export interface StorageListItem {
  name?: string;
  path?: string;
  folderName?: string;
  parentPath?: string;
  isDirectory?: boolean;
  isPublic?: boolean;
  cdnUrl?: string | null;
  /** Full object path in the bucket: `parentPath/name` for files, when derivable. */
  fullPath?: string;
  /** Byte size as string (from object metadata). */
  size?: string;
  /** Last update time (from `updated` / `timeUpdated` in raw metadata). */
  updatedAt?: string;
}

export interface ListStorageData {
  files: StorageListFilesPayload;
}

export interface CreateFolderParams {
  storageType?: string;
  /** Target folder path (`folder_path` body field). */
  folder_path: string;
}

export interface CreateFolderData {
  message: string;
}

export interface DeleteFileParams {
  storageType?: string;
  /** Full object path in bucket */
  filename: string;
  /** Optional metering payload (Zenith sends `totalsize`). */
  filepath?: string;
  totalsize?: number;
}

export interface DeleteFileData {
  message: unknown;
}

export interface ChangeObjectAccessParams {
  /** Full file path in bucket */
  file_path: string;
  /** `true` = public, `false` = private */
  public: boolean;
  /** Optional cache TTL when making public (seconds). */
  ttl_seconds?: number;
}

/** Returned by `makePublic` / `makePrivate` after a successful ACL change (from a follow-up list). */
export interface ObjectAccessSummary {
  /** Full object path in the bucket (list `name` from the API when present). */
  name: string;
  size: string | null;
  updated: string | null;
  public: boolean;
}

/**
 * Shared multipart fields for `POST /upload` (direct upload handler).
 *
 * **Preferred — `public` (mapped by the SDK):**
 * - Omitted or `false` → private upload.
 * - `true` **without** `expire_in` → permanent public (CDN-style `public_url`); sends `is_public_permanent`, not time-limited signed upload.
 * - `true` **with** `expire_in` → temporary signed read URL (`temporary_sharable_link` on upload response). `expire_in` is **minutes**, max 7 days (SDK clamps to `MAX_SIGNED_URL_EXPIRE_MINUTES`).
 *
 * If **`public` is set** (including `false`), it takes precedence over `is_public` / `is_public_permanent` for the wire shape.
 *
 * **Legacy (omit `public`):** set `is_public` / `is_public_permanent` / `expire_in` directly as the backend expects.
 */
export interface UploadMultipartFields {
  storageType?: string;
  file: Blob;
  filepath?: string;
  overwrite?: boolean | string;
  /**
   * High-level visibility. See interface JSDoc. When present, controls how `is_public` / `is_public_permanent` / `expire_in` are sent.
   */
  public?: boolean | string;
  /** @deprecated Prefer `public` unless you need raw backend fields. */
  is_public?: boolean | string;
  /**
   * Signed URL lifetime in **minutes** when using `public: true` (temporary) or legacy `is_public: true`.
   * Capped at 7 days; the SDK clamps to `MAX_SIGNED_URL_EXPIRE_MINUTES`.
   */
  expire_in?: number | string;
  /** @deprecated Prefer `public: true` without `expire_in` unless you need raw backend fields. */
  is_public_permanent?: boolean | string;
}

/**
 * Direct upload — `POST /upload` (multipart). The handler reads `req.body.filename` (not `file_name`).
 * Multer: `file` field. Path: `filepath` + `filename`.
 */
export type UploadParams = UploadMultipartFields &
  (
    | { filename: string; file_name?: string }
    | { file_name: string; filename?: string }
  );

export interface UploadData {
  message: string;
  path: string;
  /** Temporary signed read URL (mapped from API `shareable_link` when present). */
  temporary_sharable_link?: string;
  public_url?: string;
}

/** `POST /file-export` — byte range download; SDK requests full file by default. */
export interface DownloadFileParams {
  storageType?: string;
  /** Full object path in bucket (same as list `fullPath` / delete `filename`). */
  file_name: string;
  /**
   * Size in bytes from `list()` item `size`. If omitted, the SDK lists the parent folder
   * and matches by `fullPath` / `name`.
   */
  sizeBytes?: number | string;
}

export interface DownloadFileData {
  bytes: ArrayBuffer;
  /** Usually 206 Partial Content for range responses. */
  status: number;
  contentType?: string;
}

export type StorageSuccess<T> = T;

export type StorageResponse<T> = StorageSuccess<T> | BolticErrorResponse;
