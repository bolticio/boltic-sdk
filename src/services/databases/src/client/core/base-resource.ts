import { formatError } from '../../errors';
import { ApiResponse, QueryOptions } from '../../types/common/responses';
import { HttpResponse } from '../../utils/http/adapter';
import { BaseClient } from './base-client';

export abstract class BaseResource {
  protected client: BaseClient;
  protected basePath: string;

  constructor(client: BaseClient, basePath: string) {
    this.client = client;
    this.basePath = basePath;
  }

  // Public getter for basePath
  getBasePath(): string {
    return this.basePath;
  }

  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: unknown,
    options?: { params?: Record<string, unknown> }
  ): Promise<ApiResponse<T>> {
    const url = `${this.basePath}${path}`;

    try {
      let response: HttpResponse<ApiResponse<T>>;

      switch (method) {
        case 'GET':
          response = await this.client.get<ApiResponse<T>>(url, {
            params: options?.params,
          });
          break;
        case 'POST':
          response = await this.client.post<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case 'PUT':
          response = await this.client.put<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case 'PATCH':
          response = await this.client.patch<ApiResponse<T>>(url, data, {
            params: options?.params,
          });
          break;
        case 'DELETE':
          response = await this.client.delete<ApiResponse<T>>(url, {
            params: options?.params,
          });
          break;
      }

      return response.data;
    } catch (error) {
      // Return error response in consistent format
      return {
        error: formatError(error),
        details: error,
      };
    }
  }

  protected buildQueryParams(
    options: QueryOptions = {}
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (options.fields?.length) {
      params.fields = options.fields.join(',');
    }

    if (options.sort?.length) {
      params.sort = options.sort.map((s) => `${s.field}:${s.order}`).join(',');
    }

    if (options.limit !== undefined) {
      params.limit = options.limit;
    }

    if (options.offset !== undefined) {
      params.offset = options.offset;
    }

    if (options.where) {
      // Convert where conditions to query parameters
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[`where[${key}]`] =
            typeof value === 'object' ? JSON.stringify(value) : value;
        }
      });
    }

    return params;
  }

  protected handleResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
    if ('error' in response) {
      // Log error if debug mode is on
      if (this.client.getConfig().debug) {
        // eslint-disable-next-line no-console
        console.error('API Error:', response.error);
      }
    }
    return response;
  }
}
