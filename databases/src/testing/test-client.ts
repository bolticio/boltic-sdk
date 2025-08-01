import { BolticClient } from '../client/boltic-client';
import { PaginationInfo } from '../types/common/operations';

export interface MockClientOptions {
  apiKey?: string;
  environment?: 'local' | 'sit' | 'uat' | 'prod';
  mockResponses?: Record<string, unknown>;
  debug?: boolean;
}

export function createTestClient(
  options: MockClientOptions = {}
): BolticClient {
  return new BolticClient(options.apiKey || 'test-api-key-12345', {
    environment: 'local',
    baseURL: 'http://localhost:8000',
    debug: options.debug ?? true,
    timeout: 30000,
    ...options,
  });
}

export function createMockResponse<T>(data: T, pagination?: PaginationInfo) {
  return {
    data,
    pagination,
  };
}

export function createErrorResponse(error: string, details?: unknown) {
  return {
    error,
    details,
  };
}
