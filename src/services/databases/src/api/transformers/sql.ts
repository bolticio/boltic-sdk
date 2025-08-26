import { TextToSQLApiRequest } from '../../types/api/sql';
import { TextToSQLOptions } from '../../types/sql';

/**
 * Transform SDK text-to-SQL options to API request
 */
export function transformTextToSQLRequest(
  prompt: string,
  options: TextToSQLOptions = {}
): TextToSQLApiRequest {
  return {
    prompt,
    current_query: options.currentQuery,
  };
}
