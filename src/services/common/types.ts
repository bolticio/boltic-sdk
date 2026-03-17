/**
 * Common types shared across all SDK modules.
 *
 * - Environment / Region config and URL resolution
 * - Auth config types
 * - Response wrappers and type guards
 */

// Environment & region config
export type {
  Region,
  Environment,
  EnvironmentConfig,
  RegionHostConfig,
} from '../databases/src/types/config/environment';
export {
  REGION_CONFIGS,
  ENV_CONFIGS,
  REGION_BASE_HOSTS,
  resolveServiceURL,
} from '../databases/src/types/config/environment';

// Auth config
export type {
  AuthConfig,
  AuthHeaders,
  TokenInfo,
} from '../databases/src/types/config/auth';

// Response wrappers
export type {
  BolticSuccessResponse,
  BolticListResponse,
  BolticErrorResponse,
  ApiResponse,
  QueryOptions,
} from '../databases/src/types/common/responses';
export {
  isErrorResponse,
  isListResponse,
} from '../databases/src/types/common/responses';

// Pagination
export type { PaginationInfo } from '../databases/src/types/common/operations';
