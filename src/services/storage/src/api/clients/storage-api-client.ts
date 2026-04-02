/**
 * Storage API client — extends BaseApiClient like serverless/workflow clients.
 */

import {
  BaseApiClient,
  SERVICE_PATHS,
  type BaseApiClientConfig,
  type BolticErrorResponse,
  type HttpRequestConfig,
} from '../../../../common';
import {
  DEFAULT_STORAGE_TYPE,
  MAX_SIGNED_URL_EXPIRE_MINUTES,
} from '../../constants';
import type {
  ChangeObjectAccessParams,
  CreateFolderData,
  CreateFolderParams,
  DeleteFileParams,
  DownloadFileData,
  DownloadFileParams,
  ListStorageData,
  ListStorageParams,
  ObjectAccessSummary,
  StorageListItem,
  UploadData,
  UploadParams,
} from '../../types/storage';
import {
  STORAGE_ENDPOINTS,
  buildStorageEndpointPath,
} from '../endpoints/storage';

type StorageResult<T> = T | BolticErrorResponse;

const ERR_PREFIX = 'STORAGE' as const;

export class StorageApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config, SERVICE_PATHS.STORAGE);
  }

  /** Shared try/catch + http — same idea as inlined blocks in serverless/workflow clients, but DRY for storage. */
  private async requestStorage<T>(
    config: HttpRequestConfig
  ): Promise<StorageResult<T>> {
    try {
      const response = await this.httpAdapter.request<StorageResult<T>>(config);
      return response.data;
    } catch (error: unknown) {
      return this.formatErrorResponse(error, ERR_PREFIX);
    }
  }

  private url(path: string, query?: URLSearchParams): string {
    const qs = query?.toString();
    return qs ? `${this.baseURL}${path}?${qs}` : `${this.baseURL}${path}`;
  }

  private storageTypeQuery(storageType?: string): URLSearchParams {
    const q = new URLSearchParams();
    q.set('storageType', storageType ?? DEFAULT_STORAGE_TYPE);
    return q;
  }

  private listQuery(params: ListStorageParams): URLSearchParams {
    const q = this.storageTypeQuery(params.storageType);
    if (params.basePath !== undefined) {
      q.set('basePath', params.basePath);
    }
    if (params.pageSize !== undefined) {
      q.set('pageSize', String(params.pageSize));
    }
    if (params.nextPageToken !== undefined) {
      q.set('nextPageToken', params.nextPageToken);
    }
    return q;
  }

  /** `expire_in` is minutes; clamp to max temporary URL lifetime (7 days). */
  private normalizeExpireInMinutes(raw: number | string): number {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        'expire_in must be a positive number of minutes (max 7 days for temporary signed URLs)'
      );
    }
    const truncated = Math.trunc(n);
    return Math.min(Math.max(1, truncated), MAX_SIGNED_URL_EXPIRE_MINUTES);
  }

  private isTruthyFormFlag(v: boolean | string | undefined): boolean {
    if (v === undefined) return false;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  /**
   * `public` shortcut: true + no expire_in → permanent; true + expire_in → temporary signed URL; false → private.
   * Legacy: omit `public` and pass `is_public` / `is_public_permanent` / `expire_in` as before.
   */
  private appendUploadVisibility(form: FormData, params: UploadParams): void {
    const hasPublic = Object.prototype.hasOwnProperty.call(params, 'public');
    if (hasPublic) {
      const pub = this.isTruthyFormFlag(params.public);
      if (!pub) {
        form.append('is_public', 'false');
        return;
      }
      if (params.expire_in !== undefined) {
        form.append('is_public', 'true');
        form.append(
          'expire_in',
          String(this.normalizeExpireInMinutes(params.expire_in))
        );
        return;
      }
      form.append('is_public', 'false');
      form.append('is_public_permanent', 'true');
      return;
    }
    if (params.is_public !== undefined) {
      form.append('is_public', String(params.is_public));
    }
    if (params.expire_in !== undefined) {
      form.append(
        'expire_in',
        String(this.normalizeExpireInMinutes(params.expire_in))
      );
    }
    if (params.is_public_permanent !== undefined) {
      form.append('is_public_permanent', String(params.is_public_permanent));
    }
  }

  private buildUploadForm(params: UploadParams): FormData {
    const logicalName = params.filename ?? params.file_name;
    if (logicalName == null || logicalName === '') {
      throw new Error('upload requires filename or file_name');
    }
    const form = new FormData();
    form.append('file', params.file, logicalName);
    form.append('filename', logicalName);
    if (params.filepath !== undefined) {
      form.append('filepath', params.filepath);
    }
    if (params.overwrite !== undefined) {
      form.append('overwrite', String(params.overwrite));
    }
    this.appendUploadVisibility(form, params);
    return form;
  }

  private isErrorResult(
    result: StorageResult<ListStorageData>
  ): result is BolticErrorResponse {
    return (
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      (result as BolticErrorResponse).error !== undefined
    );
  }

  private isAclErrorResult(
    result: StorageResult<unknown>
  ): result is BolticErrorResponse {
    return (
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      (result as BolticErrorResponse).error !== undefined
    );
  }

  private buildObjectAccessSummary(
    filePath: string,
    row: StorageListItem | null,
    fallbackPublic: boolean
  ): ObjectAccessSummary {
    const isPublic = row != null ? Boolean(row.isPublic) : fallbackPublic;
    return {
      message: isPublic
        ? 'File has been made publicly accessible.'
        : "File's public access has been revoked, making it private.",
      name: row?.name ?? row?.fullPath ?? filePath,
      size: row?.size ?? null,
      updated: row?.updatedAt ?? null,
      public: isPublic,
    };
  }

  /**
   * Parses Hawkeye `POST /change-object-access` success JSON
   * `{ message, name, size, updated, public }`.
   */
  private parseChangeObjectAccessResponse(
    raw: unknown
  ): ObjectAccessSummary | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.name !== 'string' || typeof o.public !== 'boolean') {
      return null;
    }
    const message =
      typeof o.message === 'string' && o.message.length > 0
        ? o.message
        : o.public
          ? 'File has been made publicly accessible.'
          : "File's public access has been revoked, making it private.";
    const size =
      o.size === undefined || o.size === null ? null : String(o.size);
    const updated =
      o.updated === undefined || o.updated === null ? null : String(o.updated);
    return {
      message,
      name: o.name,
      size,
      updated,
      public: o.public,
    };
  }

  /** Resolves the list row for a full object path (same folder semantics as download size resolution). */
  private async findFileListItem(
    filePath: string,
    storageType?: string
  ): Promise<StorageListItem | null | BolticErrorResponse> {
    const lastSlash = filePath.lastIndexOf('/');
    const nameOnly = lastSlash === -1 ? filePath : filePath.slice(lastSlash + 1);
    const folderPrefix = lastSlash === -1 ? '' : filePath.slice(0, lastSlash);
    const basePath = folderPrefix ? `${folderPrefix}/` : '';
    const result = await this.list({ basePath, storageType });
    if (this.isErrorResult(result)) return result;
    const rows = result.files?.data ?? [];
    return (
      rows.find(
        (r) =>
          r.fullPath === filePath ||
          (!r.isDirectory && (r.name === nameOnly || r.fullPath === filePath))
      ) ?? null
    );
  }

  /** Keep only SDK list fields; flatten metadata to `size` / `updatedAt`. */
  private normalizeListItem(raw: Record<string, unknown>): StorageListItem {
    const meta = (raw.metadata as Record<string, unknown>) ?? {};
    let size: string | undefined;
    if (meta.size !== undefined && meta.size !== null) {
      size = String(meta.size);
    }
    const updatedRaw = meta.updated ?? meta.timeUpdated;
    let updatedAt: string | undefined;
    if (updatedRaw !== undefined && updatedRaw !== null) {
      updatedAt = String(updatedRaw);
    }

    const name = raw.name as string | undefined;
    const parentPath = raw.parentPath as string | undefined;
    const isDirectory = Boolean(raw.isDirectory);
    let fullPath: string | undefined;
    if (!isDirectory && name) {
      fullPath = parentPath ? `${parentPath}/${name}` : name;
    }

    const cdnRaw = raw.cdnUrl;
    const cdnUrl =
      cdnRaw === undefined || cdnRaw === null
        ? null
        : (cdnRaw as string);

    const item: StorageListItem = {
      name,
      path: raw.path as string | undefined,
      folderName: raw.folderName as string | undefined,
      parentPath,
      isDirectory,
      isPublic: raw.isPublic as boolean | undefined,
      cdnUrl,
      fullPath,
    };
    if (size !== undefined) item.size = size;
    if (updatedAt !== undefined) item.updatedAt = updatedAt;
    return item;
  }

  /** Map wire `shareable_link` to `temporary_sharable_link`. */
  private normalizeUploadData(raw: Record<string, unknown>): UploadData {
    const message = String(raw.message ?? '');
    const path = String(raw.path ?? '');
    const out: UploadData = { message, path };
    const link = raw.temporary_sharable_link ?? raw.shareable_link;
    if (link !== undefined && link !== null && String(link) !== '') {
      out.temporary_sharable_link = String(link);
    }
    if (raw.public_url !== undefined && raw.public_url !== null) {
      out.public_url = String(raw.public_url);
    }
    return out;
  }

  private normalizeListResponse(data: ListStorageData): ListStorageData {
    const payload = data.files;
    if (!payload?.data) return data;
    return {
      files: {
        ...payload,
        data: payload.data.map((item) =>
          this.normalizeListItem(item as Record<string, unknown>)
        ),
      },
    };
  }

  async list(
    params: ListStorageParams = {}
  ): Promise<StorageResult<ListStorageData>> {
    const endpoint = STORAGE_ENDPOINTS.list;
    const path = buildStorageEndpointPath(endpoint);
    const result = await this.requestStorage<ListStorageData>({
      url: this.url(path, this.listQuery(params)),
      method: endpoint.method,
      headers: this.buildHeaders(),
      timeout: this.config.timeout,
    });
    if (this.isErrorResult(result)) return result;
    return this.normalizeListResponse(result);
  }

  async createFolder(
    body: CreateFolderParams
  ): Promise<StorageResult<CreateFolderData>> {
    const endpoint = STORAGE_ENDPOINTS.directory;
    const path = buildStorageEndpointPath(endpoint);
    const q = this.storageTypeQuery(body.storageType);
    return this.requestStorage<CreateFolderData>({
      url: this.url(path, q),
      method: endpoint.method,
      headers: this.buildHeaders(),
      data: { folder_path: body.folder_path },
      timeout: this.config.timeout,
    });
  }

  async deleteFile(
    params: DeleteFileParams
  ): Promise<StorageResult<{ message: unknown }>> {
    const endpoint = STORAGE_ENDPOINTS.deleteFile;
    const path = buildStorageEndpointPath(endpoint);
    const q = this.storageTypeQuery(params.storageType);
    q.set('filename', params.filename);

    const data: Record<string, unknown> = {};
    if (params.filepath !== undefined) {
      data.filepath = params.filepath;
    }
    if (params.totalsize !== undefined) {
      data.totalsize = params.totalsize;
    }

    return this.requestStorage<{ message: unknown }>({
      url: this.url(path, q),
      method: endpoint.method,
      headers: this.buildHeaders(),
      data: Object.keys(data).length ? data : undefined,
      timeout: this.config.timeout,
    });
  }

  /**
   * `POST /change-object-access` — used by `makePublic` / `makePrivate`.
   * Preferring API body `{ message, name, size, updated, public }`; otherwise falls back to a parent list.
   */
  async setObjectAccess(
    body: ChangeObjectAccessParams
  ): Promise<StorageResult<ObjectAccessSummary>> {
    const endpoint = STORAGE_ENDPOINTS.objectAccess;
    const path = buildStorageEndpointPath(endpoint);
    const acl = await this.requestStorage<unknown>({
      url: this.url(path),
      method: endpoint.method,
      headers: this.buildHeaders(),
      data: {
        file_path: body.file_path,
        public: body.public,
      },
      timeout: this.config.timeout,
    });
    if (this.isAclErrorResult(acl)) return acl;

    const fromApi = this.parseChangeObjectAccessResponse(acl);
    if (fromApi !== null) {
      return fromApi;
    }

    const row = await this.findFileListItem(body.file_path);
    if (this.isAclErrorResult(row)) return row;

    return this.buildObjectAccessSummary(body.file_path, row, body.public);
  }

  async upload(params: UploadParams): Promise<StorageResult<UploadData>> {
    const endpoint = STORAGE_ENDPOINTS.upload;
    const path = buildStorageEndpointPath(endpoint);
    const q = this.storageTypeQuery(params.storageType);
    const headers = { ...this.buildHeaders() };
    delete headers['Content-Type'];

    const result = await this.requestStorage<Record<string, unknown>>({
      url: this.url(path, q),
      method: endpoint.method,
      headers,
      data: this.buildUploadForm(params),
      timeout: this.config.timeout,
    });
    if (this.isAclErrorResult(result)) return result;
    return this.normalizeUploadData(result);
  }

  private async resolveFileSizeBytes(
    fileName: string,
    storageType?: string
  ): Promise<number> {
    const lastSlash = fileName.lastIndexOf('/');
    const nameOnly =
      lastSlash === -1 ? fileName : fileName.slice(lastSlash + 1);
    const folderPrefix = lastSlash === -1 ? '' : fileName.slice(0, lastSlash);
    const basePath = folderPrefix ? `${folderPrefix}/` : '';
    const result = await this.list({ basePath, storageType });
    if (this.isErrorResult(result)) {
      throw new Error(
        result.error?.message ?? 'List failed while resolving file size'
      );
    }
    const rows = result.files?.data ?? [];
    const hit = rows.find(
      (r) => r.fullPath === fileName || (!r.isDirectory && r.name === nameOnly)
    );
    const s = hit?.size;
    if (s === undefined) {
      throw new Error(
        `Could not resolve size for "${fileName}". Pass sizeBytes (from list() item size).`
      );
    }
    return Number(s);
  }

  /**
   * Download file bytes via `POST /file-export` (range 0..size-1).
   */
  async downloadFile(
    params: DownloadFileParams
  ): Promise<StorageResult<DownloadFileData>> {
    try {
      const sizeBytes =
        params.sizeBytes !== undefined
          ? Number(params.sizeBytes)
          : await this.resolveFileSizeBytes(
              params.file_name,
              params.storageType
            );
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        throw new Error(
          'Invalid or unknown file size. Pass sizeBytes from list() item size.'
        );
      }
      const endpoint = STORAGE_ENDPOINTS.fileExport;
      const path = buildStorageEndpointPath(endpoint);
      const q = this.storageTypeQuery(params.storageType);
      const response = await this.httpAdapter.request<ArrayBuffer>({
        url: this.url(path, q),
        method: 'POST',
        headers: { ...this.buildHeaders(), Accept: '*/*' },
        data: {
          file_name: params.file_name,
          start_byte: 0,
          end_byte: sizeBytes - 1,
        },
        timeout: this.config.timeout,
        responseType: 'arraybuffer',
      });
      if (response.status < 200 || response.status >= 300) {
        const d = response.data as unknown;
        if (d && typeof d === 'object' && d !== null && 'error' in d) {
          return d as BolticErrorResponse;
        }
        return this.formatErrorResponse(
          new Error(`Download failed: HTTP ${response.status}`),
          ERR_PREFIX
        );
      }
      if (!(response.data instanceof ArrayBuffer)) {
        throw new Error('Expected binary response body');
      }
      const headers = response.headers as Record<string, string>;
      const ct =
        headers['content-type'] ?? headers['Content-Type'] ?? undefined;
      return {
        bytes: response.data,
        status: response.status,
        contentType: ct,
      };
    } catch (error: unknown) {
      return this.formatErrorResponse(error, ERR_PREFIX);
    }
  }
}
