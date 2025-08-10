/**
 * Utility functions for working with standard Error classes
 */

export interface ValidationFailure {
  field: string;
  message: string;
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends Error {
  public readonly failures: ValidationFailure[];

  constructor(message: string, failures: ValidationFailure[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.failures = failures;
  }
}

/**
 * API error for HTTP/API related failures
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Creates a structured error object with additional context
 */
export function createErrorWithContext(
  message: string,
  context?: Record<string, unknown>
): Error {
  const error = new Error(message);
  if (context) {
    // Add context as a property for debugging
    (error as Error & { context: Record<string, unknown> }).context = context;
  }
  return error;
}

/**
 * Checks if an error is a network/HTTP related error
 */
export function isNetworkError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.name === 'AbortError')
  );
}

/**
 * Extracts HTTP status code from axios or fetch errors
 */
export function getHttpStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object') {
    // Axios error structure
    if (
      'response' in error &&
      error.response &&
      typeof error.response === 'object'
    ) {
      const response = error.response as { status?: unknown };
      if ('status' in response && typeof response.status === 'number') {
        return response.status;
      }
    }
    // Fetch Response error
    if (
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }
  }
  return null;
}

/**
 * Formats error for logging/debugging
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    const context = (error as Error & { context?: Record<string, unknown> })
      .context;
    const statusCode = getHttpStatusCode(error);

    let formatted = `${error.name}: ${error.message}`;

    if (statusCode) {
      formatted += ` (HTTP ${statusCode})`;
    }

    if (context) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return formatted;
  }

  return String(error);
}
