export type Region = 'asia-south1' | 'us-central1';
export type Environment = 'local' | 'sit' | 'uat' | 'prod';

export interface EnvironmentConfig {
  baseURL: string;
  timeout: number;
  retryAttempts?: number;
  debug?: boolean;
}

export const REGION_CONFIGS: Record<
  Region,
  Record<Environment, EnvironmentConfig>
> = {
  'asia-south1': {
    local: {
      baseURL: 'http://localhost:8000',
      timeout: 30000,
      debug: true,
    },
    sit: {
      baseURL: 'https://asia-south1.api.fcz0.de/service/panel/boltic-tables',
      timeout: 15000,
    },
    uat: {
      baseURL:
        'https://asia-south1.api.uat.fcz0.de/service/panel/boltic-tables',
      timeout: 15000,
    },
    prod: {
      baseURL: 'https://asia-south1.api.boltic.io/service/panel/boltic-tables',
      timeout: 10000,
    },
  },
  'us-central1': {
    local: {
      baseURL: 'http://localhost:8000',
      timeout: 30000,
      debug: true,
    },
    sit: {
      baseURL: 'https://us-central1.api.fcz0.de/service/panel/boltic-tables',
      timeout: 15000,
    },
    uat: {
      baseURL:
        'https://us-central1.api.uat.fcz0.de/service/panel/boltic-tables',
      timeout: 15000,
    },
    prod: {
      baseURL: 'https://us-central1.api.boltic.io/service/panel/boltic-tables',
      timeout: 10000,
    },
  },
};

// Legacy support - default to asia-south1
export const ENV_CONFIGS: Record<Environment, EnvironmentConfig> =
  REGION_CONFIGS['asia-south1'];
