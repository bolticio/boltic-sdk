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
    super(client, '/v1/tables/databases');

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
    const result = await this.apiClient.createDatabase(request);
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    return result;
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

    // Always filter to show only active databases
    // Override any user-provided status filter with ACTIVE
    if (options?.filters) {
      // Remove any existing status filter and add ACTIVE filter
      const filtersWithoutStatus = options.filters.filter(
        (f) => f.field !== 'status'
      );
      request.filters = [
        ...filtersWithoutStatus,
        { field: 'status', operator: '=', values: ['ACTIVE'] },
      ];
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

    const result = await this.apiClient.listDatabases(
      request,
      queryParams,
      options
    );
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    // Normalize pagination structure if needed
    if ('pagination' in result && result.pagination) {
      const pagination = result.pagination;
      return {
        ...result,
        pagination: {
          total_count: pagination.total_count,
          total_pages:
            pagination.total_pages ??
            Math.ceil(pagination.total_count / pagination.per_page),
          current_page: pagination.current_page,
          per_page: pagination.per_page,
          type: 'page',
        },
      } as BolticListResponse<DatabaseRecord>;
    }
    return result as BolticListResponse<DatabaseRecord>;
  }

  /**
   * Get a specific database by internal name (slug)
   *
   * @param dbInternalName - Database internal name (slug)
   * @param options - Query options (e.g., fields to return)
   * @returns Promise with database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.findOne('my_database_slug');
   * ```
   */
  async findOne(
    dbInternalName: string,
    options?: { fields?: string[] }
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    // Get all databases and filter by internal name
    const result = await this.findAll({
      filters: [
        {
          field: 'db_internal_name',
          operator: '=',
          values: [dbInternalName],
        },
      ],
      fields: options?.fields,
      page: { page_no: 1, page_size: 1 },
    });

    if (isErrorResponse(result)) {
      return result;
    }

    if (result.data.length === 0) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: `Database with internal name '${dbInternalName}' not found`,
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
    const result = await this.findAll({
      filters: [{ field: 'is_default', operator: '=', values: [true] }],
      page: { page_no: 1, page_size: 1 },
    });

    if (isErrorResponse(result)) {
      return result;
    }

    if (result.data.length === 0) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Default database not found',
          meta: [],
        },
      };
    }

    return {
      data: result.data[0],
      message: 'Default database found',
    };
  }

  /**
   * Update a database
   * Only allows updating the display name (db_name)
   *
   * @param dbInternalName - Database internal name (slug)
   * @param request - Update request (only db_name is allowed)
   * @returns Promise with updated database or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.update('my_database_slug', {
   *   db_name: 'Updated Database Name'
   * });
   * ```
   */
  async update(
    dbInternalName: string,
    request: DatabaseUpdateRequest
  ): Promise<BolticSuccessResponse<DatabaseRecord> | BolticErrorResponse> {
    // Resolve database internal name to dbId
    const dbInfo = await this.findOne(dbInternalName);

    if (isErrorResponse(dbInfo)) {
      return {
        error: {
          code: 'DATABASE_NOT_FOUND',
          message: `Database with internal name '${dbInternalName}' not found`,
          meta: [],
        },
      };
    }

    const dbId = dbInfo.data.id;

    // Only allow updating db_name (display name)
    // Remove any other fields that might be present
    const updateRequest: DatabaseUpdateRequest = {
      db_name: request.db_name,
    };

    const result = await this.apiClient.updateDatabase(dbId, updateRequest);
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    return result;
  }

  /**
   * Delete a database (initiates async deletion job)
   *
   * @param dbInternalName - Database internal name (slug)
   * @returns Promise with job details or error
   *
   * @example
   * ```typescript
   * const result = await client.databases.delete('my_database_slug');
   * if (!result.error) {
   *   console.log('Deletion job started:', result.data.job_id);
   *   // Poll for status
   *   const status = await client.databases.pollDeleteStatus(result.data.job_id);
   * }
   * ```
   */
  async delete(
    dbInternalName: string
  ): Promise<
    BolticSuccessResponse<DatabaseDeletionJobResponse> | BolticErrorResponse
  > {
    // Resolve database internal name to dbId
    const dbInfo = await this.findOne(dbInternalName);

    if (isErrorResponse(dbInfo)) {
      return {
        error: {
          code: 'DATABASE_NOT_FOUND',
          message: `Database with internal name '${dbInternalName}' not found`,
          meta: [],
        },
      };
    }

    // Check if this is the default database - prevent deletion
    if (dbInfo.data.is_default) {
      return {
        error: {
          code: 'CANNOT_DELETE_DEFAULT',
          message: 'Cannot delete the default database',
          meta: [],
        },
      };
    }

    const dbId = dbInfo.data.id;
    const result = await this.apiClient.deleteDatabase(dbId);
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    return result;
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

    const result = await this.apiClient.listDatabaseJobs(request, options);
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    // Normalize pagination structure if needed
    if ('pagination' in result && result.pagination) {
      const pagination = result.pagination;
      const normalizedResult: BolticListResponse<DatabaseJobRecord> = {
        ...result,
        pagination: {
          total_count: pagination.total_count,
          total_pages:
            pagination.total_pages ??
            Math.ceil(pagination.total_count / pagination.per_page),
          current_page: pagination.current_page,
          per_page: pagination.per_page,
          type: 'page',
        },
      };
      return normalizedResult;
    }
    // If no pagination, ensure it's properly typed
    const normalizedResult: BolticListResponse<DatabaseJobRecord> = {
      ...result,
    };
    return normalizedResult;
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
    const result = await this.apiClient.pollDeleteStatus(jobId);
    if ('error' in result) {
      return {
        error: {
          code:
            typeof result.error.code === 'number'
              ? String(result.error.code)
              : result.error.code,
          message: result.error.message,
          meta: result.error.meta,
        },
      };
    }
    return result;
  }
}
