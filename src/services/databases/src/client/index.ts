import { BolticClient, ClientOptions } from './boltic-client';

export function createClient(
  apiKey: string,
  options: ClientOptions = {}
): BolticClient {
  return new BolticClient(apiKey, options);
}

export type { Region } from '../../../common';
export {
  AuthManager,
  BaseClient,
  BaseResource,
  ConfigManager,
} from '../../../common';
export type { ClientConfig } from '../../../common';
export * from './resources/database';
export * from './resources/record';
export * from './resources/record-builder';
export * from './resources/table';
export {
  createTableBuilder,
  TableBuilder,
  type TableBuilderOptions,
} from './resources/table-builder';
export { BolticClient };
export type { ClientOptions };
