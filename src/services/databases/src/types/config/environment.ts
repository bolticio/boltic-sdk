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
      baseURL: 'https://asia-south1.api.fcz0.de/service/sdk/boltic-tables',
      timeout: 15000,
    },
    uat: {
      baseURL: 'https://asia-south1.api.uat.fcz0.de/service/sdk/boltic-tables',
      timeout: 15000,
    },
    prod: {
      baseURL: 'https://asia-south1.api.boltic.io/service/sdk/boltic-tables',
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
      baseURL: 'https://us-central1.api.fcz0.de/service/sdk/boltic-tables',
      timeout: 15000,
    },
    uat: {
      baseURL: 'https://us-central1.api.uat.fcz0.de/service/sdk/boltic-tables',
      timeout: 15000,
    },
    prod: {
      baseURL: 'https://us-central1.api.boltic.io/service/sdk/boltic-tables',
      timeout: 10000,
    },
  },
};

// Legacy support - default to asia-south1
export const ENV_CONFIGS: Record<Environment, EnvironmentConfig> =
  REGION_CONFIGS['asia-south1'];

// ---------------------------------------------------------------------------
// Host-only configs (service-path agnostic) for use by BaseApiClient
// ---------------------------------------------------------------------------

export interface RegionHostConfig {
  host: string;
  timeout: number;
  debug?: boolean;
}

export const REGION_BASE_HOSTS: Record<
  Region,
  Record<Environment, RegionHostConfig>
> = {
  'asia-south1': {
    local: { host: 'http://localhost:8000', timeout: 30000, debug: true },
    sit: { host: 'https://asia-south1.api.fcz0.de', timeout: 15000 },
    uat: { host: 'https://asia-south1.api.uat.fcz0.de', timeout: 15000 },
    prod: { host: 'https://asia-south1.api.boltic.io', timeout: 10000 },
  },
  'us-central1': {
    local: { host: 'http://localhost:8000', timeout: 30000, debug: true },
    sit: { host: 'https://us-central1.api.fcz0.de', timeout: 15000 },
    uat: { host: 'https://us-central1.api.uat.fcz0.de', timeout: 15000 },
    prod: { host: 'https://us-central1.api.boltic.io', timeout: 10000 },
  },
};

/**
 * Resolve a full service URL from region, environment, and service path.
 *
 * @param region - Target region (e.g. "asia-south1")
 * @param environment - Target environment (e.g. "prod")
 * @param servicePath - Service-specific path including version (e.g. "/service/sdk/boltic-tables/v1")
 * @returns Fully resolved URL like "https://asia-south1.api.boltic.io/service/sdk/boltic-tables/v1"
 */
export function resolveServiceURL(
  region: Region,
  environment: Environment,
  servicePath: string
): string {
  const regionConfig = REGION_BASE_HOSTS[region];
  if (!regionConfig) {
    throw new Error(`Unsupported region: ${region}`);
  }

  const envConfig = regionConfig[environment];
  if (!envConfig) {
    throw new Error(
      `Unsupported environment: ${environment} for region: ${region}`
    );
  }

  return `${envConfig.host}${servicePath}`;
}
