import { SqlApiClient } from '../../api/clients/sql-api-client';
import { transformTextToSQLRequest } from '../../api/transformers/sql';
import { ExecuteSQLApiResponse } from '../../types/api/sql';
import { isErrorResponse } from '../../types/common/responses';
import { TextToSQLOptions } from '../../types/sql';
import { BaseClient } from '../core/base-client';

export class SqlResource {
  private sqlApiClient: SqlApiClient;

  constructor(client: BaseClient) {
    // Initialize the SQL API client with the client's configuration
    const config = client.getConfig();
    this.sqlApiClient = new SqlApiClient(config.apiKey, {
      environment: config.environment,
      region: config.region,
      timeout: config.timeout,
      debug: config.debug,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });
  }

  /**
   * Convert natural language to SQL query
   * Returns streaming results for real-time query generation
   *
   * @param prompt - Natural language description of the desired query
   * @param options - Optional parameters including currentQuery for refinement
   * @returns AsyncIterable<string> for streaming SQL generation
   *
   */
  async textToSQL(
    prompt: string,
    options: TextToSQLOptions = {},
    dbId?: string
  ): Promise<AsyncIterable<string>> {
    const request = transformTextToSQLRequest(prompt, options);
    const response = await this.sqlApiClient.textToSQL(request, dbId);

    // Check if response is an error by checking for the error property
    if ('error' in response && response.error !== undefined) {
      throw response; // Throw the API response directly
    }

    return response as AsyncIterable<string>;
  }

  /**
   * Execute SQL query with built-in safety measures and performance optimization
   *
   * @param query - SQL query string to execute
   * @returns Promise<ExecuteSQLApiResponse> with raw API response following Boltic API Response Structure
   *
   */
  async executeSQL(
    query: string,
    dbId?: string
  ): Promise<
    | ExecuteSQLApiResponse
    | import('../../types/common/responses').BolticErrorResponse
  > {
    const response = await this.sqlApiClient.executeSQL({ query }, dbId);

    if (isErrorResponse(response)) {
      return response; // Return error response for caller to handle
    }

    return response; // Return raw API response following Boltic API Response Structure
  }
}
