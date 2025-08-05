export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
  cached?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface TableEndpoints {
  list: ApiEndpoint;
  create: ApiEndpoint;
  get: ApiEndpoint;
  update: ApiEndpoint;
  delete: ApiEndpoint;
  generateSchema: ApiEndpoint;
  getCurrencies: ApiEndpoint;
}

export const TABLE_ENDPOINTS: TableEndpoints = {
  list: {
    path: '/tables/list',
    method: 'POST',
    authenticated: true,
    cached: true,
    rateLimit: { requests: 200, window: 60000 },
  },
  create: {
    path: '/tables',
    method: 'POST',
    authenticated: true,
    cached: false,
  },
  get: {
    path: '/tables/{table_id}',
    method: 'GET',
    authenticated: true,
    cached: true,
    rateLimit: { requests: 300, window: 60000 },
  },
  update: {
    path: '/tables/{table_id}',
    method: 'PATCH',
    authenticated: true,
    cached: false,
  },
  delete: {
    path: '/tables/{table_id}',
    method: 'DELETE',
    authenticated: true,
    cached: false,
  },
  generateSchema: {
    path: '/tables/generate-schema',
    method: 'POST',
    authenticated: true,
    cached: false,
  },
  getCurrencies: {
    path: '/tables/currencies',
    method: 'GET',
    authenticated: true,
    cached: true,
    rateLimit: { requests: 100, window: 300000 }, // 5 minute cache
  },
};

export const buildEndpointPath = (
  endpoint: ApiEndpoint,
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
