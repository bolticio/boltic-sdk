/**
 * Workflow API endpoint definitions.
 * Paths use `{param}` placeholders resolved at request time.
 */

import type { WorkflowApiEndpoint } from '../../types/workflow';

export interface WorkflowEndpoints {
  executeActivity: WorkflowApiEndpoint;
  getExecutionById: WorkflowApiEndpoint;
  getIntegrations: WorkflowApiEndpoint;
  getCredentials: WorkflowApiEndpoint;
}

export const WORKFLOW_ENDPOINTS: WorkflowEndpoints = {
  executeActivity: {
    path: '/workflows/execute/activity',
    method: 'POST',
    authenticated: true,
  },
  getExecutionById: {
    path: '/workflows/run/{run_id}',
    method: 'GET',
    authenticated: true,
  },
  getIntegrations: {
    path: '/integrations',
    method: 'GET',
    authenticated: true,
  },
  getCredentials: {
    path: '/integrations/entity/{entity}',
    method: 'GET',
    authenticated: true,
  },
};

/** Resolve `{param}` placeholders in an endpoint path */
export function buildWorkflowEndpointPath(
  endpoint: WorkflowApiEndpoint,
  params: Record<string, string> = {}
): string {
  let path = endpoint.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }
  return path;
}
