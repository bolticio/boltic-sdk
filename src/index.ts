// Main SDK exports - Boltic SDK for databases
export * from './auth';
export * from './errors';

// Export databases module - Primary functionality
export * from './databases';

// Version information
export const VERSION = '1.0.0';

// Main convenience exports for databases client
export { createClient } from './databases';
export type { BolticClient, ClientOptions } from './databases';
