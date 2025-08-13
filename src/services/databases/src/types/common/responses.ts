import { PaginationInfo } from './operations';

// Boltic API Response Structure
export interface BolticSuccessResponse<T> {
  data: T;
  message?: string;
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
}

export interface BolticErrorResponse {
  data: {};
  error: {
    code?: string;
    message?: string;
    meta?: string[];
  };
}

// Union type for all possible responses
export type ApiResponse<T> =
  | BolticSuccessResponse<T>
  | BolticListResponse<T>
  | BolticErrorResponse;

// Helper type to check if response is an error
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is BolticErrorResponse {
  return 'error' in response;
}

// Helper type to check if response is a list response
export function isListResponse<T>(
  response: ApiResponse<T>
): response is BolticListResponse<T> {
  return 'pagination' in response;
}

// Legacy interfaces for backwards compatibility (to be deprecated)
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
