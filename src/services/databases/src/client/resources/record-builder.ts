import {
  RecordData,
  RecordDeleteResponse,
  RecordQueryOptions,
  RecordWithId,
} from '../../types/api/record';
import { PaginationInfo } from '../../types/common/operations';
import { ApiResponse } from '../../types/common/responses';
import { RecordResource } from './record';

export class RecordBuilder {
  private recordResource: RecordResource;
  private tableName: string;
  private queryOptions: RecordQueryOptions = {
    page: { page_no: 1, page_size: 100 },
    filters: [],
    sort: [],
  };
  private updateData: Partial<RecordData> = {};

  constructor(recordResource: RecordResource, tableName: string) {
    this.recordResource = recordResource;
    this.tableName = tableName;
  }

  /**
   * Add filter conditions to the query
   */
  where(
    fieldOrFilters: string | Record<string, unknown>[],
    operator?: string | unknown,
    value?: unknown
  ): RecordBuilder {
    if (Array.isArray(fieldOrFilters)) {
      // If first parameter is an array, treat as filters
      this.queryOptions.filters!.push(...fieldOrFilters);
    } else if (typeof fieldOrFilters === 'string' && operator !== undefined) {
      // If first parameter is a string, treat as field name with operator and value
      const filter: Record<string, unknown> = {};
      if (typeof operator === 'string') {
        filter[fieldOrFilters] = { [operator]: value };
      } else {
        filter[fieldOrFilters] = operator;
      }
      this.queryOptions.filters!.push(filter);
    }
    return this;
  }

  /**
   * Specify fields to select
   */
  select(fields: string[]): RecordBuilder {
    // Note: Field selection is handled by the API server
    // This method is kept for API compatibility but doesn't affect the request
    // Store fields for potential future use
    this.queryOptions.fields = fields;
    return this;
  }

  /**
   * Add sorting to the query
   */
  orderBy(field: string, order: 'asc' | 'desc' = 'asc'): RecordBuilder {
    this.queryOptions.sort!.push({ field, order });
    return this;
  }

  /**
   * Set pagination page size
   */
  limit(count: number): RecordBuilder {
    this.queryOptions.page!.page_size = count;
    return this;
  }

  /**
   * Set pagination page number
   */
  offset(count: number): RecordBuilder {
    this.queryOptions.page!.page_no = count;
    return this;
  }

  /**
   * Include total count in results
   */
  withCount(): RecordBuilder {
    // Note: Total count is always included in the response
    // This method is kept for API compatibility but doesn't affect the request
    return this;
  }

  /**
   * Set update data
   */
  set(data: Partial<RecordData>): RecordBuilder {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Execute insert operation
   */
  async insert(data: RecordData): Promise<ApiResponse<RecordWithId>> {
    return this.recordResource.insert(this.tableName, data);
  }

  /**
   * Execute findAll operation
   */
  async findAll(): Promise<
    ApiResponse<RecordWithId[]> & { pagination?: PaginationInfo }
  > {
    return this.recordResource.findAll(this.tableName, this.queryOptions);
  }

  /**
   * Execute findOne operation
   */
  async findOne(): Promise<ApiResponse<RecordWithId | null>> {
    return this.recordResource.findOne(this.tableName, this.queryOptions);
  }

  /**
   * Execute update operation
   */
  async update(): Promise<ApiResponse<RecordWithId[]>> {
    if (!this.queryOptions.filters || this.queryOptions.filters.length === 0) {
      throw new Error('Update operation requires filter conditions');
    }

    return this.recordResource.update(this.tableName, {
      set: this.updateData,
      filters: this.queryOptions.filters,
    });
  }

  /**
   * Execute update by ID operation
   */
  async updateById(id: string): Promise<ApiResponse<RecordWithId>> {
    return this.recordResource.updateById(this.tableName, {
      id,
      set: this.updateData,
    });
  }

  /**
   * Execute delete operation
   */
  async delete(): Promise<ApiResponse<RecordDeleteResponse>> {
    if (!this.queryOptions.filters || this.queryOptions.filters.length === 0) {
      throw new Error('Delete operation requires filter conditions');
    }

    return this.recordResource.delete(this.tableName, {
      filters: this.queryOptions.filters,
    });
  }

  /**
   * Execute delete by IDs operation
   */
  async deleteByIds(
    recordIds: string[]
  ): Promise<ApiResponse<RecordDeleteResponse>> {
    return this.recordResource.deleteByIds(this.tableName, {
      record_ids: recordIds,
    });
  }
}
