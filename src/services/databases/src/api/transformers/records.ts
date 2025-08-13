import {
  RecordData,
  RecordDeleteByIdsOptions,
  RecordDeleteResponse,
  RecordQueryOptions,
  RecordUpdateByIdOptions,
  RecordUpdateOptions,
  RecordWithId,
} from '../../types/api/record';

// API Request/Response interfaces
export interface RecordApiRequest {
  data?: RecordData;
  filters?: Record<string, unknown>[];
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
  filters: Record<string, unknown>[];
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
  filters?: Record<string, unknown>[];
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
    filters: sdkRequest.filters,
    page: sdkRequest.page,
    sort: sdkRequest.sort,
  };
}

export function transformUpdateRequest(
  sdkRequest: RecordUpdateOptions
): RecordUpdateApiRequest {
  return {
    set: sdkRequest.set,
    filters: sdkRequest.filters,
  };
}

export function transformUpdateByIdRequest(
  sdkRequest: RecordUpdateByIdOptions
): RecordUpdateByIdApiRequest {
  return {
    data: sdkRequest.set,
  };
}

export function transformDeleteByIdsRequest(
  sdkRequest: RecordDeleteByIdsOptions
): RecordDeleteApiRequest {
  return {
    record_ids: sdkRequest.record_ids,
  };
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
