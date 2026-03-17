/** Polling interval in milliseconds between execution status checks */
export const POLLING_INTERVAL_MS = 1000;

/** Maximum number of polling attempts before a timeout error is returned */
export const MAX_POLLING_ATTEMPTS = 30;

/** Default retry configuration applied to every activity execution */
export const DEFAULT_RETRY_CONFIG = {
  maximum_attempts: 1,
  backoff_coefficient: 2,
  initial_interval: 1000,
  maximum_interval: 100000,
} as const;

/** Whether activity execution should continue on failure */
export const CONTINUE_ON_FAILURE = true;
