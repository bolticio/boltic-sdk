import { BolticClient, ClientOptions } from './boltic-client';

export function createClient(
  apiKey: string,
  options: ClientOptions = {}
): BolticClient {
  return new BolticClient(apiKey, options);
}

export * from './core/auth-manager';
export * from './core/base-client';
export * from './core/base-resource';
export * from './core/config';
export { BolticClient };
export type { ClientOptions };
