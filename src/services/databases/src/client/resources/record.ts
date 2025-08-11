import { RecordsApiClient } from '../../api/clients/records-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import {
  RecordData,
  RecordDeleteByIdsOptions,
  RecordDeleteOptions,
  RecordDeleteResponse,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import { BaseClient } from '../core/base-client';
import { TableResource } from './table';

import { PaginationInfo } from '../../types/common/operations';
import { ApiResponse } from '../../types/common/responses';

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
  ): Promise<ApiResponse<RecordWithId>> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );

      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...data, table_id: tableId };
      const result = await this.apiClient.insertRecord(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INSERT_ERROR',
        details: error,
      };
    }
  }

  /**
   * Find all records
   */
  async findAll(
    tableName: string,
    options: RecordQueryOptions = {}
  ): Promise<ApiResponse<RecordWithId[]> & { pagination?: PaginationInfo }> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
          pagination: undefined,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.listRecords(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
          pagination: undefined,
        };
      }

      return {
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FIND_ALL_ERROR',
        details: error,
        pagination: undefined,
      };
    }
  }

  /**
   * Find a single record
   */
  async findOne(
    tableName: string,
    options: RecordQueryOptions
  ): Promise<ApiResponse<RecordWithId | null>> {
    if (!options.filters || options.filters.length === 0) {
      throw new Error('findOne requires at least one filter');
    }

    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      const queryOptions = {
        ...options,
        page: { page_no: 1, page_size: 1 },
        table_id: tableId,
      };

      const result = await this.apiClient.listRecords(queryOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      // Return the first record or null
      return {
        data: result.data && result.data.length > 0 ? result.data[0] : null,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FIND_ONE_ERROR',
        details: error,
      };
    }
  }

  /**
   * Update records by filters
   */
  async update(
    tableName: string,
    options: RecordUpdateOptions
  ): Promise<ApiResponse<RecordWithId[]>> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.updateRecords(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UPDATE_ERROR',
        details: error,
      };
    }
  }

  /**
   * Update a single record by ID
   */
  async updateById(
    tableName: string,
    options: RecordUpdateByIdOptions
  ): Promise<ApiResponse<RecordWithId>> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.updateRecordById(
        options.id,
        requestOptions
      );

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UPDATE_BY_ID_ERROR',
        details: error,
      };
    }
  }

  /**
   * Delete records by filters
   */
  async delete(
    tableName: string,
    options: RecordDeleteOptions
  ): Promise<ApiResponse<RecordDeleteResponse>> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.deleteRecords(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        };
      }

      return {
        data: { message: 'Records deleted successfully' },
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DELETE_ERROR',
        details: error,
      };
    }
  }

  /**
   * Delete multiple records by IDs
   */
  async deleteByIds(
    tableName: string,
    options: RecordDeleteByIdsOptions
  ): Promise<ApiResponse<RecordDeleteResponse>> {
    try {
      // Get table ID first
      const tableId = await TableResource.getTableId(
        this.tablesApiClient,
        tableName
      );
      if (!tableId) {
        return {
          error: `Table '${tableName}' not found`,
          code: 'TABLE_NOT_FOUND',
          details: null,
        };
      }

      // Include table_id in the request payload (same pattern as column APIs)
      const requestOptions = { ...options, table_id: tableId };
      const result = await this.apiClient.deleteRecordsByIds(requestOptions);

      if (result.error) {
        return {
          error: result.error.message,
          code: result.error.code,
        };
      }

      return {
        data: result.data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DELETE_BY_IDS_ERROR',
        details: error,
      };
    }
  }
}
