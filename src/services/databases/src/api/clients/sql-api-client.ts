import {
  ExecuteSQLApiRequest,
  ExecuteSQLApiResponse,
  TextToSQLApiRequest,
  TextToSQLApiResponse,
} from '../../types/api/sql';
import { BolticErrorResponse } from '../../types/common/responses';
import { SQL_ENDPOINTS, buildSqlEndpointPath } from '../endpoints/sql';
import { BaseApiClient, BaseApiClientConfig } from './base-api-client';

export interface SqlApiClientConfig extends BaseApiClientConfig {}

/**
 * SQL API Client - handles all SQL-related API operations
 */
export class SqlApiClient extends BaseApiClient {
  constructor(apiKey: string, config: Omit<SqlApiClientConfig, 'apiKey'> = {}) {
    super(apiKey, config);
  }

  /**
   * Convert natural language to SQL query (streaming)
   */
  async textToSQL(
    request: TextToSQLApiRequest,
    dbId?: string
  ): Promise<AsyncIterable<string> | BolticErrorResponse> {
    try {
      const endpoint = SQL_ENDPOINTS.textToSQL;
      let url = `${this.baseURL}${buildSqlEndpointPath(endpoint)}`;

      if (dbId) {
        url += `?db_id=${encodeURIComponent(dbId)}`;
      }

      // For now, make a regular request and simulate streaming
      // TODO: Implement proper streaming when backend supports it
      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      // Check for error response
      if (response.status >= 400) {
        return this.formatErrorResponse(
          {
            response: { data: response.data, status: response.status },
          },
          'SQL'
        );
      }

      // Convert to AsyncIterable for streaming interface
      const sqlResponse = response.data as TextToSQLApiResponse;
      return this.createAsyncIterable(sqlResponse.data);
    } catch (error) {
      return this.formatErrorResponse(error, 'SQL');
    }
  }

  /**
   * Execute SQL query
   */
  async executeSQL(
    request: ExecuteSQLApiRequest,
    dbId?: string
  ): Promise<ExecuteSQLApiResponse | BolticErrorResponse> {
    try {
      const endpoint = SQL_ENDPOINTS.executeSQL;
      let url = `${this.baseURL}${buildSqlEndpointPath(endpoint)}`;

      if (dbId) {
        url += `?db_id=${encodeURIComponent(dbId)}`;
      }

      const response = await this.httpAdapter.request({
        url,
        method: endpoint.method,
        headers: this.buildHeaders(),
        data: request,
        timeout: this.config.timeout,
      });

      // Check for error response
      if (response.status >= 400) {
        return this.formatErrorResponse(
          {
            response: { data: response.data, status: response.status },
          },
          'SQL'
        );
      }

      // Return raw response without transformation
      return response.data as ExecuteSQLApiResponse;
    } catch (error) {
      return this.formatErrorResponse(error, 'SQL');
    }
  }

  /**
   * Helper method to create AsyncIterable from string data
   * TODO: Replace with proper streaming implementation when backend supports it
   */
  private async *createAsyncIterable(data: string): AsyncIterable<string> {
    // For now, just yield the complete string
    // In the future, this could be replaced with actual streaming chunks
    yield data;
  }
}
