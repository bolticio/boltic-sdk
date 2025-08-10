import { createErrorWithContext } from '../../errors';
import { HttpAdapter } from './adapter';
import { AxiosAdapter } from './axios-adapter';
import { FetchAdapter } from './fetch-adapter';

export function createHttpAdapter(): HttpAdapter {
  // Check if fetch is available (browser or Node.js >= 18)
  if (typeof fetch !== 'undefined') {
    return new FetchAdapter();
  }

  // Fallback to axios for older Node.js versions
  try {
    return new AxiosAdapter();
  } catch (error) {
    throw createErrorWithContext(
      'No suitable HTTP adapter found. Please use Node.js >= 18 or install axios: npm install axios',
      { error }
    );
  }
}
