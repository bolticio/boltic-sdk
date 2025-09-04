import { RecordsApiClient } from '../../api/clients/records-api-client';
import { TablesApiClient } from '../../api/clients/tables-api-client';
import {
  RecordBulkInsertOptions,
  RecordBulkInsertResponse,
  RecordData,
  RecordDeleteOptions,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import { BaseClient } from '../core/base-client';
import { ColumnResource } from './column';
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
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record insertion
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot insert record into snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      // Get table columns to determine which fields might be missing
      const completeDataResult = await this.ensureCompleteRecordData(
        tableName,
        data
      );
      if ('error' in completeDataResult && completeDataResult.error) {
        return completeDataResult as BolticErrorResponse;
      }

      // Include table_id in the request payload
      const requestData = {
        ...(completeDataResult as RecordData),
        table_id: tableInfo.id,
      };
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
   * Insert multiple records in bulk
   */
  async insertMany(
    tableName: string,
    records: RecordData[],
    options: RecordBulkInsertOptions = { validation: true }
  ): Promise<RecordBulkInsertResponse | BolticErrorResponse> {
    try {
      // Validate input
      if (!records || !Array.isArray(records) || records.length === 0) {
        return {
          data: {},
          error: {
            code: 'INVALID_INPUT',
            message: 'Records array is required and cannot be empty',
          },
        };
      }

      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record insertion
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot insert records into snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      // Send records as-is to API with validation parameter
      const result = await this.apiClient.insertManyRecords(
        records,
        tableInfo.id,
        options
      );

      if (isErrorResponse(result)) {
        return result;
      }

      return result as RecordBulkInsertResponse;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'INSERT_MANY_ERROR',
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
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      const result = await this.apiClient.getRecord(recordId, tableInfo.id);

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
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableInfo.id };
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
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record updates
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot update records in snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableInfo.id };
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
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record updates
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot update record in snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions: RecordUpdateByIdOptions & { table_id: string } = {
        id: recordId,
        set: data,
        table_id: tableInfo.id,
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
   * Unified delete method that supports both record IDs and filters
   */
  async delete(
    tableName: string,
    options: RecordDeleteOptions
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record deletion
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot delete records from snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      // Include table_id in the request payload
      const requestOptions = { ...options, table_id: tableInfo.id };
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
   * Delete a single record by ID
   */
  async deleteById(
    tableName: string,
    recordId: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    try {
      // Get table information first
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        return {
          data: {},
          error: {
            code: 'TABLE_NOT_FOUND',
            message: `Table '${tableName}' not found`,
          },
        };
      }

      // Check if the table is a snapshot and prevent record deletion
      if (tableInfo.snapshot_url) {
        return {
          data: {},
          error: {
            code: 'SNAPSHOT_PROTECTION',
            message: `Cannot delete record from snapshot table '${tableName}'. Snapshots are read-only and cannot be modified.`,
          },
        };
      }

      const result = await this.apiClient.deleteRecordById(recordId, {
        table_id: tableInfo.id,
      });

      if (isErrorResponse(result)) {
        return result;
      }

      return result as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'DELETE_BY_ID_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Helper method to get table information by name
   */
  private async getTableInfo(
    tableName: string
  ): Promise<{ id: string; snapshot_url?: string } | null> {
    try {
      // Use the table resource to find the table by name
      const tableResource = new TableResource(this.client);
      const tableResult = await tableResource.findByName(tableName);

      if (tableResult.data) {
        return {
          id: tableResult.data.id,
          snapshot_url: tableResult.data.snapshot_url,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting table info:', error);
      return null;
    }
  }

  /**
   * Helper method to ensure all required fields for a record are present,
   * filling missing ones with null.
   */
  private async ensureCompleteRecordData(
    tableName: string,
    data: RecordData
  ): Promise<RecordData | BolticErrorResponse> {
    try {
      const columnResource = new ColumnResource(this.client);
      const columnsResult = await columnResource.findAll(tableName);

      if (isErrorResponse(columnsResult)) {
        return columnsResult;
      }

      // Get the actual columns array from the response
      const columns = Array.isArray(columnsResult.data)
        ? columnsResult.data
        : [];

      // Create complete data object with all table columns
      const completeData: RecordData = { ...data };

      // Set missing fields to null (only for columns that are not system-generated)
      for (const column of columns) {
        // Skip system columns that are auto-generated
        if (
          column.name === 'id' ||
          column.name === 'created_at' ||
          column.name === 'updated_at'
        ) {
          continue;
        }

        // If field is missing from provided data, set it to null
        if (!(column.name in data)) {
          completeData[column.name] = null;
        }
      }

      return completeData;
    } catch (error) {
      return {
        data: {},
        error: {
          code: 'COMPLETE_DATA_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }
}
