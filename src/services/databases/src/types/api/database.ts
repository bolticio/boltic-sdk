/**
 * Database Management API Types
 * Based on DATABASE_MANAGEMENT_API_CONTRACT.md
 */

/**
 * Database status enum
 */
export type DatabaseStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Database Job status enum
 */
export type DatabaseJobStatus =
  | 'pending'
  | 'in_progress'
  | 'partial_success'
  | 'success'
  | 'failed'
  | 'cancelled';

/**
 * Database Job action enum
 */
export type DatabaseJobAction = 'DELETE';

/**
 * Database record from API
 */
export interface DatabaseRecord {
  id: string;
  account_id: string;
  db_name: string;
  db_internal_name: string;
  db_username: string;
  resource_id: string;
  status: DatabaseStatus;
  is_default: boolean;
  rank: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database job record from API
 */
export interface DatabaseJobRecord {
  id: string;
  account_id: string;
  resource_id: string;
  type: string;
  action: DatabaseJobAction;
  db_id: string;
  db_internal_name: string;
  db_username: string;
  job_status: DatabaseJobStatus;
  total_dbs: number;
  successful_dbs: number;
  failed_dbs: number;
  error: string | null;
  is_read: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database deletion job initial response
 */
export interface DatabaseDeletionJobResponse {
  job_id: string;
  db_id: string;
  status: 'pending';
}

/**
 * Database deletion status response
 */
export interface DatabaseDeletionStatusResponse {
  jobId: string;
  status: DatabaseJobStatus;
  message: string;
}

/**
 * Request to create a new database
 */
export interface DatabaseCreateRequest {
  db_name: string;
  db_internal_name?: string;
  resource_id?: string;
}

/**
 * Request to update a database
 */
export interface DatabaseUpdateRequest {
  db_name: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page_no?: number;
  page_size?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  field: string;
  operator: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[];
}

/**
 * Request to list databases
 */
export interface DatabaseListRequest {
  page?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
}

/**
 * Query parameters for list databases endpoint
 */
export interface DatabaseListQueryParams {
  connector_id?: string;
  add_default_if_missing?: 'true' | 'false';
}

/**
 * Request to list database jobs
 */
export interface DatabaseJobListRequest {
  page?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
  deleted_by_me?: boolean;
}

/**
 * Pagination metadata in response
 */
export interface PaginationMetadata {
  total_count: number;
  current_page: number;
  per_page: number;
  total_pages?: number;
}

/**
 * Database query options for SDK methods
 */
export interface DatabaseQueryOptions {
  connector_id?: string;
  add_default_if_missing?: boolean;
  page?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
  fields?: string[];
}

/**
 * Database job query options for SDK methods
 */
export interface DatabaseJobQueryOptions {
  deleted_by_me?: boolean;
  page?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
  fields?: string[];
}

/**
 * Database API endpoint definition
 */
export interface DatabaseApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}
