import {
  Environment,
  EnvironmentConfig,
  Region,
  REGION_CONFIGS,
} from '../../types/config/environment';

export interface ClientConfig extends EnvironmentConfig {
  apiKey: string;
  environment: Environment;
  region: Region;
  headers?: Record<string, string>;
  retryAttempts: number;
  retryDelay: number;
  maxRetries: number;
}

export class ConfigManager {
  private config: ClientConfig;

  constructor(
    apiKey: string,
    environment: Environment = 'prod',
    region: Region = 'asia-south1',
    overrides?: Partial<
      EnvironmentConfig & {
        retryAttempts?: number;
        retryDelay?: number;
        maxRetries?: number;
        headers?: Record<string, string>;
      }
    >
  ) {
    const envConfig = REGION_CONFIGS[region][environment];
    this.config = {
      apiKey,
      environment,
      region,
      retryAttempts: 3,
      retryDelay: 1000,
      maxRetries: 3,
      debug: false,
      headers: {},
      ...envConfig,
      ...overrides,
    };
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Security methods to prevent API key exposure
  toString(): string {
    return `ConfigManager { environment: "${this.config.environment}", region: "${this.config.region}", debug: ${this.config.debug} }`;
  }

  toJSON(): object {
    const safeConfig = { ...this.config };
    delete (safeConfig as Record<string, unknown>).apiKey;
    return safeConfig;
  }

  // Custom inspect method for Node.js console logging
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}
