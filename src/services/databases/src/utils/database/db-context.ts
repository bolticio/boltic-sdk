/**
 * Database context utilities
 * Helps manage database selection across API calls
 */

/**
 * Adds db_id query parameter to a URL if provided
 * If db_id is undefined or empty string, the default database will be used by the API
 *
 * @param url - Base URL
 * @param dbId - Database ID (optional)
 * @returns URL with db_id query parameter if applicable
 */
export function addDbIdToUrl(url: string, dbId?: string): string {
  // If dbId is not provided or is empty string, return original URL (API will use default DB)
  if (!dbId || dbId === '') {
    return url;
  }

  // Check if URL already has query parameters
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}db_id=${encodeURIComponent(dbId)}`;
}

/**
 * Extracts db_id from options and returns both the db_id and remaining options
 * This is a helper to cleanly extract db_id from method options
 *
 * @param options - Options object that may contain db_id
 * @returns Tuple of [db_id, remaining options]
 */
export function extractDbId<T extends { db_id?: string }>(
  options?: T
): [string | undefined, Omit<T, 'db_id'>] {
  if (!options) {
    return [undefined, {} as Omit<T, 'db_id'>];
  }

  const { db_id, ...rest } = options;
  return [db_id, rest as Omit<T, 'db_id'>];
}
