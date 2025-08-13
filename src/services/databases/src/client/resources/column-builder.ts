import {
  ColumnDetails,
  ColumnQueryOptions,
  ColumnUpdateRequest,
} from '../../types/api/column';
import {
  BolticErrorResponse,
  BolticListResponse,
  BolticSuccessResponse,
} from '../../types/common/responses';
import { ColumnResource } from './column';

export interface ColumnBuilderOptions {
  tableName: string;
  columnResource: ColumnResource;
}

/**
 * Column Builder - provides a fluent interface for building column queries and operations
 */
export class ColumnBuilder {
  private tableName: string;
  private columnResource: ColumnResource;
  private queryOptions: ColumnQueryOptions = {};
  private updateData: ColumnUpdateRequest = {};

  constructor(options: ColumnBuilderOptions) {
    this.tableName = options.tableName;
    this.columnResource = options.columnResource;
  }

  /**
   * Add filter conditions
   */
  where(conditions: Partial<ColumnQueryOptions['where']>): ColumnBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Set sorting
   */
  orderBy(
    field: keyof ColumnDetails,
    direction: 'asc' | 'desc' = 'asc'
  ): ColumnBuilder {
    if (!this.queryOptions.sort) {
      this.queryOptions.sort = [];
    }
    this.queryOptions.sort.push({ field, order: direction });
    return this;
  }

  /**
   * Set limit
   */
  limit(count: number): ColumnBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set offset
   */
  offset(count: number): ColumnBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set fields to select
   */
  select(fields: Array<keyof ColumnDetails>): ColumnBuilder {
    this.queryOptions.fields = fields;
    return this;
  }

  /**
   * Set data for update operations
   */
  set(data: ColumnUpdateRequest): ColumnBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute list operation (was findAll)
   */
  async list(): Promise<
    BolticListResponse<ColumnDetails> | BolticErrorResponse
  > {
    return this.columnResource.list(this.tableName, this.queryOptions);
  }

  /**
   * Execute get operation (was findOne) - requires column name
   */
  async get(): Promise<
    BolticSuccessResponse<ColumnDetails> | BolticErrorResponse
  > {
    if (!this.queryOptions.where?.name) {
      return {
        data: {},
        error: {
          code: 'MISSING_COLUMN_NAME',
          message: 'Column name is required for get operation',
        },
      };
    }

    return this.columnResource.get(
      this.tableName,
      this.queryOptions.where.name as string
    );
  }

  /**
   * Execute update operation - requires column name
   */
  async update(): Promise<
    BolticSuccessResponse<ColumnDetails> | BolticErrorResponse
  > {
    if (!this.queryOptions.where?.name) {
      return {
        data: {},
        error: {
          code: 'MISSING_COLUMN_NAME',
          message: 'Column name is required for update operation',
        },
      };
    }

    return this.columnResource.update(
      this.tableName,
      this.queryOptions.where.name as string,
      this.updateData
    );
  }

  /**
   * Execute delete operation - requires column name
   */
  async delete(): Promise<
    | BolticSuccessResponse<{ success: boolean; message?: string }>
    | BolticErrorResponse
  > {
    if (!this.queryOptions.where?.name) {
      return {
        data: {},
        error: {
          code: 'MISSING_COLUMN_NAME',
          message: 'Column name is required for delete operation',
        },
      };
    }

    return this.columnResource.delete(
      this.tableName,
      this.queryOptions.where.name as string
    );
  }

  /**
   * Get the built query options (for debugging)
   */
  getQueryOptions(): ColumnQueryOptions {
    return { ...this.queryOptions };
  }

  /**
   * Get the update data (for debugging)
   */
  getUpdateData(): ColumnUpdateRequest {
    return { ...this.updateData };
  }
}

/**
 * Create a new column builder
 */
export function createColumnBuilder(
  options: ColumnBuilderOptions
): ColumnBuilder {
  return new ColumnBuilder(options);
}
