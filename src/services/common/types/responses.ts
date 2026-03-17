import { PaginationInfo } from './operations';

export interface BolticSuccessResponse<T> {
  data: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

export interface BolticListResponse<T> {
  data: T[];
  pagination?: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
  message?: string;
  error?: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

export interface BolticErrorResponse {
  data?: never;
  message?: string;
  error: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

export type ApiResponse<T> =
  | BolticSuccessResponse<T>
  | BolticListResponse<T>
  | BolticErrorResponse;

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is BolticErrorResponse {
  return 'error' in response && response.error !== undefined;
}

export function isListResponse<T>(
  response: ApiResponse<T>
): response is BolticListResponse<T> {
  return 'pagination' in response;
}

// Legacy interfaces for backwards compatibility
export interface SuccessResponse<T> {
  data: T;
  error?: never;
  pagination?: PaginationInfo;
}

export interface ErrorResponse {
  data?: never;
  error: string;
  details?: unknown;
  code?: string;
}

export interface BulkResponse<T> {
  success: T[];
  failed: Array<{
    item: unknown;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface QueryOptions {
  fields?: string[];
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  where?: Record<string, unknown>;
}
