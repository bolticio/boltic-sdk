import {
  ENV_CONFIGS,
  Environment,
  EnvironmentConfig,
} from '../../types/config/environment';

export interface ClientConfig extends EnvironmentConfig {
  apiKey: string;
  environment: Environment;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ConfigManager {
  private config: ClientConfig;

  constructor(
    apiKey: string,
    environment: Environment = 'prod',
    overrides?: Partial<
      EnvironmentConfig & {
        retryAttempts?: number;
        retryDelay?: number;
        headers?: Record<string, string>;
      }
    >
  ) {
    const envConfig = ENV_CONFIGS[environment];
    this.config = {
      apiKey,
      environment,
      retryAttempts: 3,
      retryDelay: 1000,
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
}
