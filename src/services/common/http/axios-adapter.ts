import { createErrorWithContext } from '../errors';
import { HttpAdapter, HttpRequestConfig, HttpResponse } from './adapter';
import { decodeArrayBufferErrorBody } from './binary-response-body';

interface AxiosInstance {
  (config: unknown): Promise<{
    data: unknown;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }>;
}

/**
 * When `responseType === 'arraybuffer'` and the server returns an error, axios gives
 * an ArrayBuffer body that may actually be JSON — decode for the same error handling
 * as other services. Success binary responses are left as ArrayBuffer.
 */
function normalizeAxiosDataAfterResponse(
  config: HttpRequestConfig,
  status: number,
  data: unknown
): unknown {
  if (
    config.responseType !== 'arraybuffer' ||
    !(data instanceof ArrayBuffer) ||
    status < 400
  ) {
    return data;
  }
  return decodeArrayBufferErrorBody(data);
}

export class AxiosAdapter implements HttpAdapter {
  private axios: AxiosInstance;

  constructor() {
    try {
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
      const isFormData =
        typeof FormData !== 'undefined' && config.data instanceof FormData;
      let headers = config.headers;
      if (isFormData && headers) {
        headers = { ...headers };
        delete headers['Content-Type'];
        delete headers['content-type'];
      }

      const axiosConfig: Record<string, unknown> = {
        url: config.url,
        method: config.method.toLowerCase(),
        headers,
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        signal: config.signal,
        validateStatus: () => true,
      };
      if (config.responseType === 'arraybuffer') {
        axiosConfig.responseType = 'arraybuffer';
      }

      const response = await this.axios(axiosConfig);

      const responseData = normalizeAxiosDataAfterResponse(
        config,
        response.status,
        response.data
      );

      if (response.status < 200 || response.status >= 300) {
        const isHtmlError =
          (typeof responseData === 'string' &&
            responseData.trim().startsWith('<!DOCTYPE')) ||
          (typeof responseData === 'string' && responseData.includes('<html'));

        if (isHtmlError) {
          const htmlContent = responseData as string;
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

        if (
          responseData &&
          typeof responseData === 'object' &&
          'error' in (responseData as object)
        ) {
          return {
            data: responseData as T,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers || {},
          };
        }

        throw createErrorWithContext(
          `HTTP ${response.status}: ${response.statusText}`,
          {
            url: config.url,
            method: config.method,
            status: response.status,
            statusText: response.statusText,
            responseData,
          }
        );
      }

      return {
        data: responseData as T,
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

      if (
        axiosError.name === 'AbortError' ||
        axiosError.code === 'ERR_CANCELED'
      ) {
        throw createErrorWithContext('Request was aborted', {
          url: config.url,
          method: config.method,
        });
      }

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
