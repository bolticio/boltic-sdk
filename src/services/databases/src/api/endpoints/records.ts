export interface RecordApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface RecordEndpoints {
  insert: RecordApiEndpoint;
  list: RecordApiEndpoint;
  get: RecordApiEndpoint;
  update: RecordApiEndpoint;
  updateById: RecordApiEndpoint;
  delete: RecordApiEndpoint;
}

export const RECORD_ENDPOINTS: RecordEndpoints = {
  insert: {
    path: '/tables/{table_id}/records',
    method: 'POST',
    authenticated: true,
  },
  list: {
    path: '/tables/{table_id}/records/list',
    method: 'POST',
    authenticated: true,
    rateLimit: { requests: 200, window: 60000 },
  },
  get: {
    path: '/tables/{table_id}/records/{record_id}',
    method: 'GET',
    authenticated: true,
    rateLimit: { requests: 200, window: 60000 },
  },
  update: {
    path: '/tables/{table_id}/records',
    method: 'PATCH',
    authenticated: true,
  },
  updateById: {
    path: '/tables/{table_id}/records/{record_id}',
    method: 'PATCH',
    authenticated: true,
  },

  delete: {
    path: '/tables/{table_id}/records/list',
    method: 'DELETE',
    authenticated: true,
  },
};

export const buildRecordEndpointPath = (
  endpoint: RecordApiEndpoint,
  params: Record<string, string> = {}
): string => {
  let path = endpoint.path;

  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  });

  // Check for unreplaced parameters
  const unreplacedParams = path.match(/\{([^}]+)\}/g);
  if (unreplacedParams) {
    throw new Error(`Missing path parameters: ${unreplacedParams.join(', ')}`);
  }

  return path;
};
