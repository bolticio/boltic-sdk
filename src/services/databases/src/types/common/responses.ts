import { PaginationInfo } from './operations';

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

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

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
