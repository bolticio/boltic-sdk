export interface AuthConfig {
  apiKey: string;
  tokenRefreshThreshold?: number; // seconds before expiry to refresh
  maxRetries?: number;
}

export interface AuthHeaders {
  'x-boltic-token': string;
  'x-boltic-service'?: string;
  [key: string]: string | undefined;
}

export interface TokenInfo {
  token: string;
  expiresAt?: Date;
  isValid: boolean;
}

export interface ServiceAuthConfig extends AuthConfig {
  service: string;
  serviceEndpoint?: string;
}
