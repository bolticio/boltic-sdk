import { createErrorWithContext } from '../../errors';
import { HttpAdapter, HttpRequestConfig, HttpResponse } from './adapter';

export class FetchAdapter implements HttpAdapter {
  async request<T = unknown>(
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    const url = new URL(config.url);

    // Add query parameters
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const init: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      signal: config.signal,
    };

    if (
      config.data &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)
    ) {
      init.body = JSON.stringify(config.data);
    }

    try {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      // Set up timeout if specified
      if (config.timeout) {
        timeoutId = setTimeout(() => controller.abort(), config.timeout);
        init.signal = config.signal
          ? (() => {
              const combinedController = new AbortController();
              config.signal.addEventListener('abort', () =>
                combinedController.abort()
              );
              controller.signal.addEventListener('abort', () =>
                combinedController.abort()
              );
              return combinedController.signal;
            })()
          : controller.signal;
      }

      const response = await fetch(url.toString(), init);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Check for non-2xx status codes
      if (response.status < 200 || response.status >= 300) {
        // Check if response is HTML error page
        const isHtmlError =
          typeof data === 'string' &&
          (data.trim().startsWith('<!DOCTYPE') || data.includes('<html'));

        if (isHtmlError) {
          // Extract error message from HTML if possible
          const htmlContent = data as string;
          const preMatch = htmlContent.match(/<pre>(.*?)<\/pre>/s);
          const errorMessage = preMatch
            ? preMatch[1].trim()
            : `HTTP ${response.status}: ${response.statusText}`;

          throw createErrorWithContext(errorMessage, {
            url: config.url,
            method: config.method,
            status: response.status,
            statusText: response.statusText,
            isHtmlError: true,
          });
        }

        // If it's a JSON error response, let it through for the client to handle
        if (data && typeof data === 'object' && 'error' in data) {
          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers,
          };
        }

        // For other non-2xx responses, throw an error
        throw createErrorWithContext(
          `HTTP ${response.status}: ${response.statusText}`,
          {
            url: config.url,
            method: config.method,
            status: response.status,
            statusText: response.statusText,
            responseData: data,
          }
        );
      }

      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
      };

      return httpResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createErrorWithContext('Request was aborted', {
          type: 'AbortError',
          url: config.url,
          method: config.method,
        });
      }

      // Handle VPN and network connectivity issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          error.name === 'TypeError' &&
          (errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('internet') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('resolve') ||
            errorMessage.includes('unreachable'))
        ) {
          throw createErrorWithContext(
            'Network connection failed. Please check your internet connection or VPN settings.',
            {
              url: config.url,
              method: config.method,
              networkError: true,
              originalMessage: error.message,
            }
          );
        }
      }

      throw createErrorWithContext(
        `HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          url: config.url,
          method: config.method,
          originalError: error,
        }
      );
    }
  }
}
