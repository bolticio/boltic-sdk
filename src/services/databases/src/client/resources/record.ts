import { RecordsApiClient } from '../../api/clients/records-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import {
  RecordData,
  RecordDeleteByIdsOptions,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import { BaseClient } from '../core/base-client';
import { TableResource } from './table';

import {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
  isErrorResponse,
} from '../../types/common/responses';

export class RecordResource {
  private apiClient: RecordsApiClient;
  private tablesApiClient: TablesApiClient;
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
    // Initialize the API client with the client's configuration
    this.apiClient = new RecordsApiClient(client.getConfig().apiKey, {
      environment: client.getConfig().environment,
      timeout: client.getConfig().timeout,
      debug: client.getConfig().debug,
    });

    // Initialize the tables API client for getting table IDs
    this.tablesApiClient = new TablesApiClient(client.getConfig().apiKey, {
      environment: client.getConfig().environment,
      timeout: client.getConfig().timeout,
      debug: client.getConfig().debug,
    });
  }

  /**
   * Insert a single record
   */
  async insert(
    tableName: string,
    data: RecordData
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestData = { ...data, table_id: tableId };
      const result = await this.apiClient.insertRecord(requestData);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'INSERT_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Get a single record by ID
   */
  async get(
    tableName: string,
    recordId: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      const result = await this.apiClient.getRecord(recordId, tableId);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'GET_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * List records with filtering and pagination
   */
  async list(
    tableName: string,
    options: RecordQueryOptions = {}
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.listRecords(requestOptions);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticListResponse<RecordWithId>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'LIST_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Update records by filters
   */
  async update(
    tableName: string,
    options: RecordUpdateOptions
  ): Promise<BolticListResponse<RecordWithId> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.updateRecords(requestOptions);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticListResponse<RecordWithId>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'UPDATE_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Update a single record by ID
   */
  async updateById(
    tableName: string,
    recordId: string,
    data: RecordData
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions: RecordUpdateByIdOptions & { table_id: string } = {
        id: recordId,
        set: data,
        table_id: tableId,
      };
      const result = await this.apiClient.updateRecordById(
        recordId,
        requestOptions
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<RecordWithId>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'UPDATE_BY_ID_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Delete records by filters
   */
  async delete(
    tableName: string,
    options: RecordDeleteOptions
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.deleteRecords(requestOptions);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'DELETE_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Delete records by IDs
   */
  async deleteByIds(
    tableName: string,
    options: RecordDeleteByIdsOptions
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      // Get table ID first
      const tableId = await this.getTableId(tableName);
      if (!tableId) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.deleteRecordsByIds(requestOptions);

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'DELETE_BY_IDS_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Helper method to get table ID by name
   */
  private async getTableId(tableName: string): Promise<string | null> {
    try {
      // Use the table resource to find the table by name
      const tableResource = new TableResource(this.client);
      const tableResult = await tableResource.findByName(tableName);

      if (tableResult.data) {
        return tableResult.data.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting table ID:', error);
      return null;
    }
  }
}
