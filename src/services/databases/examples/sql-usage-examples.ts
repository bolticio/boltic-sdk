import { BolticClient } from '../src';
import { StreamingUtils } from '../src/utils/streaming/async-iterable';

// Initialize the Boltic client
const client = new BolticClient('your-api-key', {
  environment: 'prod',
  region: 'asia-south1',
});

/**
 * Example 1: Basic Text-to-SQL Conversion
 */
async function basicTextToSQL() {
  console.log('=== Basic Text-to-SQL Conversion ===');

  const sqlStream = await client.sql.textToSQL(
    'Find all customers who made purchases last month'
  );

  // Collect all chunks
  const sqlQuery = await StreamingUtils.collectAll(sqlStream);
  console.log('Generated SQL:', sqlQuery);
}

/**
 * Example 2: Text-to-SQL with Query Refinement
 */
async function textToSQLWithRefinement() {
  console.log('=== Text-to-SQL with Query Refinement ===');

  const refinedStream = await client.sql.textToSQL(
    'Add sorting by purchase amount',
    {
      currentQuery:
        "SELECT * FROM customers WHERE purchase_date > '2024-01-01'",
    }
  );

  // Process streaming results in real-time
  let partialQuery = '';
  for await (const chunk of refinedStream) {
    partialQuery += chunk;
    console.log('Partial SQL:', partialQuery);
  }
}

/**
 * Example 3: SQL Query Execution
 */
async function executeSQLQuery() {
  console.log('=== SQL Query Execution ===');

  const result = await client.sql.executeSQL(
    'SELECT name, email FROM users WHERE active = true'
  );

  console.log('Query Results:');
  // Extract data from Boltic API Response Structure
  const [resultRows, metadata] = result.data;
  console.log('Data:', resultRows);

  // Extract count from metadata
  let count: number;
  if (typeof metadata === 'number') {
    count = metadata;
  } else if (metadata && typeof metadata === 'object' && 'count' in metadata) {
    count = (metadata as any).count;
  } else {
    count = resultRows?.length || 0;
  }
  console.log('Row count:', count);
  console.log('Metadata:', metadata);

  if (result.pagination) {
    console.log('Total count:', result.pagination.total_count);
  }
}

/**
 * Example 4: Execute Multiple Queries
 */
async function executeMultipleQueries() {
  console.log('=== Execute Multiple Queries ===');

  const result = await client.sql.executeSQL(`
    INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
    UPDATE users SET active = true WHERE name = 'John';
    SELECT * FROM users WHERE name = 'John';
  `);

  console.log('Multi-query result:', result.data);
}

/**
 * Example 8: Error Handling
 */
async function handleSQLErrors() {
  console.log('=== Error Handling ===');

  try {
    await client.sql.executeSQL('INVALID SQL QUERY');
  } catch (error: any) {
    if (error.error) {
      console.error('SQL execution failed:', error.error.message);
    } else {
      console.error('SQL execution failed:', (error as Error).message);
    }
  }

  try {
    await client.sql.textToSQL('');
  } catch (error: any) {
    if (error.error) {
      console.error('Text-to-SQL failed:', error.error.message);
    } else {
      console.error('Text-to-SQL failed:', (error as Error).message);
    }
  }
}

/**
 * Example 9: Streaming with Custom Processing
 */
async function customStreamingProcessing() {
  console.log('=== Custom Streaming Processing ===');

  const sqlStream = await client.sql.textToSQL(
    'Create a query to find top 10 products by sales'
  );

  // Process chunks with custom logic
  let accumulatedSQL = '';
  for await (const chunk of sqlStream) {
    accumulatedSQL += chunk;

    // Custom processing: log when we encounter certain keywords
    if (chunk.toLowerCase().includes('select')) {
      console.log('Found SELECT keyword in chunk:', chunk);
    }

    if (chunk.toLowerCase().includes('from')) {
      console.log('Found FROM keyword in chunk:', chunk);
    }
  }

  console.log('Final SQL:', accumulatedSQL);
}

/**
 * Run all examples
 */
export async function runSQLExamples() {
  console.log('🚀 Running SQL Module Examples...\n');

  try {
    await basicTextToSQL();
    console.log('\n' + '='.repeat(50) + '\n');

    await textToSQLWithRefinement();
    console.log('\n' + '='.repeat(50) + '\n');

    await executeSQLQuery();
    console.log('\n' + '='.repeat(50) + '\n');

    await executeMultipleQueries();
    console.log('\n' + '='.repeat(50) + '\n');

    await handleSQLErrors();
    console.log('\n' + '='.repeat(50) + '\n');

    await customStreamingProcessing();

    console.log('\n✅ All SQL examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Export the examples for use in other files
export {
  basicTextToSQL,
  customStreamingProcessing,
  executeMultipleQueries,
  executeSQLQuery,
  handleSQLErrors,
  textToSQLWithRefinement,
};
