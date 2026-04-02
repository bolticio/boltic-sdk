import { StorageApiClient } from '../../api/clients/storage-api-client';
import { BaseResource, BaseClient } from '../../../../common';
import type {
  CreateFolderData,
  CreateFolderParams,
  DeleteFileParams,
  DownloadFileData,
  DownloadFileParams,
  ListStorageData,
  ListStorageParams,
  ObjectAccessSummary,
  StorageResponse,
  UploadData,
  UploadParams,
} from '../../types/storage';

type StorageResult<T> = StorageResponse<T>;

export class StorageResource extends BaseResource {
  private apiClient: StorageApiClient;

  constructor(client: BaseClient) {
    super(client, '/storage');
    const config = client.getConfig();
    this.apiClient = new StorageApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
      headers: config.headers,
    });
  }

  async list(
    params: ListStorageParams = {}
  ): Promise<StorageResult<ListStorageData>> {
    return this.apiClient.list(params);
  }

  /** Direct upload — `POST /upload` (multipart); server persists the object. */
  async upload(params: UploadParams): Promise<StorageResult<UploadData>> {
    return this.apiClient.upload(params);
  }

  async createFolder(
    params: CreateFolderParams
  ): Promise<StorageResult<CreateFolderData>> {
    return this.apiClient.createFolder(params);
  }

  async deleteFile(
    params: DeleteFileParams
  ): Promise<StorageResult<{ message: unknown }>> {
    return this.apiClient.deleteFile(params);
  }

  async makePublic(
    filePath: string
  ): Promise<StorageResult<ObjectAccessSummary>> {
    return this.apiClient.setObjectAccess({
      file_path: filePath,
      public: true,
    });
  }

  async makePrivate(
    filePath: string
  ): Promise<StorageResult<ObjectAccessSummary>> {
    return this.apiClient.setObjectAccess({
      file_path: filePath,
      public: false,
    });
  }

  /** Download file bytes via `POST /file-export` (full file). */
  async downloadFile(
    params: DownloadFileParams
  ): Promise<StorageResult<DownloadFileData>> {
    return this.apiClient.downloadFile(params);
  }
}
