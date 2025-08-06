import {
  ColumnDetails,
  ColumnQueryOptions,
  ColumnRecord,
  ColumnUpdateRequest,
  DateFormatEnum,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';
import { ApiFilter } from '../../utils/filters/filter-mapper';

export interface ColumnCreateApiRequest {
  field: FieldDefinition;
}

export interface ColumnListApiRequest {
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

export interface ColumnUpdateApiRequest {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  is_primary_key?: boolean;
  is_visible?: boolean;
  is_readonly?: boolean;
  default_value?: unknown;
  field_order?: number;
  alignment?: 'left' | 'center' | 'right';
  decimals?: string;
  currency_format?: string;
  selection_source?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;
  date_format?: string;
  time_format?: string;
  timezone?: string;
  vector_dimension?: number;
}

export interface ColumnApiResponse {
  data: {
    id: string;
    name: string;
    original_name: string;
    table_id: string;
    table_name: string;
    type: string;
    description?: string;
    is_nullable: boolean;
    is_primary_key: boolean;
    is_unique: boolean;
    is_indexed: boolean;
    is_visible: boolean;
    is_readonly: boolean;
    field_order: number;
    default_value?: unknown;
    created_at: string;
    updated_at: string;
    alignment?: string;
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
  };
}

export interface ColumnListApiResponse {
  data: ColumnDetails[];
  pagination: {
    total_count: number;
    current_page: number;
    per_page: number;
  };
}

/**
 * Transform SDK column create request to API format
 */
export function transformColumnCreateRequest(
  request: FieldDefinition
): FieldDefinition {
  // Validate the single column data
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid request: single column data is required');
  }

  if (!request.name || !request.type) {
    throw new Error('Column name and type are required');
  }

  // Transform the single column
  return transformFieldDefinition(request);
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
    alignment: field.alignment ?? 'center',
    timezone: field.timezone ?? undefined,
    date_format: field.date_format
      ? transformDateFormat(field.date_format as keyof typeof DateFormatEnum)
      : undefined,
    time_format: field.time_format
      ? transformTimeFormat(field.time_format as keyof typeof TimeFormatEnum)
      : undefined,
    decimals: field.decimals ?? undefined,
    currency_format: field.currency_format ?? undefined,
    selection_source: field.selection_source ?? undefined,
    selectable_items: field.selectable_items ?? undefined,
    multiple_selections: field.multiple_selections ?? undefined,
    phone_format: field.phone_format ?? undefined,
    vector_dimension: field.vector_dimension ?? undefined,
    description: field.description ?? undefined,
    default_value: field.default_value ?? undefined,
  };
}

/**
 * Transform SDK column list request to API format
 */
export function transformColumnListRequest(
  options: ColumnQueryOptions & {
    page?: number;
    pageSize?: number;
  } = {}
): ColumnListApiRequest {
  const request: ColumnListApiRequest = {};

  // Add pagination
  if (options.page !== undefined || options.pageSize !== undefined) {
    request.page = {
      page_no: options.page || 1,
      page_size: options.pageSize || 50,
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
    const filters: ApiFilter[] = [];

    Object.entries(options.where).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filters.push({
          field: key,
          operator: '=',
          values: [value],
        });
      }
    });

    if (filters.length > 0) {
      request.filters = filters;
    }
  }

  return request;
}

/**
 * Transform SDK column update request to API format
 */
export function transformColumnUpdateRequest(
  updates: ColumnUpdateRequest
): ColumnUpdateApiRequest {
  const apiRequest: ColumnUpdateApiRequest = {};

  if (updates.name !== undefined) apiRequest.name = updates.name;
  if (updates.type !== undefined) apiRequest.type = updates.type;
  if (updates.description !== undefined)
    apiRequest.description = updates.description;
  if (updates.is_nullable !== undefined)
    apiRequest.is_nullable = updates.is_nullable;
  if (updates.is_unique !== undefined) apiRequest.is_unique = updates.is_unique;
  if (updates.is_primary_key !== undefined)
    apiRequest.is_primary_key = updates.is_primary_key;
  if (updates.is_indexed !== undefined)
    apiRequest.is_indexed = updates.is_indexed;
  if (updates.is_visible !== undefined)
    apiRequest.is_visible = updates.is_visible;
  if (updates.is_readonly !== undefined)
    apiRequest.is_readonly = updates.is_readonly;
  if (updates.default_value !== undefined)
    apiRequest.default_value = updates.default_value;
  if (updates.field_order !== undefined)
    apiRequest.field_order = updates.field_order;

  // Type-specific fields
  if (updates.alignment !== undefined) apiRequest.alignment = updates.alignment;
  if (updates.decimals !== undefined) apiRequest.decimals = updates.decimals;
  if (updates.currency_format !== undefined)
    apiRequest.currency_format = updates.currency_format;
  if (updates.selection_source !== undefined)
    apiRequest.selection_source = updates.selection_source;
  if (updates.selectable_items !== undefined)
    apiRequest.selectable_items = updates.selectable_items;
  if (updates.multiple_selections !== undefined)
    apiRequest.multiple_selections = updates.multiple_selections;
  if (updates.phone_format !== undefined)
    apiRequest.phone_format = updates.phone_format;
  if (updates.timezone !== undefined) apiRequest.timezone = updates.timezone;
  if (updates.vector_dimension !== undefined)
    apiRequest.vector_dimension = updates.vector_dimension;

  // Transform date and time formats
  if (updates.date_format !== undefined) {
    apiRequest.date_format = transformDateFormat(updates.date_format);
  }
  if (updates.time_format !== undefined) {
    apiRequest.time_format = transformTimeFormat(updates.time_format);
  }

  return apiRequest;
}

