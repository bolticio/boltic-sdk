export interface AddIndexRequest {
  field_names: string[];
  method: 'btree' | 'hash' | 'spgist' | 'gin' | 'brin';
}

export interface AddIndexResponse {
  index_name: string;
  method: string;
  fields: string[];
  field_ids?: string[];
  created_at?: string;
  created_by?: string;
}

export interface ListIndexesQuery {
  page?: { page_no: number; page_size: number };
  filters?: Array<{ field: string; operator: string; values: unknown[] }>;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

export interface IndexListItem {
  schemaname?: string;
  relname?: string;
  indexrelname: string;
  method?: string;
  idx_scan?: number;
  idx_tup_read?: number;
  idx_tup_fetch?: number;
  field_ids?: string[];
  fields?: string[];
  created_at?: string;
  created_by?: string;
}

export interface ListIndexesResponse {
  items: IndexListItem[];
  page?: { page_no: number; page_size: number; total?: number };
}

export interface DeleteIndexRequest {
  index_name: string;
}

export interface DeleteIndexResponse {
  message?: string;
}
