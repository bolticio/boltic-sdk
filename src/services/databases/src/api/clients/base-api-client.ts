import { BolticErrorResponse } from '../../types/common/responses';
import type { Environment, Region } from '../../types/config/environment';
import { resolveServiceURL } from '../../types/config/environment';
import { HttpAdapter, createHttpAdapter } from '../../utils/http';

/** Well-known service paths used across the SDK */
export const SERVICE_PATHS = {
  DATABASES: '/service/sdk/boltic-tables/v1',
  WORKFLOW_TEMPORAL: '/service/panel/temporal/v1.0',
  // WORKFLOW_AUTOMATION: '/service/panel/automation/v1.0',
  INTEGRATION: '/service/panel/integration/v1',
} as const;

export interface BaseApiClientConfig {
  apiKey: string;
  environment?: Environment;
  region?: Region;
  timeout?: number;
  debug?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Base API Client - provides common functionality for all API clients.
 *
 * Subclasses pass a `servicePath` to target different backend services
 * while sharing auth, headers, error handling, and HTTP infrastructure.
 */
export abstract class BaseApiClient {
  protected httpAdapter: HttpAdapter;
  protected config: BaseApiClientConfig;
  protected baseURL: string;
  protected environment: Environment;
  protected region: Region;

  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {},
    servicePath: string = SERVICE_PATHS.DATABASES
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    this.environment = config.environment || 'prod';
    this.region = config.region || 'asia-south1';
    this.baseURL = resolveServiceURL(this.region, this.environment, servicePath);
  }

  /**
   * Resolve a secondary service URL using the same region/environment
   * but a different service path. Useful when a single client talks
   * to multiple backend services (e.g. temporal + integration).
   */
  protected resolveAdditionalServiceURL(servicePath: string): string {
    return resolveServiceURL(this.region, this.environment, servicePath);
  }

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-boltic-token': this.config.apiKey,
      ...this.config.headers,
    };
  }

  protected formatErrorResponse(
    error: unknown,
    prefix = 'API'
  ): BolticErrorResponse {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.error(`[${this.constructor.name}] ${prefix} Error:`, error);
    }

    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as {
        response?: {
          data?: BolticErrorResponse;
          status?: number;
        };
      };

      if (apiError.response?.data?.error) {
        return apiError.response.data;
      }

      return {
        error: {
          code: `${prefix}_ERROR`,
          message:
            error instanceof Error
              ? error.message
              : `Unknown ${prefix} error`,
          meta: [`Status: ${apiError.response?.status || 'unknown'}`],
        },
      };
    }

    if (error instanceof Error) {
      return {
        error: {
          code: `${prefix}_CLIENT_ERROR`,
          message: error.message,
          meta: [],
        },
      };
    }

    return {
      error: {
        code: `${prefix}_UNKNOWN_ERROR`,
        message: `An unexpected ${prefix} error occurred`,
        meta: [],
      },
    };
  }

  toString(): string {
    return `${this.constructor.name} { environment: "${this.config.environment || 'prod'}", debug: ${this.config.debug || false} }`;
  }

  toJSON(): object {
    const safeConfig = { ...this.config };
    delete (safeConfig as Record<string, unknown>).apiKey;
    return {
      client: this.constructor.name,
      config: safeConfig,
    };
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
