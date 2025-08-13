export interface RecordData {
  [fieldName: string]: unknown;
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
  filters?: Record<string, unknown>[];
  sort?: Record<string, unknown>[];
  fields?: string[];
}

export interface RecordUpdateOptions {
  set: RecordData;
  filters: Record<string, unknown>[];
}

export interface RecordUpdateByIdOptions {
  id: string;
  set: RecordData;
}

export interface RecordDeleteByIdsOptions {
  record_ids: string[];
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
