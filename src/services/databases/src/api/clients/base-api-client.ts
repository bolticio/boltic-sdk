import { BolticErrorResponse } from '../../types/common/responses';
import type { Environment, Region } from '../../types/config/environment';
import { REGION_CONFIGS } from '../../types/config/environment';
import { HttpAdapter, createHttpAdapter } from '../../utils/http';

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
 * Base API Client - provides common functionality for all API clients
 */
export abstract class BaseApiClient {
  protected httpAdapter: HttpAdapter;
  protected config: BaseApiClientConfig;
  protected baseURL: string;

  constructor(
    apiKey: string,
    config: Omit<BaseApiClientConfig, 'apiKey'> = {}
  ) {
    this.config = { apiKey, ...config };
    this.httpAdapter = createHttpAdapter();

    // Set baseURL based on environment and region
    const environment = config.environment || 'prod';
    const region = config.region || 'asia-south1'; // Default to asia-south1 for legacy support
    this.baseURL = this.getBaseURL(environment, region);
  }

  private getBaseURL(environment: Environment, region: Region): string {
    const regionConfig = REGION_CONFIGS[region];
    if (!regionConfig) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const envConfig = regionConfig[environment];
    if (!envConfig) {
      throw new Error(
        `Unsupported environment: ${environment} for region: ${region}`
      );
    }

    return `${envConfig.baseURL}/v1`;
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
      console.error(`${prefix} Error:`, error);
    }

    // Handle different error types following Boltic format
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as {
        response?: {
          data?: BolticErrorResponse;
          status?: number;
        };
      };

      // If API already returned Boltic format, use it
      if (apiError.response?.data?.error) {
        return apiError.response.data;
      }

      // Otherwise format it to Boltic structure
      return {
        data: {},
        error: {
          code: `${prefix}_ERROR`,
          message:
            (error as unknown as Error).message || `Unknown ${prefix} error`,
          meta: [`Status: ${apiError.response?.status || 'unknown'}`],
        },
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        data: {},
        error: {
          code: `${prefix}_CLIENT_ERROR`,
          message: (error as Error).message,
          meta: [`${prefix} client-side error occurred`],
        },
      };
    }

    return {
      data: {},
      error: {
        code: `${prefix}_UNKNOWN_ERROR`,
        message: `An unexpected ${prefix} error occurred`,
        meta: [`Unknown ${prefix} error type`],
      },
    };
  }

  // Security methods to prevent API key exposure
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

  // Custom inspect method for Node.js console logging
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
