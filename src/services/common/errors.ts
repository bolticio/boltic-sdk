/**
 * Common error utilities shared across all SDK modules.
 * Source: databases/src/errors
 */
export {
  ValidationError,
  ApiError,
  createErrorWithContext,
  isNetworkError,
  getHttpStatusCode,
  formatError,
} from '../databases/src/errors';
export type { ValidationFailure } from '../databases/src/errors';
