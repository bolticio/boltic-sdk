import { QueryOptions } from '../common/responses';

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

export interface FieldDefinition {
  name: string;
  type: FieldType;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  is_unique?: boolean;
  is_visible?: boolean;
  is_readonly?: boolean;
  field_order?: number;
  alignment?: string | null;
  timezone?: string | null;
  date_format?: string | null;
  time_format?: string | null;
  decimals?: string | null;
  currency_format?: string | null;
  selection_source?: string | null;
  selectable_items?: string[] | null;
  multiple_selections?: boolean;
  phone_format?: string | null;
  button_type?: string | null;
  button_label?: string | null;
  button_additional_labels?: string[] | null;
  button_state?: string | null;
  disable_on_click?: boolean | null;
  vector_dimension?: number | null;
  default_value?: unknown;
}

export interface Table {
  id: string;
  name: string;
  description?: string;
  database_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  record_count: number;
  schema?: FieldDefinition[];
}

export interface CreateTableRequest {
  table_name: string;
  schema: FieldDefinition[];
  description?: string;
}

export interface UpdateTableRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface TableQueryOptions extends QueryOptions {
  where?: {
    name?: string;
    database_id?: string;
    created_by?: string;
    is_public?: boolean;
    created_at?: string | { $gte?: string; $lte?: string };
  };
}
