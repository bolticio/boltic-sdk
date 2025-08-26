import { SqlResource } from '../client/resources/sql';
import { TextToSQLOptions } from '../types/sql';
import { StreamingUtils } from '../utils/streaming/async-iterable';

export class SqlTestClient {
  constructor(private sql: SqlResource) {}

  /**
   * Test helper for text-to-SQL conversion
   * Collects all streaming chunks into a single string for easier testing
   */
  async generateSQL(
    prompt: string,
    options?: TextToSQLOptions
  ): Promise<string> {
    const stream = await this.sql.textToSQL(prompt, options);
    return StreamingUtils.collectAll(stream);
  }

  /**
   * Test helper for SQL execution
   */
  async executeSQL(query: string) {
    return this.sql.executeSQL(query);
  }

  /**
   * Utility to simulate streaming text-to-SQL for testing
   */
  async *simulateStreamingSQL(
    fullSQLQuery: string,
    chunkSize = 10,
    delayMs = 50
  ): AsyncIterable<string> {
    for (let i = 0; i < fullSQLQuery.length; i += chunkSize) {
      yield fullSQLQuery.slice(i, i + chunkSize);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
