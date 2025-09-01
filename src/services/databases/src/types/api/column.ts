import { FieldDefinition, FieldType } from './table';

// Alignment types
export type AlignmentType = 'left' | 'center' | 'right';

// Decimal types for number and currency fields
export type DecimalType =
  | '00'
  | '0.0'
  | '0.00'
  | '0.000'
  | '0.0000'
  | '0.00000'
  | '0.000000';

// Phone format types
export type PhoneFormatType =
  | '+91 123 456 7890'
  | '(123) 456-7890'
  | '+1 (123) 456-7890'
  | '+91 12 3456 7890';

// Date format enum for user-friendly values
export const DateFormatEnum = Object.freeze({
  MMDDYY: '%m/%d/%y',
  MMDDYYYY: '%m/%d/%Y',
  MM_DD_YYYY: '%m-%d-%Y',
  DD_MM_YYYY: '%d-%m-%Y',
  DDMMYYYY: '%d/%m/%Y',
  DDMMYY: '%d/%m/%y',
  YYYY_MM_DD: '%Y-%m-%d',
  MMMM__DD__YYYY: '%B %d %Y',
  MMM__DD__YYYY: '%b %d %Y',
  ddd__MMM__DD__YYYY: '%a %b %d %Y',
});

// Time format enum for user-friendly values
export const TimeFormatEnum = Object.freeze({
  HH_mm_ss: '%H:%M:%S',
  HH_mm_ssZ: '%H:%M:%SZ',
  HH_mm_ss_SSS: '%H:%M:%S.%f',
  HH_mm_ss__Z: '%H:%M:%S %Z',
  HH_mm__AMPM: '%I:%M %p', // 12-hour format with AM/PM
  HH_mm_ss__AMPM: '%I:%M:%S %p',
});

// Field type enum for validation
export enum FieldTypeEnum {
  TEXT = 'text',
  EMAIL = 'email',
  LONG_TEXT = 'long-text',
  DATE_TIME = 'date-time',
  NUMBER = 'number',
  CURRENCY = 'currency',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  PHONE_NUMBER = 'phone-number',
  LINK = 'link',
  JSON = 'json',
  VECTOR = 'vector',
  SPARSEVECTOR = 'sparsevec',
  HALFVECTOR = 'halfvec',
}

// Allowed field type conversions
export const ALLOWED_FIELD_TYPE_CONVERSIONS = {
  [FieldTypeEnum.TEXT]: [
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.EMAIL]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.LONG_TEXT]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.DATE_TIME]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.NUMBER]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.CURRENCY]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.CHECKBOX]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.DROPDOWN]: [],
  [FieldTypeEnum.PHONE_NUMBER]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.DATE_TIME,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.LINK,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.LINK]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.NUMBER,
    FieldTypeEnum.CURRENCY,
    FieldTypeEnum.CHECKBOX,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.JSON,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
  [FieldTypeEnum.JSON]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
  ],
  [FieldTypeEnum.VECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.HALFVECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.VECTOR,
  ],
  [FieldTypeEnum.SPARSEVECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.HALFVECTOR,
    FieldTypeEnum.SPARSEVECTOR,
  ],
  [FieldTypeEnum.HALFVECTOR]: [
    FieldTypeEnum.TEXT,
    FieldTypeEnum.EMAIL,
    FieldTypeEnum.LONG_TEXT,
    FieldTypeEnum.PHONE_NUMBER,
    FieldTypeEnum.LINK,
    FieldTypeEnum.VECTOR,
    FieldTypeEnum.SPARSEVECTOR,
    FieldTypeEnum.HALFVECTOR,
  ],
};

// Field-specific validation keys map
export const FIELD_SPECIFIC_KEYS_MAP = {
  [FieldTypeEnum.TEXT]: [],
  [FieldTypeEnum.EMAIL]: [],
  [FieldTypeEnum.LONG_TEXT]: [],
  [FieldTypeEnum.NUMBER]: ['decimals'],
  [FieldTypeEnum.CURRENCY]: ['decimals', 'currency_format'],
  [FieldTypeEnum.CHECKBOX]: [],
  [FieldTypeEnum.DROPDOWN]: [
    'selection_source',
    'selectable_items',
    'multiple_selections',
  ],
  [FieldTypeEnum.DATE_TIME]: ['timezone', 'date_format', 'time_format'],
  [FieldTypeEnum.PHONE_NUMBER]: ['phone_format'],
  [FieldTypeEnum.LINK]: [],
  [FieldTypeEnum.JSON]: [],
  [FieldTypeEnum.VECTOR]: ['vector_dimension'],
  [FieldTypeEnum.SPARSEVECTOR]: ['vector_dimension'],
  [FieldTypeEnum.HALFVECTOR]: ['vector_dimension'],
};

export interface ColumnCreateRequest {
  columns: FieldDefinition[];
  fields?: Array<keyof ColumnDetails>;
}

export interface ColumnUpdateRequest {
  name?: string;
  type?: FieldType;
  description?: string;
  is_nullable?: boolean;
  is_unique?: boolean;
  is_indexed?: boolean;
  is_visible?: boolean;
  is_primary_key?: boolean;
  is_readonly?: boolean;
  default_value?: unknown;
  field_order?: number;
  fields?: Array<keyof ColumnDetails>;

  // Type-specific properties that can be updated
  alignment?: AlignmentType;
  decimals?: DecimalType;
  currency_format?: string; // Use Currency API for validation
  selection_source?: 'provide-static-list';
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: PhoneFormatType;
  date_format?: keyof typeof DateFormatEnum;
  time_format?: keyof typeof TimeFormatEnum;
  timezone?: string;
  vector_dimension?: number;
}

export interface ColumnRecord {
  id: string;
}

// Full column details interface for when complete column data is returned
export interface ColumnDetails {
  id: string;
  name: string;
  table_id: string;
  type: FieldType;
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

  // Type-specific properties
  alignment?: AlignmentType;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  decimals?: number | string;
  currency_format?: string;
  selection_source?: string;
  selectable_items?: string[];
  multiple_selections?: boolean;
  phone_format?: string;
  vector_dimension?: number;
}

export interface ColumnQueryOptions {
  where?: {
    id?: string;
    name?: string;
    table_id?: string;
    type?: FieldType;
    is_nullable?: boolean;
    is_unique?: boolean;
    is_indexed?: boolean;
    is_primary_key?: boolean;
  };
  fields?: Array<keyof ColumnDetails>;
  sort?: Array<{
    field: keyof ColumnDetails;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface ColumnDeleteOptions {
  where: {
    id?: string;
    name?: string;
  };
}

export interface ColumnListResponse {
  columns: ColumnDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ColumnUpdateOptions {
  set: ColumnUpdateRequest;
  where: {
    id?: string;
    name?: string;
  };
}
