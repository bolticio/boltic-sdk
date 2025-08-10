import { createErrorWithContext } from '../../errors';
import { AuthConfig, AuthHeaders, TokenInfo } from '../../types/config/auth';

export class AuthManager {
  private config: AuthConfig;
  private tokenInfo: TokenInfo | null = null;

  constructor(config: AuthConfig) {
    this.config = {
      maxRetries: 3,
      ...config,
    };
    this.validateApiKey(config.apiKey);
  }

  private validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw createErrorWithContext(
        'API key is required and must be a non-empty string',
        {
          name: 'AuthenticationError',
          code: 'INVALID_API_KEY',
        }
      );
    }

    // Basic format validation (adjust based on actual key format)
    if (apiKey.length < 10) {
      throw createErrorWithContext(
        'API key appears to be invalid (too short)',
        {
          name: 'AuthenticationError',
          code: 'INVALID_API_KEY_FORMAT',
        }
      );
    }
  }

  getAuthHeaders(): AuthHeaders {
    return {
      'x-boltic-token': this.config.apiKey,
    };
  }

  updateApiKey(newApiKey: string): void {
    this.validateApiKey(newApiKey);
    this.config.apiKey = newApiKey;
    this.tokenInfo = null; // Reset token info
  }

  isAuthenticated(): boolean {
    return !!this.config.apiKey;
  }

  async validateApiKeyAsync(): Promise<boolean> {
    // TODO: Implement actual API key validation endpoint call
    // For now, return basic validation
    try {
      this.validateApiKey(this.config.apiKey);
      return true;
    } catch {
      return false;
    }
  }

  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo ? { ...this.tokenInfo } : null;
  }

  getMaxRetries(): number {
    return this.config.maxRetries || 3;
  }
}
