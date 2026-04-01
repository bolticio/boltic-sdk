import { createErrorWithContext } from '../errors';
import { HttpAdapter, HttpRequestConfig, HttpResponse } from './adapter';
import { decodeArrayBufferErrorBody } from './binary-response-body';

/**
 * Default response parsing for JSON APIs (all services except opt-in binary downloads).
 */
async function parseFetchBodyDefault(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * ArrayBuffer path — only when `config.responseType === 'arraybuffer'` (e.g. storage download).
 */
async function parseFetchBodyArrayBuffer(response: Response): Promise<unknown> {
  const buf = await response.arrayBuffer();
  if (response.status >= 400) {
    return decodeArrayBufferErrorBody(buf);
  }
  return buf;
}

async function parseFetchResponseData(
  response: Response,
  config: HttpRequestConfig
): Promise<unknown> {
  if (config.responseType === 'arraybuffer') {
    return parseFetchBodyArrayBuffer(response);
  }
  return parseFetchBodyDefault(response);
}

export class FetchAdapter implements HttpAdapter {
  async request<T = unknown>(
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    const url = new URL(config.url);

    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    const headerMap: Record<string, string> = { ...(config.headers || {}) };
    if (!isFormData) {
      headerMap['Content-Type'] =
        headerMap['Content-Type'] ??
        headerMap['content-type'] ??
        'application/json';
    } else {
      delete headerMap['Content-Type'];
      delete headerMap['content-type'];
    }

    const init: RequestInit = {
      method: config.method,
      headers: headerMap,
      signal: config.signal,
    };

    if (
      config.data &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)
    ) {
      init.body = isFormData
        ? (config.data as FormData)
        : JSON.stringify(config.data);
    }

    try {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

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

      const data = (await parseFetchResponseData(
        response,
        config
      )) as T;

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      if (response.status < 200 || response.status >= 300) {
        const isHtmlError =
          typeof data === 'string' &&
          (data.trim().startsWith('<!DOCTYPE') || data.includes('<html'));

        if (isHtmlError) {
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

        if (data && typeof data === 'object' && 'error' in data) {
          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers,
          };
        }

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
