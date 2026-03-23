/**
 * Serverless API endpoint definitions.
 * Paths use `{param}` placeholders resolved at request time.
 */

import type { ServerlessApiEndpoint } from '../../types/serverless';

export interface ServerlessEndpoints {
  list: ServerlessApiEndpoint;
  get: ServerlessApiEndpoint;
  create: ServerlessApiEndpoint;
  update: ServerlessApiEndpoint;
  getBuilds: ServerlessApiEndpoint;
  getLogs: ServerlessApiEndpoint;
  getBuildLogs: ServerlessApiEndpoint;
}

export const SERVERLESS_ENDPOINTS: ServerlessEndpoints = {
  list: {
    path: '/apps',
    method: 'GET',
    authenticated: true,
  },
  get: {
    path: '/apps/{app_id}',
    method: 'GET',
    authenticated: true,
  },
  create: {
    path: '/apps',
    method: 'POST',
    authenticated: true,
  },
  update: {
    path: '/apps/{app_id}',
    method: 'PUT',
    authenticated: true,
  },
  getBuilds: {
    path: '/apps/{app_id}/builds',
    method: 'GET',
    authenticated: true,
  },
  getLogs: {
    path: '/apps/{app_id}/logs',
    method: 'GET',
    authenticated: true,
  },
  getBuildLogs: {
    path: '/apps/{app_id}/builds/{build_id}/logs',
    method: 'GET',
    authenticated: true,
  },
};

/** Resolve `{param}` placeholders in an endpoint path */
export function buildServerlessEndpointPath(
  endpoint: ServerlessApiEndpoint,
  params: Record<string, string> = {}
): string {
  let path = endpoint.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }
  return path;
}
