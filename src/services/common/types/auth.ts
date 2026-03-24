export interface AuthConfig {
  apiKey: string;
  tokenRefreshThreshold?: number;
  maxRetries?: number;
}

export interface AuthHeaders {
  'x-boltic-token': string;
  [key: string]: string;
}

export interface TokenInfo {
  token: string;
  expiresAt?: Date;
  isValid: boolean;
}
