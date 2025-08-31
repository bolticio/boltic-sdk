// Text-to-SQL API Types
export interface TextToSQLApiRequest {
  prompt: string;
  current_query?: string;
}

export interface TextToSQLApiResponse {
  data: string;
}

// Execute SQL API Types
export interface ExecuteSQLApiRequest {
  query: string;
}

export interface ExecuteSQLApiResponse {
  data: [
    Record<string, unknown>[], // Query result rows
    unknown, // Can be anything: number, object, list, etc. depending on SQL operation
  ];
  pagination?: {
    total_count: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    type: string;
  };
  message?: string; // Optional message following Boltic API Response Structure
}
