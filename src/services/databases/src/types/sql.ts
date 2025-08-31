import { PaginationInfo } from './common/operations';

// SDK Request Types
export interface TextToSQLOptions {
  currentQuery?: string;
}

export interface ExecutionResult {
  data: Record<string, unknown>[];
  count: number;
  metadata: unknown; // Pass metadata as-is from API response
  pagination?: PaginationInfo;
}
