export type FieldType =
  | 'text'
  | 'long-text'
  | 'number'
  | 'currency'
  | 'checkbox'
  | 'dropdown'
  | 'email'
  | 'phone-number'
  | 'link'
  | 'json'
  | 'date-time'
  | 'vector'
  | 'halfvec'
  | 'sparsevec';

export type AlignmentType = 'left' | 'right' | 'center';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  is_visible?: boolean;
  is_readonly?: boolean;
  field_order?: number;
  description?: string;
  default_value?: unknown;

  // Type-specific properties
  alignment?: 'left' | 'center' | 'right';
  timezone?: string;
  date_format?: string;
  time_format?: string;
  decimals?: string;
  currency_format?: string;
  selection_source?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;

  vector_dimension?: number;
}

export interface TableCreateRequest {
  name: string;
  fields: FieldDefinition[];
  description?: string;
  is_ai_generated_schema?: boolean;
  is_template?: boolean;
}

export interface TableUpdateRequest {
  name?: string;
  description?: string;
  snapshot?: string;
  is_shared?: boolean;
}

export interface TableCreateResponse {
  id: string;
  message: string;
}

export interface TableRecord {
  id: string;
  name: string;
  account_id: string;
  internal_table_name: string; // Display name
  internal_db_name: string;
  db_id?: string; // uuid
  resource_id?: string;
  description?: string;
  type?: string;
  parent_table_id?: string;
  is_deleted: boolean;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  snapshot_url?: string;
  source?: 'boltic' | 'copilot';
}

export interface TableQueryOptions {
  where?: {
    id?: string;
    name?: string;
    db_id?: string;
    is_public?: boolean;
    created_by?: string;
    created_at?: {
      $gte?: string;
      $lte?: string;
      $between?: [string, string];
    };
  };
  sort?: Array<{
    field: keyof TableRecord;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface TableDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TableListResponse {
  tables: TableRecord[];
  pagination: PaginationInfo;
}

export interface TableAccessRequest {
  table_name: string;
  is_shared: boolean;
}
