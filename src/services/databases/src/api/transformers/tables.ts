import {
  FieldDefinition,
  TableCreateRequest,
  TableQueryOptions,
  TableRecord,
} from '../../types/api/table';
import { ApiFilter, buildApiFilters } from '../../utils/filters/filter-mapper';

export interface TableCreateApiRequest {
  name: string;
  description?: string;
  fields: FieldDefinition[];
  is_ai_generated_schema?: boolean;
  is_template?: boolean;
}

export interface TableListApiRequest {
  page?: {
    page_no: number;
    page_size: number;
  };
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  filters?: ApiFilter[];
  is_shared?: boolean;
}

export interface TableUpdateApiRequest {
  name?: string;
  description?: string;
  is_shared?: boolean;
  snapshot?: string;
}

export interface GenerateSchemaApiRequest {
  prompt: string;
}

export interface TableApiResponse {
  data: {
    id: string;
    name: string;
    description: string;
    internal_table_name: string;
    is_public: boolean;
    snapshot_url?: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    fields: FieldDefinition[];
  };
}

export interface TableListApiResponse {
  data: TableRecord[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}

/**
 * Transform SDK table create request to API format
 */
export function transformTableCreateRequest(
  request: TableCreateRequest,
  options: {
    is_ai_generated_schema?: boolean;
    is_template?: boolean;
  } = {}
): TableCreateApiRequest {
  return {
    name: request.name,
    description: request.description,
    fields: request.fields.map(transformFieldDefinition),
    is_ai_generated_schema: options.is_ai_generated_schema || false,
    is_template: options.is_template || false,
  };
}

/**
 * Transform field definition to API format
 */
function transformFieldDefinition(field: FieldDefinition): FieldDefinition {
  return {
    name: field.name,
    type: field.type,
    is_nullable: field.is_nullable ?? true,
    is_primary_key: field.is_primary_key ?? false,
    is_unique: field.is_unique ?? false,
    is_visible: field.is_visible ?? true,
    is_readonly: field.is_readonly ?? false,
    is_indexed: field.is_indexed ?? false,
    field_order: field.field_order ?? 1,
    alignment: field.alignment ?? undefined,
    timezone: field.timezone ?? undefined,
    date_format: field.date_format ?? undefined,
    time_format: field.time_format ?? undefined,
    decimals: field.decimals ?? undefined,
    currency_format: field.currency_format ?? undefined,
    selection_source: field.selection_source ?? undefined,
    selectable_items: field.selectable_items ?? undefined,
    multiple_selections: field.multiple_selections ?? false,
    phone_format: field.phone_format ?? undefined,
    vector_dimension: field.vector_dimension ?? undefined,
    description: field.description,
    default_value: field.default_value,
  };
}

/**
 * Transform SDK table query options to API list request
 */
export function transformTableListRequest(
  options: TableQueryOptions & {
    page?: number;
    pageSize?: number;
    isShared?: boolean;
  } = {}
): TableListApiRequest {
  const request: TableListApiRequest = {};

  // Add pagination
  if (options.page !== undefined || options.pageSize !== undefined) {
    request.page = {
      page_no: options.page ?? 1,
      page_size: options.pageSize ?? options.limit ?? 10,
    };
  } else if (options.limit !== undefined) {
    request.page = {
      page_no: Math.floor((options.offset ?? 0) / options.limit) + 1,
      page_size: options.limit,
    };
  }

  // Add sorting
  if (options.sort?.length) {
    request.sort = options.sort.map((s) => ({
      field: s.field as string,
      direction: s.order,
    }));
  }

  // Add filters
  if (options.where) {
    request.filters = buildApiFilters(options.where, { validateFilters: true });
  }

  // Add shared filter
  if (options.isShared !== undefined) {
    request.is_shared = options.isShared;
  }

  return request;
}

/**
 * Transform SDK table update request to API format
 */
export function transformTableUpdateRequest(updates: {
  name?: string;
  description?: string;
  is_shared?: boolean;
  snapshot?: string;
}): TableUpdateApiRequest {
  const request: TableUpdateApiRequest = {};

  if (updates.name !== undefined) {
    request.name = updates.name;
  }

  if (updates.description !== undefined) {
    request.description = updates.description;
  }

  if (updates.is_shared !== undefined) {
    request.is_shared = updates.is_shared;
  }

  if (updates.snapshot !== undefined) {
    request.snapshot = updates.snapshot;
  }

  return request;
}

/**
 * Transform API table response to SDK format
 */
export function transformTableResponse(
  response: TableApiResponse
): TableRecord {
  return {
    id: response.data.id,
    name: response.data.name,
    account_id: '', // Will be filled by API
    internal_table_name: response.data.internal_table_name,
    internal_db_name: '', // Will be filled by API
    db_id: '', // Will be filled by API
    resource_id: '',
    description: response.data.description,
    type: '',
    parent_table_id: '',
    is_deleted: false,
    is_public: response.data.is_public,
    created_by: response.data.created_by,
    created_at: response.data.created_at,
    updated_at: response.data.updated_at,
    updated_by: response.data.updated_by,
    snapshot_url: response.data.snapshot_url,
    source: 'boltic',
  };
}

/**
 * Transform API table list response to SDK format
 */
export function transformTableListResponse(response: TableListApiResponse): {
  tables: TableRecord[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
} {
  return {
    tables: response.data,
    pagination: {
      total_count: response.pagination?.total_count,
      total_pages: response.pagination?.total_pages,
      current_page: response.pagination?.current_page,
      per_page: response.pagination?.per_page,
      type: response.pagination?.type,
    },
  };
}

/**
 * Transform generate schema request
 */
export function transformGenerateSchemaRequest(
  prompt: string
): GenerateSchemaApiRequest {
  return { prompt };
}

/**
 * Validate table name according to API requirements
 */
export function validateTableName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Table name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Table name cannot exceed 100 characters' };
  }

  if (name.trim() !== name) {
    return {
      valid: false,
      error: 'Table name cannot have leading or trailing whitespace',
    };
  }

  if (name.length === 0) {
    return { valid: false, error: 'Table name cannot be empty' };
  }

  return { valid: true };
}

/**
 * Validate table description according to API requirements
 */
export function validateTableDescription(description?: string): {
  valid: boolean;
  error?: string;
} {
  if (description === undefined || description === null) {
    return { valid: true };
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' };
  }

  if (description.length > 500) {
    return { valid: false, error: 'Description cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate fields array according to API requirements
 */
export function validateFieldsArray(fields: FieldDefinition[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(fields)) {
    return { valid: false, error: 'Fields must be an array' };
  }

  if (fields.length === 0) {
    return { valid: false, error: 'At least one field is required' };
  }

  // Check for duplicate field names
  const fieldNames = new Set();
  for (const field of fields) {
    if (fieldNames.has(field.name.toLowerCase())) {
      return { valid: false, error: `Duplicate field name: ${field.name}` };
    }
    fieldNames.add(field.name.toLowerCase());
  }

  return { valid: true };
}
