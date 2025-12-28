/**
 * Database Management API Endpoints
 * Based on DATABASE_MANAGEMENT_API_CONTRACT.md
 */

import { DatabaseApiEndpoint } from '../../types/api/database';

export interface DatabaseEndpoints {
  create: DatabaseApiEndpoint;
  list: DatabaseApiEndpoint;
  update: DatabaseApiEndpoint;
  delete: DatabaseApiEndpoint;
  listJobs: DatabaseApiEndpoint;
  pollDeleteStatus: DatabaseApiEndpoint;
}

/**
 * Database API endpoints configuration
 * Base path: /v1/tables/databases
 */
export const DATABASE_ENDPOINTS: DatabaseEndpoints = {
  create: {
    path: '/tables/databases',
    method: 'POST',
    authenticated: true,
  },
  list: {
    path: '/tables/databases/list',
    method: 'POST',
    authenticated: true,
  },
  update: {
    path: '/tables/databases/{db_id}',
    method: 'PATCH',
    authenticated: true,
  },
  delete: {
    path: '/tables/databases/{db_id}',
    method: 'DELETE',
    authenticated: true,
  },
  listJobs: {
    path: '/tables/databases/jobs/list',
    method: 'POST',
    authenticated: true,
  },
  pollDeleteStatus: {
    path: '/tables/databases/delete-status/{job_id}',
    method: 'GET',
    authenticated: true,
  },
};

/**
 * Build endpoint path with parameters
 */
export const buildDatabaseEndpointPath = (
  endpoint: DatabaseApiEndpoint,
  params: Record<string, string> = {}
): string => {
  let path = endpoint.path;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, value);
  });

  return path;
};
