/** Polling interval in milliseconds between status checks */
export const STATUS_POLLING_INTERVAL_MS = 5000;

/** Maximum number of status polling attempts before timeout */
export const MAX_STATUS_POLLING_ATTEMPTS = 60;

/** Serverless statuses that indicate the function has reached a terminal state */
export const TERMINAL_STATUSES = [
  'running',
  'failed',
  'degraded',
  'suspended',
] as const;

export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

/** Default resource allocation for new serverless functions */
export const DEFAULT_RESOURCES = {
  CPU: 0.1,
  MemoryMB: 128,
  MemoryMaxMB: 128,
} as const;

/** Default scaling configuration for new serverless functions */
export const DEFAULT_SCALING = {
  AutoStop: false,
  Min: 1,
  Max: 1,
  MaxIdleTime: 0,
} as const;
