// Main SDK exports - Boltic SDK for databases
export * from './auth';
export * from './errors';

// Export databases module - Primary functionality
export { BolticClient, createClient } from './services/databases/src/client';
export type { ClientOptions, Region } from './services/databases/src/client';

// Version information
export const VERSION = '1.0.0';
