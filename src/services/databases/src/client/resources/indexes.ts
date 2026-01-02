import { IndexesApiClient } from '../../api/clients/indexes-api-client';
import {
  AddIndexRequest,
  AddIndexResponse,
  DeleteIndexRequest,
  DeleteIndexResponse,
  ListIndexesQuery,
  ListIndexesResponse,
} from '../../types/api/index';
import { BaseClient } from '../core/base-client';
import { TableResource } from './table';

import {
  BolticErrorResponse,
  BolticSuccessResponse,
} from '../../types/common/responses';

export class IndexResource {
  private apiClient: IndexesApiClient;
  private tableResource: TableResource;
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;

    const config = client.getConfig();
    this.apiClient = new IndexesApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    this.tableResource = new TableResource(client);
  }

  private async resolveTableId(
    tableName: string,
    dbId?: string
  ): Promise<string> {
    const tableResult = await this.tableResource.findByName(tableName, dbId);
    if (!tableResult.data) throw new Error(`Table not found: ${tableName}`);
    return tableResult.data.id;
  }

  async addIndex(
    tableName: string,
    request: AddIndexRequest,
    dbId?: string
  ): Promise<BolticSuccessResponse<AddIndexResponse> | BolticErrorResponse> {
    try {
      const tableId = await this.resolveTableId(tableName, dbId);
      return await this.apiClient.addIndex(tableId, request, dbId);
    } catch (error) {
      return {
        error: {
          code: 'CLIENT_ERROR',
          message: (error as Error)?.message || 'Failed to add index',
          meta: ['IndexResource.addIndex'],
        },
      };
    }
  }

  async listIndexes(
    tableName: string,
    query: ListIndexesQuery,
    dbId?: string
  ): Promise<BolticSuccessResponse<ListIndexesResponse> | BolticErrorResponse> {
    try {
      const tableId = await this.resolveTableId(tableName, dbId);
      return await this.apiClient.listIndexes(tableId, query, dbId);
    } catch (error) {
      return {
        error: {
          code: 'CLIENT_ERROR',
          message: (error as Error)?.message || 'Failed to list indexes',
          meta: ['IndexResource.listIndexes'],
        },
      };
    }
  }

  async deleteIndex(
    tableName: string,
    indexName: string,
    dbId?: string
  ): Promise<BolticSuccessResponse<DeleteIndexResponse> | BolticErrorResponse> {
    try {
      const tableId = await this.resolveTableId(tableName, dbId);
      const request: DeleteIndexRequest = { index_name: indexName };
      return await this.apiClient.deleteIndex(tableId, request, dbId);
    } catch (error) {
      return {
        error: {
          code: 'CLIENT_ERROR',
          message: (error as Error)?.message || 'Failed to delete index',
          meta: ['IndexResource.deleteIndex'],
        },
      };
    }
  }
}
