import {
  RecordData,
  RecordDeleteOptions,
  RecordDeleteResponse,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';
import {
  ApiFilter,
  mapWhereToFilters,
  normalizeFilters,
} from '../../utils/filters/filter-mapper';

// API Request/Response interfaces
export interface RecordApiRequest {
  data?: RecordData;
  filters?: ApiFilter[];
  page?: {
    page_no: number;
    page_size: number;
  };
  sort?: Record<string, unknown>[];
}

export interface RecordApiResponse {
  data: RecordWithId[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
}

export interface RecordInsertApiRequest {
  data: RecordData;
}

export interface RecordInsertApiResponse {
  data: RecordWithId;
}

export interface RecordUpdateApiRequest {
  set: RecordData;
  filters: ApiFilter[];
}

export interface RecordUpdateApiResponse {
  data: RecordWithId[];
}

export interface RecordUpdateByIdApiRequest {
  data: RecordData;
}

export interface RecordUpdateByIdApiResponse {
  data: RecordWithId;
}

export interface RecordDeleteApiRequest {
  filters?: ApiFilter[];
  record_ids?: string[];
}

export interface RecordDeleteApiResponse {
  message: string;
}

// Transform SDK request to API format
export function transformInsertRequest(
  sdkRequest: RecordData
): RecordInsertApiRequest {
  return {
    data: sdkRequest,
  };
}

export function transformListRequest(
  sdkRequest: RecordQueryOptions
): RecordApiRequest {
  return {
    filters: sdkRequest.filters
      ? normalizeFilters(sdkRequest.filters)
      : undefined,
    page: sdkRequest.page,
    sort: sdkRequest.sort,
  };
}

export function transformUpdateRequest(
  sdkRequest: RecordUpdateOptions
): RecordUpdateApiRequest {
  return {
    set: sdkRequest.set,
    filters: normalizeFilters(sdkRequest.filters),
  };
}

export function transformUpdateByIdRequest(
  sdkRequest: RecordUpdateByIdOptions
): RecordUpdateByIdApiRequest {
  return {
    data: sdkRequest.set,
  };
}

/**
 * Unified delete transformer that handles both record_ids and filters
 */
export function transformDeleteRequest(
  sdkRequest: RecordDeleteOptions & { table_id?: string }
): RecordDeleteApiRequest {
  const result: RecordDeleteApiRequest = {};

  // Handle record_ids deletion
  if (sdkRequest.record_ids && sdkRequest.record_ids.length > 0) {
    result.record_ids = sdkRequest.record_ids;
  }

  // Handle filters deletion
  if (sdkRequest.filters) {
    if (Array.isArray(sdkRequest.filters)) {
      // If filters is already an array of filters, check if it's ApiFilter or needs conversion
      if (
        sdkRequest.filters.length > 0 &&
        typeof sdkRequest.filters[0] === 'object' &&
        'field' in sdkRequest.filters[0] &&
        'operator' in sdkRequest.filters[0] &&
        'values' in sdkRequest.filters[0]
      ) {
        // Already ApiFilter format
        result.filters = sdkRequest.filters;
      } else {
        // Legacy Record<string, unknown>[] format - convert silently
        console.warn(
          'Legacy Record<string, unknown>[] filter format detected. Please migrate to the new filter format.'
        );
        // For now, pass through and let backend handle
        result.filters = sdkRequest.filters as ApiFilter[];
      }
    } else {
      // If filters is a where clause object, convert it to API filter format
      result.filters = mapWhereToFilters(sdkRequest.filters);
    }
  }

  return result;
}

// Transform API response to SDK format
export function transformInsertResponse(
  apiResponse: RecordInsertApiResponse
): RecordWithId {
  return apiResponse.data;
}

export function transformListResponse(apiResponse: RecordApiResponse): {
  data: RecordWithId[];
  pagination: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
} {
  return {
    data: apiResponse.data,
    pagination: apiResponse.pagination,
  };
}

export function transformUpdateResponse(
  apiResponse: RecordUpdateApiResponse
): RecordWithId[] {
  return apiResponse.data;
}

export function transformUpdateByIdResponse(
  apiResponse: RecordUpdateByIdApiResponse
): RecordWithId {
  return apiResponse.data;
}

export function transformDeleteResponse(
  apiResponse: RecordDeleteApiResponse
): RecordDeleteResponse {
  return {
    message: apiResponse.message,
  };
}
