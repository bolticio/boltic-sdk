import { ApiFilter } from '../../utils/filters/filter-mapper';

export interface RecordData {
  [fieldName: string]: unknown;
  fields?: string[];
}

export interface RecordCreateRequest {
  [fieldName: string]: unknown;
}

export interface RecordUpdateRequest {
  [fieldName: string]: unknown;
}

export interface QueryOperator<T = unknown> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string;
  $ilike?: string;
  $between?: [T, T];
  $null?: boolean;
  $exists?: boolean;
}

export interface WhereCondition {
  [fieldName: string]: unknown | QueryOperator;
}

export interface RecordQueryOptions {
  page?: {
    page_no: number;
    page_size: number;
  };
  filters?: ApiFilter[] | Record<string, unknown>[];
  sort?: Record<string, unknown>[];
  fields?: string[];
}

export interface RecordUpdateOptions {
  set: RecordData;
  filters: ApiFilter[] | Record<string, unknown>[];
  fields?: string[];
}

export interface RecordUpdateByIdOptions {
  id: string;
  set: RecordData;
  fields?: string[];
}

// Unified delete options interface that supports both record_ids and filters
export interface RecordDeleteOptions {
  // Either record_ids or filters must be provided, but not both
  record_ids?: string[];
  filters?: ApiFilter[] | Record<string, unknown>;
}

export interface RecordWithId extends RecordData {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecordListResponse {
  data: RecordWithId[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}

export interface RecordDeleteResponse {
  message: string;
}
