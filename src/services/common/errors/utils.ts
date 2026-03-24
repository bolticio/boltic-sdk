export interface ValidationFailure {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  public readonly failures: ValidationFailure[];

  constructor(message: string, failures: ValidationFailure[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.failures = failures;
  }
}

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

export function createErrorWithContext(
  message: string,
  context?: Record<string, unknown>
): Error {
  const error = new Error(message);
  if (context) {
    (error as Error & { context: Record<string, unknown> }).context = context;
  }
  return error;
}

export function isNetworkError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.name === 'AbortError')
  );
}

export function getHttpStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object') {
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
    if (
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }
  }
  return null;
}

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
