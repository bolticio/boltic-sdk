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
}

export interface TableUpdateApiRequest {
  name?: string;
  description?: string;
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
    is_indexed: field.is_indexed ?? false,
    is_visible: field.is_visible ?? true,
    is_readonly: field.is_readonly ?? false,
    field_order: field.field_order ?? 1,
    alignment: field.alignment ?? 'left',
    timezone: field.timezone ?? undefined,
    date_format: field.date_format ?? undefined,
    time_format: field.time_format ?? undefined,
    decimals: field.decimals ?? undefined,
    currency_format: field.currency_format ?? undefined,
    selection_source:
      field.type === 'dropdown' && !field.selection_source
        ? 'provide-static-list'
        : (field.selection_source ?? undefined),
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
  } = {}
): TableListApiRequest {
  const request: TableListApiRequest = {};

  // Add pagination
  if (options.page !== undefined || options.pageSize !== undefined) {
    request.page = {
      page_no: options.page ?? 1,
      page_size: options.pageSize ?? options.limit ?? 1000,
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
    const { filters } = buildApiFilters(options.where);
    request.filters = filters;
  }

  return request;
}

/**
 * Transform SDK table update request to API format
 */
export function transformTableUpdateRequest(updates: {
  name?: string;
  description?: string;
}): TableUpdateApiRequest {
  const request: TableUpdateApiRequest = {};

  if (updates.name !== undefined) {
    request.name = updates.name;
  }

  if (updates.description !== undefined) {
    request.description = updates.description;
  }

  return request;
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
