/** Default backend storage driver (GCS). */
export const DEFAULT_STORAGE_TYPE = 'gcs' as const;

/**
 * `expire_in` for upload temporary read URLs is **minutes**.
 * Backend caps TTL to 7 days.
 */
export const MAX_SIGNED_URL_EXPIRE_MINUTES = 7 * 24 * 60;
