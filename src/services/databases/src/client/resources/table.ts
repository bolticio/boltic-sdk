import { TablesApiClient, TableListOptions } from '../../api/clients/tables-api-client';
import { ApiError, ValidationError } from '../../errors';
import {
  FieldDefinition,
  TableCreateRequest,
  TableCreateResponse,
  TableQueryOptions,
  TableRecord,
  TableUpdateRequest,
} from '../../types/api/table';
import {
  ApiResponse,
  BolticSuccessResponse,
  isErrorResponse,
  isListResponse,
} from '../../types/common/responses';
import { BaseClient } from '../core/base-client';
import { BaseResource } from '../core/base-resource';

export class TableResource extends BaseResource {
  private tablesApiClient: TablesApiClient;

  constructor(client: BaseClient) {
    super(client, '/v1/tables');

    // Initialize the API client
    const config = client.getConfig();
    this.tablesApiClient = new TablesApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });
  }

  /**
   * Create a new table
   */
  async create(
    data: TableCreateRequest,
    dbId?: string
  ): Promise<BolticSuccessResponse<TableCreateResponse>> {
    try {
      // Process fields with defaults if any are provided
      const processedData = { ...data };
      if (data.fields && data.fields.length > 0) {
        processedData.fields = await this.processFieldsDefaults(data.fields);
      }

      const result = await this.tablesApiClient.createTable(
        processedData,
        dbId ? { db_id: dbId } : {}
      );

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'Create table failed',
          400,
          result.error
        );
      }

      return result as BolticSuccessResponse<TableCreateResponse>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Process fields with defaults for table creation
   */
  private async processFieldsDefaults(
    fields: FieldDefinition[]
  ): Promise<FieldDefinition[]> {
    const processedFields: FieldDefinition[] = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const processedField: FieldDefinition = { ...field };

      // Set default values for optional fields if not provided
      if (processedField.is_primary_key === undefined) {
        processedField.is_primary_key = false;
      }
      if (processedField.is_unique === undefined) {
        processedField.is_unique = false;
      }
      if (processedField.is_nullable === undefined) {
        processedField.is_nullable = true;
      }
      if (processedField.is_indexed === undefined) {
        processedField.is_indexed = false;
      }

      // Auto-generate field_order if not provided (sequential for table creation)
      if (processedField.field_order === undefined) {
        processedField.field_order = i + 1;
      }

      // Validate field_order is within acceptable range
      if (
        processedField.field_order <= 0 ||
        processedField.field_order >= 2147483647
      ) {
        throw new Error(
          'Field order must be a number greater than 0 and less than 2147483647'
        );
      }

      processedFields.push(processedField);
    }

    return processedFields;
  }

  /**
   * Transform SDK TableQueryOptions to API request format
   */
  private transformTableQueryToApiRequest(options: TableQueryOptions): {
    page: { page_no: number; page_size: number };
    filters: Array<{ field: string; operator: string; values: unknown[] }>;
    sort: Array<{ field: string; direction: string }>;
  } {
    const apiRequest: {
      page: { page_no: number; page_size: number };
      filters: Array<{ field: string; operator: string; values: unknown[] }>;
      sort: Array<{ field: string; direction: string }>;
    } = {
      page: {
        page_no: 1,
        page_size: options.limit || 100,
      },
      filters: [],
      sort: [],
    };

    // Handle pagination
    if (options.offset && options.limit) {
      const pageNo = Math.floor(options.offset / options.limit) + 1;
      apiRequest.page.page_no = pageNo;
    }

    // Transform where clause to filters
    if (options.where) {
      Object.entries(options.where).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          apiRequest.filters.push({
            field,
            operator: '=',
            values: [value],
          });
        }
      });
    }

    // Transform sort
    if (options.sort) {
      apiRequest.sort = options.sort.map((s) => ({
        field: s.field,
        direction: s.order,
      }));
    }

    return apiRequest;
  }

  /**
   * Find all tables with optional filtering
   */
  async findAll(
    options: TableQueryOptions = {},
    dbId?: string
  ): Promise<ApiResponse<TableRecord>> {
    try {
      // Transform SDK format to API format
      const apiRequest = this.transformTableQueryToApiRequest(options);

      // Create request payload matching API format (not TableListOptions SDK format)
      const requestPayload = {
        page: apiRequest.page,
        filters: apiRequest.filters,
        sort: apiRequest.sort,
        ...(dbId && { db_id: dbId }),
        ...(options.fields && { fields: options.fields }),
      } as unknown as TableListOptions;

      const result = await this.tablesApiClient.listTables(requestPayload);

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'List tables failed',
          400,
          result.error
        );
      }

      return result;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Find a single table by ID or name
   */
  async findOne(
    options: TableQueryOptions,
    dbId?: string
  ): Promise<
    | BolticSuccessResponse<TableRecord | null>
    | import('../../types/common/responses').BolticErrorResponse
  > {
    try {
      if (!options.where?.id && !options.where?.name) {
        throw new ValidationError(
          'Either id or name must be provided in where clause'
        );
      }

      if (options.where?.id) {
        // Find by ID
        const result = await this.tablesApiClient.getTable(
          options.where.id as string,
          dbId ? { db_id: dbId } : {}
        );

        if (isErrorResponse(result)) {
          if (result.error.code === 'TABLE_NOT_FOUND') {
            return {
              data: null,
              message: 'Table not found',
            };
          }
          throw new ApiError(
            result.error.message || 'Get table failed',
            400,
            result.error
          );
        }

        return result as BolticSuccessResponse<TableRecord>;
      } else {
        // Find by name - transform to API format
        const apiRequest = {
          page: { page_no: 1, page_size: 1 },
          filters: [
            {
              field: 'name',
              operator: '=',
              values: [options.where!.name],
            },
          ],
          sort: [],
        };

        const requestPayload = {
          page: apiRequest.page,
          filters: apiRequest.filters,
          sort: apiRequest.sort,
          ...(dbId && { db_id: dbId }),
        } as unknown as TableListOptions;

        const listResult = await this.tablesApiClient.listTables(requestPayload);

        if (isErrorResponse(listResult)) {
          throw new ApiError(
            listResult.error.message || 'Find table by name failed',
            400,
            listResult.error
          );
        }

        const table = isListResponse(listResult)
          ? (listResult.data[0] as TableRecord)
          : null;
        return {
          data: table || null,
          message: table ? 'Table found' : 'Table not found',
        };
      }
    } catch (error) {
      throw error instanceof ApiError || error instanceof ValidationError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Find a single table by name
   */
  async findByName(
    name: string,
    dbId?: string
  ): Promise<
    | BolticSuccessResponse<TableRecord | null>
    | import('../../types/common/responses').BolticErrorResponse
  > {
    return this.findOne({ where: { name } }, dbId);
  }

  /**
   * Find a single table by ID
   */
  async findById(
    id: string,
    dbId?: string
  ): Promise<
    | BolticSuccessResponse<TableRecord | null>
    | import('../../types/common/responses').BolticErrorResponse
  > {
    return this.findOne({ where: { id } }, dbId);
  }

  /**
   * Update a table by name
   */
  async update(
    name: string,
    data: TableUpdateRequest,
    dbId?: string
  ): Promise<
    | BolticSuccessResponse<TableRecord>
    | import('../../types/common/responses').BolticErrorResponse
  > {
    try {
      // First find the table to get its ID
      const tableResult = await this.findByName(name, dbId);

      if (!tableResult.data) {
        throw new ApiError(`Table '${name}' not found`, 404);
      }

      // Check if the table is a snapshot and prevent updates
      if (tableResult.data.snapshot_url) {
        throw new ApiError(
          `Cannot update snapshot table '${name}'. Snapshots are read-only and cannot be modified.`,
          400
        );
      }

      const result = await this.tablesApiClient.updateTable(
        tableResult.data.id,
        dbId ? { ...data, db_id: dbId } : data
      );

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'Update table failed',
          400,
          result.error
        );
      }

      return result as BolticSuccessResponse<TableRecord>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Delete a table by name
   */
  async delete(
    name: string,
    dbId?: string
  ): Promise<
    | BolticSuccessResponse<{ message: string }>
    | import('../../types/common/responses').BolticErrorResponse
  > {
    try {
      // First find the table to get its ID
      const tableResult = await this.findByName(name, dbId);

      if (!tableResult.data) {
        throw new ApiError(`Table '${name}' not found`, 404);
      }

      // Check if the table is a snapshot and prevent deletion
      if (tableResult.data.snapshot_url) {
        throw new ApiError(
          `Cannot delete snapshot table '${name}'. Snapshots are read-only and cannot be deleted.`,
          400
        );
      }

      const result = await this.tablesApiClient.deleteTable(
        tableResult.data.id,
        dbId ? { db_id: dbId } : {}
      );

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'Delete table failed',
          400,
          result.error
        );
      }

      return result as BolticSuccessResponse<{ message: string }>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Rename a table
   */
  async rename(
    oldName: string,
    newName: string,
    dbId?: string
  ): Promise<BolticSuccessResponse<TableRecord>> {
    try {
      const result = await this.update(
        oldName,
        {
          name: newName,
        },
        dbId
      );
      // update throws on error, so cast to success
      return result as BolticSuccessResponse<TableRecord>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Set table access permissions
   */
  async setAccess(
    request: {
      table_name: string;
      is_shared: boolean;
    },
    dbId?: string
  ): Promise<BolticSuccessResponse<TableRecord>> {
    try {
      // Update the table with the new access settings
      const result = await this.update(
        request.table_name,
        {
          is_shared: request.is_shared,
        },
        dbId
      );
      // update throws on error, so cast to success
      return result as BolticSuccessResponse<TableRecord>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  // Helper method to format generic errors
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }
}
