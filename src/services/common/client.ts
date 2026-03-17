/**
 * Common client infrastructure shared across all SDK modules.
 *
 * - BaseApiClient: abstract base for all API clients (handles URL, headers, errors)
 * - BaseClient: HTTP client with interceptors, retries, and auth
 * - BaseResource: abstract base for all resource classes
 * - AuthManager: API key management and header injection
 * - ConfigManager / ClientConfig: environment-aware configuration
 * - InterceptorManagerImpl: request/response interceptor chain
 */

// Base API client (low-level, per-service HTTP calls)
export {
  BaseApiClient,
  SERVICE_PATHS,
} from '../databases/src/api/clients/base-api-client';
export type { BaseApiClientConfig } from '../databases/src/api/clients/base-api-client';

// Base client (high-level, with interceptors and retries)
export { BaseClient } from '../databases/src/client/core/base-client';

// Base resource (abstract class for domain resources)
export { BaseResource } from '../databases/src/client/core/base-resource';

// Auth
export { AuthManager } from '../databases/src/client/core/auth-manager';

// Config
export { ConfigManager } from '../databases/src/client/core/config';
export type { ClientConfig } from '../databases/src/client/core/config';

// Interceptors
export { InterceptorManagerImpl } from '../databases/src/client/core/interceptors';
export type {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorManager,
} from '../databases/src/client/core/interceptors';
