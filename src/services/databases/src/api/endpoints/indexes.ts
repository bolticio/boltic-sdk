export interface IndexApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface IndexEndpoints {
  create: IndexApiEndpoint;
  list: IndexApiEndpoint;
  delete: IndexApiEndpoint;
}

export const INDEX_ENDPOINTS: IndexEndpoints = {
  create: {
    path: '/tables/indexes/{table_id}',
    method: 'POST',
    authenticated: true,
  },
  list: {
    path: '/tables/indexes/{table_id}/list',
    method: 'POST',
    authenticated: true,
  },
  delete: {
    path: '/tables/indexes/{table_id}',
    method: 'DELETE',
    authenticated: true,
  },
};

export const buildIndexEndpointPath = (
  endpoint: IndexApiEndpoint,
  params: Record<string, string> = {}
): string => {
  let path = endpoint.path;

  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  });

  const unreplacedParams = path.match(/\{([^}]+)\}/g);
  if (unreplacedParams) {
    throw new Error(`Missing path parameters: ${unreplacedParams.join(', ')}`);
  }

  return path;
};
