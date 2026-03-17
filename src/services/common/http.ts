/**
 * Common HTTP adapter infrastructure shared across all SDK modules.
 * Source: databases/src/utils/http
 */
export type {
  HttpAdapter,
  HttpRequestConfig,
  HttpResponse,
} from '../databases/src/utils/http/adapter';
export { createHttpAdapter } from '../databases/src/utils/http/client-factory';
