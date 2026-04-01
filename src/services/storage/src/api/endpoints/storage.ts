import type { StorageApiEndpoint } from '../../types/storage';

export interface StorageEndpoints {
  list: StorageApiEndpoint;
  upload: StorageApiEndpoint;
  directory: StorageApiEndpoint;
  deleteFile: StorageApiEndpoint;
  objectAccess: StorageApiEndpoint;
  /** Range download (`POST /file-export`). */
  fileExport: StorageApiEndpoint;
}

export const STORAGE_ENDPOINTS: StorageEndpoints = {
  list: {
    path: '/storage/list',
    method: 'GET',
    authenticated: true,
  },
  upload: {
    path: '/storage/upload',
    method: 'POST',
    authenticated: true,
  },
  directory: {
    path: '/storage/directory',
    method: 'POST',
    authenticated: true,
  },
  deleteFile: {
    path: '/storage/file',
    method: 'DELETE',
    authenticated: true,
  },
  objectAccess: {
    path: '/storage/change-object-access',
    method: 'POST',
    authenticated: true,
  },
  fileExport: {
    path: '/storage/file-export',
    method: 'POST',
    authenticated: true,
  },
};

export function buildStorageEndpointPath(endpoint: StorageApiEndpoint): string {
  return endpoint.path;
}
