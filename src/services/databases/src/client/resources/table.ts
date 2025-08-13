import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ApiError, ValidationError } from '../../errors';
import {
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
    data: TableCreateRequest
  ): Promise<BolticSuccessResponse<TableCreateResponse>> {
    try {
      const result = await this.tablesApiClient.createTable(data);

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
   * Find all tables with optional filtering
   */
  async findAll(
    options: TableQueryOptions = {}
  ): Promise<ApiResponse<TableRecord[]>> {
    try {
      const result = await this.tablesApiClient.listTables(options);

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
    options: TableQueryOptions
  ): Promise<BolticSuccessResponse<TableRecord | null>> {
    try {
      if (!options.where?.id && !options.where?.name) {
        throw new ValidationError(
          'Either id or name must be provided in where clause'
        );
      }

      if (options.where?.id) {
        // Find by ID
        const result = await this.tablesApiClient.getTable(
          options.where.id as string
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
        // Find by name
        const listResult = await this.tablesApiClient.listTables({
          where: { name: options.where!.name },
          limit: 1,
        });

        if (isErrorResponse(listResult)) {
          throw new ApiError(
            listResult.error.message || 'Find table by name failed',
            400,
            listResult.error
          );
        }

        const table = isListResponse(listResult) ? listResult.data[0] : null;
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
    name: string
  ): Promise<BolticSuccessResponse<TableRecord | null>> {
    return this.findOne({ where: { name } });
  }

  /**
   * Find a single table by ID
   */
  async findById(
    id: string
  ): Promise<BolticSuccessResponse<TableRecord | null>> {
    return this.findOne({ where: { id } });
  }

  /**
   * Update a table by ID
   */
  async update(
    id: string,
    data: TableUpdateRequest
  ): Promise<BolticSuccessResponse<TableRecord>> {
    try {
      const result = await this.tablesApiClient.updateTable(id, data);

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
   * Update a table by name
   */
  async updateByName(
    name: string,
    data: TableUpdateRequest
  ): Promise<BolticSuccessResponse<TableRecord>> {
    try {
      // First find the table to get its ID
      const tableResult = await this.findByName(name);

      if (!tableResult.data) {
        throw new ApiError(`Table '${name}' not found`, 404);
      }

      return await this.update(tableResult.data.id, data);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Delete a table by ID
   */
  async delete(
    id: string
  ): Promise<BolticSuccessResponse<{ message: string }>> {
    try {
      const result = await this.tablesApiClient.deleteTable(id);

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
   * Delete a table by name
   */
  async deleteByName(
    name: string
  ): Promise<BolticSuccessResponse<{ message: string }>> {
    try {
      // First find the table to get its ID
      const tableResult = await this.findByName(name);

      if (!tableResult.data) {
        throw new ApiError(`Table '${name}' not found`, 404);
      }

      return await this.delete(tableResult.data.id);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Generate AI-powered table schema
   */
  async generateSchema(prompt: string): Promise<
    BolticSuccessResponse<{
      fields: Array<{
        name: string;
        type: string;
        description?: string;
      }>;
      name?: string;
      description?: string;
    }>
  > {
    try {
      const result = await this.tablesApiClient.generateSchema(prompt);

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'Generate schema failed',
          400,
          result.error
        );
      }

      return result as BolticSuccessResponse<{
        fields: Array<{
          name: string;
          type: string;
          description?: string;
        }>;
        name?: string;
        description?: string;
      }>;
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new ApiError(this.formatError(error), 500);
    }
  }

  /**
   * Get available currencies
   */
  async getCurrencies(): Promise<
    BolticSuccessResponse<
      Array<{
        code: string;
        name: string;
        symbol: string;
      }>
    >
  > {
    try {
      const result = await this.tablesApiClient.getCurrencies();

      if (isErrorResponse(result)) {
        throw new ApiError(
          result.error.message || 'Get currencies failed',
          400,
          result.error
        );
      }

      return result as BolticSuccessResponse<
        Array<{
          code: string;
          name: string;
          symbol: string;
        }>
      >;
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
