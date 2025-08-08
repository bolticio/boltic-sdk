// Utility exports
// This module provides utility functions for the SDK

export const UTILS_VERSION = '1.0.0';

// Common utility functions that may be useful for SDK users
export function isValidApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}

export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