/**
 * Transform API column response to SDK format
 */
export function transformColumnResponse(
  response: ColumnApiResponse
): ColumnDetails {
  return {
    id: response.data.id,
    name: response.data.name,
    table_id: response.data.table_id,
    type: response.data.type as FieldType,
    description: response.data.description,
    is_nullable: response.data.is_nullable,
    is_primary_key: response.data.is_primary_key,
    is_unique: response.data.is_unique,
    is_indexed: response.data.is_indexed,
    is_visible: response.data.is_visible,
    is_readonly: response.data.is_readonly,
    field_order: response.data.field_order,
    default_value: response.data.default_value,
    created_at: response.data.created_at,
    updated_at: response.data.updated_at,
    alignment: response.data.alignment as 'left' | 'center' | 'right',
    timezone: response.data.timezone,
    date_format: response.data.date_format,
    time_format: response.data.time_format,
    decimals: response.data.decimals,
    currency_format: response.data.currency_format,
    selection_source: response.data.selection_source,
    selectable_items: response.data.selectable_items,
    multiple_selections: response.data.multiple_selections,
    phone_format: response.data.phone_format,
    vector_dimension: response.data.vector_dimension,
  };
}

/**
 * Transform API column create response to SDK format
 * For create operations, the API returns only the id
 */
export function transformColumnCreateResponse(response: {
  data: { id: string };
  message?: string;
}): ColumnRecord {
  return {
    id: response.data.id,
  };
}

/**
 * Transform API column list response to SDK format
 */
export function transformColumnListResponse(response: ColumnListApiResponse): {
  columns: ColumnDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} {
  return {
    columns: response.data || [],
    pagination: {
      total: response.pagination?.total_count || 0,
      page: response.pagination?.current_page || 1,
      limit: response.pagination?.per_page || 10,
      pages: Math.ceil(
        (response.pagination?.total_count || 0) /
          (response.pagination?.per_page || 10)
      ),
    },
  };
}

/**
 * Transform date format from user-friendly enum to API format
 */
function transformDateFormat(dateFormat: keyof typeof DateFormatEnum): string {
  return DateFormatEnum[dateFormat] || dateFormat;
}

/**
 * Transform time format from user-friendly enum to API format
 */
function transformTimeFormat(timeFormat: keyof typeof TimeFormatEnum): string {
  return TimeFormatEnum[timeFormat] || timeFormat;
}

/**
 * Validate column name
 */
export function validateColumnName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Column name is required and must be a string',
    };
  }

  if (name.trim().length === 0) {
    return {
      valid: false,
      error: 'Column name cannot be empty',
    };
  }

  if (name.length > 64) {
    return {
      valid: false,
      error: 'Column name cannot exceed 64 characters',
    };
  }

  // Check for invalid characters
  const invalidChars = /[^a-zA-Z0-9_]/;
  if (invalidChars.test(name)) {
    return {
      valid: false,
      error: 'Column name can only contain letters, numbers, and underscores',
    };
  }

  // Check if starts with number
  if (/^\d/.test(name)) {
    return {
      valid: false,
      error: 'Column name cannot start with a number',
    };
  }

  return { valid: true };
}

/**
 * Validate column description
 */
export function validateColumnDescription(description?: string): {
  valid: boolean;
  error?: string;
} {
  if (description === undefined || description === null) {
    return { valid: true };
  }

  if (typeof description !== 'string') {
    return {
      valid: false,
      error: 'Column description must be a string',
    };
  }

  if (description.length > 500) {
    return {
      valid: false,
      error: 'Column description cannot exceed 500 characters',
    };
  }

  return { valid: true };
}

/**
 * Validate columns array
 */
export function validateColumnsArray(columns: FieldDefinition[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(columns)) {
    return {
      valid: false,
      error: 'Columns must be an array',
    };
  }

  if (columns.length === 0) {
    return {
      valid: false,
      error: 'At least one column is required',
    };
  }

  if (columns.length > 100) {
    return {
      valid: false,
      error: 'Cannot create more than 100 columns at once',
    };
  }

  // Check for duplicate column names
  const names = columns.map((col) => col.name);
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    return {
      valid: false,
      error: 'Column names must be unique',
    };
  }

  // Validate each column
  for (const column of columns) {
    const nameValidation = validateColumnName(column.name);
    if (!nameValidation.valid) {
      return nameValidation;
    }

    const descriptionValidation = validateColumnDescription(column.description);
    if (!descriptionValidation.valid) {
      return descriptionValidation;
    }
  }

  return { valid: true };
}
