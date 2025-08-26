export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface SqlEndpoints {
  textToSQL: ApiEndpoint;
  executeSQL: ApiEndpoint;
}

export const SQL_ENDPOINTS: SqlEndpoints = {
  textToSQL: {
    path: '/tables/query/text-to-sql',
    method: 'POST',
    authenticated: true,
    rateLimit: { requests: 100, window: 60000 }, // Limited due to AI processing
  },
  executeSQL: {
    path: '/tables/query/execute',
    method: 'POST',
    authenticated: true,
    rateLimit: { requests: 200, window: 60000 },
  },
};

/**
 * Build SQL endpoint path - all SQL endpoints are simple paths without parameters
 */
export const buildSqlEndpointPath = (
  endpoint: ApiEndpoint,
  params: Record<string, string> = {}
): string => {
  let path = endpoint.path;

  // Replace path parameters if any (though SQL endpoints don't currently use them)
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  });

  return path;
};
