import {
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
} from '../../types/api/column';
import { FieldDefinition } from '../../types/api/table';
import { PaginationInfo } from '../../types/common/operations';
import { ApiResponse } from '../../types/common/responses';
import { ColumnResource } from './column';

export class ColumnBuilder {
  private columnResource: ColumnResource;
  private tableName: string;
  private queryOptions: ColumnQueryOptions = {};
  private updateData: ColumnUpdateRequest = {};

  constructor(columnResource: ColumnResource, tableName: string) {
    this.columnResource = columnResource;
    this.tableName = tableName;
  }

  /**
   * Add where conditions to the query
   */
  where(conditions: ColumnQueryOptions['where']): ColumnBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Specify fields to select
   */
  fields(fieldList: Array<keyof ColumnDetails>): ColumnBuilder {
    this.queryOptions.fields = fieldList;
    return this;
  }

  /**
   * Add sorting to the query
   */
  sort(
    sortOptions: Array<{ field: keyof ColumnDetails; order: 'asc' | 'desc' }>
  ): ColumnBuilder {
    this.queryOptions.sort = [
      ...(this.queryOptions.sort || []),
      ...sortOptions,
    ];
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): ColumnBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): ColumnBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set update data
   */
  set(data: ColumnUpdateRequest): ColumnBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute create operation
   */
  async create(data: FieldDefinition): Promise<ApiResponse<ColumnRecord>> {
    return this.columnResource.create(this.tableName, data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<
    ApiResponse<ColumnDetails[]> & { pagination?: PaginationInfo }
  > {
    return this.columnResource.findAll(this.tableName, this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<ColumnDetails | null>> {
    return this.columnResource.findOne(this.tableName, this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<ColumnDetails>> {
    return this.columnResource.update(this.tableName, {
      set: this.updateData,
      where: this.queryOptions.where || {},
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        'Delete operation requires column name or ID in where clause'
      );
    }

    return this.columnResource.delete(this.tableName, {
      where: {
        name: this.queryOptions.where.name,
        id: this.queryOptions.where.id,
      },
    });
  }

  /**
   * Reset builder to initial state
   */
  reset(): ColumnBuilder {
    this.queryOptions = {};
    this.updateData = {};
    return this;
  }
}
