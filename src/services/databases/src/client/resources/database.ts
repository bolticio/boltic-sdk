/**
 * Database Resource
 * Provides database management operations
 */

import { DatabasesApiClient } from '../../api/clients/databases-api-client';
import {
  DatabaseCreateRequest,
  DatabaseDeletionJobResponse,
  DatabaseDeletionStatusResponse,
  DatabaseJobListRequest,
  DatabaseJobQueryOptions,
  DatabaseJobRecord,
  DatabaseListQueryParams,
  DatabaseListRequest,
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseUpdateRequest,
} from '../../types/api/database';
import {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
  isErrorResponse,
} from '../../types/common/responses';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';

/**
 * Database Resource - handles database CRUD operations
 */
export class DatabaseResource extends BaseResource {
  private apiClient: DatabasesApiClient;

  constructor(client: BaseClient) {
    super(client);

    // Initialize the API client with the client's configuration
    this.apiClient = new DatabasesApiClient(client.getConfig().apiKey, {
      environment: client.getConfig().environment,
      region: client.getConfig().region,
      timeout: client.getConfig().timeout,
      debug: client.getConfig().debug,
    });
  }

  /**
   * Create a new database
   *
   * @param request - Database creation request
   * @returns Promise with created database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.create({
   *   db_name: 'My Database',
   *   db_internal_name: 'my-database',
   *   resource_id: 'boltic'
   * });
   * ```
   */
  async create(
    request: DatabaseCreateRequest
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    return await this.apiClient.createDatabase(request);
  }

  /**
   * List all databases with optional filtering and pagination
   * By default, only shows active databases
   *
   * @param options - Query options for listing databases
   * @returns Promise with list of databases or error
   *
   * @example
   * ```typescript
   * // List all active databases (default)
   * const result = await client.databases.findAll();
   *
   * // List with pagination
   * const result = await client.databases.findAll({
   *   page: { page_no: 1, page_size: 10 }
   * });
   *
   * // List with sorting
   * const result = await client.databases.findAll({
   *   sort: [{ field: 'db_name', direction: 'asc' }]
   * });
   * ```
   */
  async findAll(
    options?: DatabaseQueryOptions
  ): Promise<BolticListResponse<DatabaseRecord> | BolticErrorResponse> {
    const request: DatabaseListRequest = {};

    if (options?.page) {
      request.page = options.page;
    }

    if (options?.sort) {
      request.sort = options.sort;
    }

    // By default, filter to show only active databases
    // If filters are provided, check if status filter exists
    // If no status filter exists, add ACTIVE filter
    if (options?.filters) {
      const hasStatusFilter = options.filters.some((f) => f.field === 'status');
      if (hasStatusFilter) {
        // User explicitly provided status filter, use filters as-is
        request.filters = options.filters;
      } else {
        // No status filter provided, add ACTIVE filter
        request.filters = [
          ...options.filters,
          { field: 'status', operator: '=', values: ['ACTIVE'] },
        ];
      }
    } else {
      // Default filter: only show active databases
      request.filters = [
        { field: 'status', operator: '=', values: ['ACTIVE'] },
      ];
    }

    const queryParams: DatabaseListQueryParams = {};
    if (options?.connector_id) {
      queryParams.connector_id = options.connector_id;
    }
    if (options?.add_default_if_missing !== undefined) {
      queryParams.add_default_if_missing = options.add_default_if_missing
        ? 'true'
        : 'false';
    }

    return await this.apiClient.listDatabases(request, queryParams, options);
  }

