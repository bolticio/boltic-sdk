import {
  RecordData,
  RecordQueryOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
} from '../../types/common/responses';
import { RecordResource } from './record';

export interface RecordBuilderOptions {
  tableName: string;
  recordResource: RecordResource;
}

/**
 * Record Builder - provides a fluent interface for building record queries and operations
 */
export class RecordBuilder {
  private tableName: string;
  private recordResource: RecordResource;
  private queryOptions: RecordQueryOptions = {};
  private updateData: RecordData = {};

  constructor(options: RecordBuilderOptions) {
    this.tableName = options.tableName;
    this.recordResource = options.recordResource;
  }

  /**
   * Add filter conditions
   */
  where(conditions: Record<string, unknown>): RecordBuilder {
    if (!this.queryOptions.filters) {
      this.queryOptions.filters = [];
    }

    // Convert conditions to filter format
    Object.entries(conditions).forEach(([field, value]) => {
      this.queryOptions.filters!.push({
        field,
        operator: 'equals',
        values: [value],
      });
    });

    return this;
  }

  /**
   * Set sorting
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): RecordBuilder {
    if (!this.queryOptions.sort) {
      this.queryOptions.sort = [];
    }
    this.queryOptions.sort.push({ field, order: direction });
    return this;
  }

  /**
   * Set limit (using page)
   */
  limit(count: number): RecordBuilder {
    if (!this.queryOptions.page) {
      this.queryOptions.page = { page_no: 1, page_size: count };
    } else {
      this.queryOptions.page.page_size = count;
    }
    return this;
  }

  /**
   * Set offset (using page)
   */
  offset(count: number): RecordBuilder {
    if (!this.queryOptions.page) {
      this.queryOptions.page = {
        page_no: Math.floor(count / 50) + 1,
        page_size: 50,
      };
    } else {
      // Calculate page number based on offset and page size
      const pageSize = this.queryOptions.page.page_size || 50;
      this.queryOptions.page.page_no = Math.floor(count / pageSize) + 1;
    }
    return this;
  }

  /**
   * Set fields to select
   */
  select(fields: string[]): RecordBuilder {
    this.queryOptions.fields = fields;
    return this;
  }

  /**
   * Set data for update operations
   */
  set(data: RecordData): RecordBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Set pagination
   */
  page(pageNo: number, pageSize: number = 50): RecordBuilder {
    this.queryOptions.page = {
      page_no: pageNo,
      page_size: pageSize,
    };
    return this;
  }

  /**
   * Execute list operation (was findAll)
   */
  async list(): Promise<
    BolticListResponse<RecordWithId> | BolticErrorResponse
  > {
    return this.recordResource.list(this.tableName, this.queryOptions);
  }

  /**
   * Execute findAll operation (alias for list)
   */
  async findAll(): Promise<
    BolticListResponse<RecordWithId> | BolticErrorResponse
  > {
    return this.recordResource.list(this.tableName, this.queryOptions);
  }

  /**
   * Execute findOne operation by getting first result from list
   */
  async findOne(): Promise<
    BolticSuccessResponse<RecordWithId | null> | BolticErrorResponse
  > {
    // Use limit 1 to get just one record
    const queryOptions = { ...this.queryOptions, limit: 1 };
    const result = await this.recordResource.list(this.tableName, queryOptions);

    if ('error' in result) {
      return result as BolticErrorResponse;
    }

    // Return the first record or null in success format
    const record = result.data.length > 0 ? result.data[0] : null;
    return {
      data: record,
      message: record ? 'Record found' : 'No record found',
    };
  }

  /**
   * Build where conditions from filters for API consumption
   */
  private buildWhereConditions(): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (this.queryOptions.filters) {
      this.queryOptions.filters.forEach((filter) => {
        // Handle both ApiFilter and legacy Record<string, unknown> formats
        if ('field' in filter && 'values' in filter) {
          // ApiFilter format
          const apiFilter = filter as {
            field: string;
            operator: string;
            values: unknown[];
          };
          const fieldName = String(apiFilter.field);
          if (apiFilter.operator === 'equals') {
            where[fieldName] = apiFilter.values[0];
          } else if (apiFilter.operator === 'contains') {
            where[fieldName] = { $like: `%${String(apiFilter.values[0])}%` };
          } else {
            // For other operators, convert them appropriately
            where[fieldName] = apiFilter.values[0];
          }
        } else {
          // Legacy Record<string, unknown> format
          Object.assign(where, filter);
        }
      });
    }

    return where;
  }

  /**
   * Execute update operation - requires filters or record IDs
   */
  async update(): Promise<
    BolticListResponse<RecordWithId> | BolticErrorResponse
  > {
    if (!this.updateData) {
      return {
        data: [],
        error: {
          code: 'MISSING_UPDATE_DATA',
          message: 'Update data is required for update operation',
        },
      };
    }

    const updateOptions: RecordUpdateOptions = {
      set: this.updateData,
      filters: this.queryOptions.filters || [],
    };

    return this.recordResource.update(this.tableName, updateOptions);
  }

  /**
   * Execute update by ID operation
   */
  async updateById(
    id: string
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    return this.recordResource.updateById(this.tableName, id, this.updateData);
  }

  /**
   * Execute delete by single ID operation
   */
  async deleteById(
    id: string
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    return this.recordResource.deleteById(this.tableName, id);
  }

  /**
   * Execute delete by IDs operation
   */
  async deleteByIds(
    ids: string[]
  ): Promise<BolticSuccessResponse<{ message: string }> | BolticErrorResponse> {
    return this.recordResource.delete(this.tableName, { record_ids: ids });
  }

  /**
   * Execute delete operation using filters
   */
  async delete(): Promise<
    BolticSuccessResponse<{ message: string }> | BolticErrorResponse
  > {
    if (!this.queryOptions.filters || this.queryOptions.filters.length === 0) {
      return {
        data: {},
        error: {
          code: 'MISSING_DELETE_CONDITIONS',
          message:
            'Filter conditions are required for delete operation. Use where() to specify conditions.',
        },
      };
    }

    const deleteOptions = {
      filters: this.buildWhereConditions(),
    };

    return this.recordResource.delete(this.tableName, deleteOptions);
  }

  /**
   * Get the built query options (for debugging)
   */
  getQueryOptions(): RecordQueryOptions {
    return { ...this.queryOptions };
  }

  /**
   * Get the update data (for debugging)
   */
  getUpdateData(): RecordData {
    return { ...this.updateData };
  }

  /**
   * Execute insert operation
   */
  async insert(
    data: RecordData
  ): Promise<BolticSuccessResponse<RecordWithId> | BolticErrorResponse> {
    return this.recordResource.insert(this.tableName, data);
  }
}

/**
 * Create a new record builder
 */
export function createRecordBuilder(
  options: RecordBuilderOptions
): RecordBuilder {
  return new RecordBuilder(options);
}
