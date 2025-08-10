import { createErrorWithContext, getHttpStatusCode } from '../../errors';
import {
  HttpAdapter,
  HttpRequestConfig,
  HttpResponse,
  createHttpAdapter,
} from '../../utils/http';
import { AuthManager } from './auth-manager';
import { ClientConfig } from './config';
import { InterceptorManagerImpl } from './interceptors';

export class BaseClient {
  private httpAdapter: HttpAdapter;
  private authManager: AuthManager;
  private interceptors: InterceptorManagerImpl;
  private config: ClientConfig;

  constructor(config: ClientConfig, authManager: AuthManager) {
    this.config = config;
    this.authManager = authManager;
    this.httpAdapter = createHttpAdapter();
    this.interceptors = new InterceptorManagerImpl();

    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    // Default request interceptor - add auth headers
    this.interceptors.request.use((config) => {
      const authHeaders = this.authManager.getAuthHeaders();
      config.headers = {
        ...config.headers,
        ...authHeaders,
        ...this.config.headers,
      };
      return config;
    });

    // Default response interceptor - handle common errors
    this.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          // eslint-disable-next-line no-console
          console.log('HTTP Response:', response);
        }
        return response;
      },
      (error) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: unknown): never {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.error('HTTP Error:', error);
    }

    // Check if it's already our wrapped error
    if (
      error instanceof Error &&
      (error as Error & { context?: unknown }).context
    ) {
      throw error;
    }

    const statusCode = getHttpStatusCode(error);

    // Network errors (no response)
    if (!statusCode) {
      throw createErrorWithContext('Network request failed', {
        name: 'NetworkError',
        originalError: error,
      });
    }

    // API errors with status codes
    const errorData =
      (error as { response?: { data?: unknown }; data?: unknown }).response
        ?.data || (error as { data?: unknown }).data;
    const message =
      (errorData as { message?: string; error?: string })?.message ||
      (errorData as { message?: string; error?: string })?.error ||
      `HTTP ${statusCode} error`;

    throw createErrorWithContext(message, {
      name: 'ApiError',
      statusCode,
      response: errorData,
      isClientError: statusCode >= 400 && statusCode < 500,
      isServerError: statusCode >= 500,
      isAuthError: statusCode === 401 || statusCode === 403,
      isNotFoundError: statusCode === 404,
      isRateLimitError: statusCode === 429,
    });
  }

  async request<T = unknown>(
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    let lastError: unknown;
    const maxRetries = this.config.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add base URL if not absolute
        if (!config.url.startsWith('http')) {
          config.url = `${this.config.baseURL}${config.url}`;
        }

        // Set default timeout
        if (!config.timeout) {
          config.timeout = this.config.timeout;
        }

        // Execute request interceptors
        const requestConfig =
          await this.interceptors.executeRequestInterceptors(config);

        // Make the request
        const response = await this.httpAdapter.request<T>(requestConfig);

        // Check for HTTP errors (non-2xx status codes)
        if (response.status >= 400) {
          const error = createErrorWithContext(
            `HTTP ${response.status} error`,
            {
              name: 'ApiError',
              statusCode: response.status,
              response: response.data,
              statusText: response.statusText,
            }
          );
          throw await this.interceptors.executeErrorInterceptors(error);
        }

        // Execute response interceptors
        return (await this.interceptors.executeResponseInterceptors(
          response
        )) as HttpResponse<T>;
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) or if we've exhausted retries
        if (attempt === maxRetries) {
          break;
        }

        const statusCode = getHttpStatusCode(error);
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          // Don't retry client errors
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Execute error interceptors and throw the last error
    throw await this.interceptors.executeErrorInterceptors(lastError);
  }

  get<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  delete<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  getInterceptors(): InterceptorManagerImpl {
    return this.interceptors;
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }
}
