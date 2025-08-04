import {
  PaginationInfo,
  TableCreateRequest,
  TableQueryOptions,
  TableRecord,
  TableUpdateRequest,
} from '../../types/api/table';
import { ApiResponse } from '../../types/common/responses';
import { TableResource } from './table';

export class TableBuilder {
  private tableResource: TableResource;
  private queryOptions: TableQueryOptions = {};
  private updateData: TableUpdateRequest = {};

  constructor(tableResource: TableResource) {
    this.tableResource = tableResource;
  }

  /**
   * Add where conditions to the query
   */
  where(conditions: TableQueryOptions['where']): TableBuilder {
    this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
    return this;
  }

  /**
   * Add sorting to the query
   */
  sort(
    sortOptions: Array<{ field: keyof TableRecord; order: 'asc' | 'desc' }>
  ): TableBuilder {
    this.queryOptions.sort = [
      ...(this.queryOptions.sort || []),
      ...sortOptions,
    ];
    return this;
  }

  /**
   * Set pagination limit
   */
  limit(count: number): TableBuilder {
    this.queryOptions.limit = count;
    return this;
  }

  /**
   * Set pagination offset
   */
  offset(count: number): TableBuilder {
    this.queryOptions.offset = count;
    return this;
  }

  /**
   * Set update data
   */
  set(data: TableUpdateRequest): TableBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute create operation
   */
  async create(data: TableCreateRequest): Promise<ApiResponse<TableRecord>> {
    return this.tableResource.create(data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<
    ApiResponse<TableRecord[]> & { pagination?: PaginationInfo }
  > {
    return this.tableResource.findAll(this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<TableRecord | null>> {
    return this.tableResource.findOne(this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<TableRecord>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        'Update operation requires table name or ID in where clause'
      );
    }

    const identifier =
      this.queryOptions.where.name || this.queryOptions.where.id!;
    return this.tableResource.update(identifier, this.updateData);
  }

  /**
   * Execute rename operation
   */
  async rename(): Promise<ApiResponse<TableRecord>> {
    if (!this.queryOptions.where?.name) {
      throw new Error('Rename operation requires table name in where clause');
    }

    if (!this.updateData.name) {
      throw new Error('Rename operation requires new name in set data');
    }

    return this.tableResource.rename(
      this.queryOptions.where.name,
      this.updateData.name
    );
  }

  /**
   * Execute setAccess operation
   */
  async setAccess(): Promise<ApiResponse<TableRecord>> {
    if (!this.queryOptions.where?.name) {
      throw new Error(
        'setAccess operation requires table name in where clause'
      );
    }

    if (this.updateData.is_shared === undefined) {
      throw new Error('setAccess operation requires is_shared in set data');
    }

    return this.tableResource.setAccess({
      table_name: this.queryOptions.where.name,
      is_shared: this.updateData.is_shared,
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    if (!this.queryOptions.where?.name && !this.queryOptions.where?.id) {
      throw new Error(
        'Delete operation requires table name or ID in where clause'
      );
    }

    return this.tableResource.delete({
      where: {
        name: this.queryOptions.where.name,
        id: this.queryOptions.where.id,
      },
    });
  }

  /**
   * Reset builder to initial state
   */
  reset(): TableBuilder {
    this.queryOptions = {};
    this.updateData = {};
    return this;
  }
}
