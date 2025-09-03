import { createErrorWithContext } from '../../errors';
import { HttpAdapter, HttpRequestConfig, HttpResponse } from './adapter';

interface AxiosInstance {
  (config: unknown): Promise<{
    data: unknown;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }>;
}

export class AxiosAdapter implements HttpAdapter {
  private axios: AxiosInstance;

  constructor() {
    try {
      // Dynamic import for optional axios dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.axios = require('axios');
    } catch (error) {
      throw createErrorWithContext(
        'Axios is required for Node.js < 18. Please install axios: npm install axios',
        { error }
      );
    }
  }

  async request<T = unknown>(
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    try {
      const axiosConfig = {
        url: config.url,
        method: config.method.toLowerCase(),
        headers: config.headers,
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        signal: config.signal,
        validateStatus: () => true, // Don't throw on non-2xx status codes
      };

      const response = await this.axios(axiosConfig);

      return {
        data: response.data as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers || {},
      };
    } catch (error: unknown) {
      const axiosError = error as {
        code?: string;
        message?: string;
        name?: string;
      };

      // Handle timeout errors
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message?.includes('timeout')
      ) {
        throw createErrorWithContext('Request timeout', {
          url: config.url,
          method: config.method,
          timeout: config.timeout,
        });
      }

      // Handle VPN and network connectivity issues
      if (
        axiosError.code === 'ERR_NETWORK' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'EHOSTUNREACH' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ERR_INTERNET_DISCONNECTED' ||
        axiosError.message?.includes('network') ||
        axiosError.message?.includes('internet') ||
        axiosError.message?.includes('connection') ||
        axiosError.message?.includes('resolve')
      ) {
        throw createErrorWithContext(
          'Network connection failed. Please check your internet connection or VPN settings.',
          {
            url: config.url,
            method: config.method,
            networkError: true,
            errorCode: axiosError.code,
            originalMessage: axiosError.message,
          }
        );
      }

      // Handle request cancellation
      if (
        axiosError.name === 'AbortError' ||
        axiosError.code === 'ERR_CANCELED'
      ) {
        throw createErrorWithContext('Request was aborted', {
          url: config.url,
          method: config.method,
        });
      }

      // Generic HTTP error fallback
      throw createErrorWithContext(
        `HTTP request failed: ${axiosError.message || 'Unknown error'}`,
        {
          url: config.url,
          method: config.method,
          originalError: error,
        }
      );
    }
  }
}
