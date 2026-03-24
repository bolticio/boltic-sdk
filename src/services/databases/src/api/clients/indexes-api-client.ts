import {
  AddIndexRequest,
  AddIndexResponse,
  DeleteIndexRequest,
  DeleteIndexResponse,
  ListIndexesQuery,
  ListIndexesResponse,
} from '../../types/api/index';
import {
  BaseApiClient,
  type BaseApiClientConfig,
  type BolticSuccessResponse,
  type BolticErrorResponse,
} from '../../../../common';
import { addDbIdToUrl } from '../../utils/database/db-context';
import { buildIndexEndpointPath, INDEX_ENDPOINTS } from '../endpoints/indexes';

export type IndexesApiClientConfig = BaseApiClientConfig;

export class IndexesApiClient extends BaseApiClient {
  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    super(apiKey, config);
  }

  async addIndex(
    tableId: string,
    request: AddIndexRequest,
    dbId?: string
  ): Promise<BolticSuccessResponse<AddIndexResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.create;
      let url = `${this.baseURL}${buildIndexEndpointPath(endpoint, { table_id: tableId })}`;
      url = addDbIdToUrl(url, dbId);
      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });
      return response.data as BolticSuccessResponse<AddIndexResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  async listIndexes(
    tableId: string,
    query: ListIndexesQuery,
    dbId?: string
  ): Promise<BolticSuccessResponse<ListIndexesResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.list;
      let url = `${this.baseURL}${buildIndexEndpointPath(endpoint, { table_id: tableId })}`;
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: query,
        timeout: this.config.timeout,
      });

      return response.data as BolticSuccessResponse<ListIndexesResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  async deleteIndex(
    tableId: string,
    request: DeleteIndexRequest,
    dbId?: string
  ): Promise<BolticSuccessResponse<DeleteIndexResponse> | BolticErrorResponse> {
    try {
      const endpoint = INDEX_ENDPOINTS.delete;
      let url = `${this.baseURL}${buildIndexEndpointPath(endpoint, { table_id: tableId })}`;
      url = addDbIdToUrl(url, dbId);

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      return response.data as BolticSuccessResponse<DeleteIndexResponse>;
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}