  /**
   * Get a specific database by ID
   *
   * @param dbId - Database ID
   * @param options - Query options (e.g., fields to return)
   * @returns Promise with database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.findById('db-uuid');
   * ```
   */
  async findById(
    dbId: string,
    options?: { fields?: string[] }
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    // Get all databases and filter by ID
    const result = await this.findAll({
      filters: [{ field: 'id', operator: '=', values: [dbId] }],
      fields: options?.fields,
    });

    if (isErrorResponse(result)) {
      return result;
    }

    if (result.data.length === 0) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: `Database with ID ${dbId} not found`,
          meta: [],
        },
      };
    }

    return {
      data: result.data[0],
      message: 'Database found',
    };
  }

  /**
   * Find one database matching the given criteria
   *
   * @param options - Query options
   * @returns Promise with database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.findOne({
   *   filters: [{ field: 'db_name', operator: '=', values: ['My Database'] }]
   * });
   * ```
   */
  async findOne(
    options: DatabaseQueryOptions
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    const result = await this.findAll({
      ...options,
      page: { page_no: 1, page_size: 1 },
    });

    if (isErrorResponse(result)) {
      return result;
    }

    if (result.data.length === 0) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'No database found matching the criteria',
          meta: [],
        },
      };
    }

    return {
      data: result.data[0],
      message: 'Database found',
    };
  }

  /**
   * Get the default database
   *
   * @returns Promise with default database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.getDefault();
   * ```
   */
  async getDefault(): Promise<
    BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse
  > {
    return await this.findOne({
      filters: [{ field: 'is_default', operator: '=', values: [true] }],
    });
  }

  /**
   * Update a database
   * Only allows updating the display name (db_name)
   *
   * @param dbId - Database ID
   * @param request - Update request (only db_name is allowed)
   * @returns Promise with updated database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.update('db-uuid', {
   *   db_name: 'Updated Database Name'
   * });
   * ```
   */
  async update(
    dbId: string,
    request: DatabaseUpdateRequest
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    // Only allow updating db_name (display name)
    // Remove any other fields that might be present
    const updateRequest: DatabaseUpdateRequest = {
      db_name: request.db_name,
    };

    return await this.apiClient.updateDatabase(dbId, updateRequest);
  }

  /**
   * Delete a database (initiates async deletion job)
   *
   * @param dbId - Database ID
   * @returns Promise with job details or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.delete('db-uuid');
   * if (!result.error) {
   *   console.log('Deletion job started:', result.data.job_id);
   *   // Poll for status
   *   const status = await client.databases.pollDeleteStatus(result.data.job_id);
   * }
   * ```
   */
  async delete(
    dbId: string
  ): Promise<
    BolticSuccessResponse<DatabaseDeletionJobResponse> | BolticErrorResponse
  > {
    // Check if this is the default database - prevent deletion
    const dbInfo = await this.findById(dbId);
    if (isErrorResponse(dbInfo)) {
      return dbInfo;
    }

    if (dbInfo.data.is_default) {
      return {
        error: {
          code: 'CANNOT_DELETE_DEFAULT',
          message: 'Cannot delete the default database',
          meta: [],
        },
      };
    }

    return await this.apiClient.deleteDatabase(dbId);
  }

  /**
   * List database jobs (e.g., deletion jobs)
   *
   * @param options - Query options for listing jobs
   * @returns Promise with list of jobs or error
   *
   * @example
   * ```typescript
   * // List all jobs
   * const result = await client.databases.listJobs();
   *
   * // List jobs deleted by current user
   * const result = await client.databases.listJobs({
   *   deleted_by_me: true
   * });
   * ```
   */
  async listJobs(
    options?: DatabaseJobQueryOptions
  ): Promise<BolticListResponse<DatabaseJobRecord> | BolticErrorResponse> {
    const request: DatabaseJobListRequest = {};

    if (options?.deleted_by_me !== undefined) {
      request.deleted_by_me = options.deleted_by_me;
    }

    if (options?.page) {
      request.page = options.page;
    }

    if (options?.sort) {
      request.sort = options.sort;
    }

    if (options?.filters) {
      request.filters = options.filters;
    }

    return await this.apiClient.listDatabaseJobs(request, options);
  }

  /**
   * Poll the status of a database deletion job
   *
   * @param jobId - Job ID
   * @returns Promise with job status or error
   *
   * @example
   * ```typescript
   * const status = await client.databases.pollDeleteStatus('job-uuid');
   * if (!status.error) {
   *   console.log('Job status:', status.data.status);
   *   console.log('Message:', status.data.message);
   * }
   * ```
   */
  async pollDeleteStatus(
    jobId: string
  ): Promise<
    BolticSuccessResponse<DatabaseDeletionStatusResponse> | BolticErrorResponse
  > {
    return await this.apiClient.pollDeleteStatus(jobId);
  }
}
