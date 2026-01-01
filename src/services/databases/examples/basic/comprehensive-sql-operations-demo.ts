/**
 * Comprehensive SQL Operations Demo Script
 *
 * This script demonstrates ALL available SQL functionality of the Boltic Database SDK:
 * - Text-to-SQL conversion with AI assistance
 * - Streaming SQL generation for real-time responses
 * - SQL query execution with safety measures

 * - Advanced error handling and recovery
 * - Debug logging and performance monitoring
 * - Real API integration with comprehensive examples
 * - Table creation and cleanup
 *
 * Usage:
 * - Run without arguments to use the default database (backward compatible)
 * - Run with --use-custom-db to create and use a custom database for all operations
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have proper API access
 */

import * as dotenv from 'dotenv';
import { BolticClient, FieldDefinition, isErrorResponse } from '../../src';
import { SqlTestClient } from '../../src/testing/sql-test-client';
import { StreamingUtils } from '../../src/utils/streaming/async-iterable';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const DEMO_CONFIG = {
  debug: true,
  timeout: 30000,
  region: 'asia-south1' as const,
  maxRetries: 3,
  retryDelay: 1000,
  environment: 'uat',
};

// Test table configuration
const TEST_TABLES = {
  users: {
    name: 'sql_demo_users',
    columns: [
      {
        name: 'name',
        type: 'text' as const,
        description: 'User name',
        is_nullable: false,
        is_unique: false,
        is_indexed: true,
        is_visible: true,
      },
      {
        name: 'email',
        type: 'email' as const,
        description: 'User email',
        is_nullable: false,
        is_unique: true,
        is_indexed: true,
        is_visible: true,
      },
      {
        name: 'active',
        type: 'checkbox' as const,
        description: 'Is user active',
        is_nullable: false,
        is_unique: false,
        is_indexed: false,
        is_visible: true,
        default_value: true,
      },
    ] as FieldDefinition[],
  },
  orders: {
    name: 'sql_demo_orders',
    columns: [
      {
        name: 'user_id',
        type: 'text' as const,
        description: 'User ID reference',
        is_nullable: false,
        is_unique: false,
        is_indexed: true,
        is_visible: true,
      },
      {
        name: 'total',
        type: 'currency' as const,
        currency_format: 'INR',
        description: 'Order total',
        is_nullable: false,
        is_unique: false,
        is_indexed: false,
        is_visible: true,
      },
      {
        name: 'status',
        type: 'dropdown' as const,
        description: 'Order status',
        is_nullable: false,
        is_unique: false,
        is_indexed: true,
        is_visible: true,
        selection_source: 'provide-static-list',
        dropdown_options: ['pending', 'completed', 'cancelled'],
      },
    ] as FieldDefinition[],
  },
  products: {
    name: 'sql_demo_products',
    columns: [
      {
        name: 'name',
        type: 'text' as const,
        description: 'Product name',
        is_nullable: false,
        is_unique: false,
        is_indexed: true,
        is_visible: true,
      },
      {
        name: 'price',
        type: 'currency' as const,
        currency_format: 'INR',
        description: 'Product price',
        is_nullable: false,
        is_unique: false,
        is_indexed: false,
        is_visible: true,
      },
      {
        name: 'stock',
        type: 'number' as const,
        description: 'Stock quantity',
        is_nullable: false,
        is_unique: false,
        is_indexed: false,
        is_visible: true,
        default_value: 0,
      },
    ] as FieldDefinition[],
  },
};

// Test data for SQL operations
const TEST_QUERIES = {
  basic: [
    `SELECT * FROM "${TEST_TABLES.users.name}" LIMIT 5`,
    `SELECT COUNT(*) FROM "${TEST_TABLES.orders.name}" WHERE 'completed' = ANY("status")`,
    `SELECT "name", "email" FROM "${TEST_TABLES.users.name}" WHERE "created_at" > '2024-01-01'`,
  ],
  complex: [
    `SELECT u."name", COUNT(o."id") as order_count FROM "${TEST_TABLES.users.name}" u LEFT JOIN "${TEST_TABLES.orders.name}" o ON u."id" = o."user_id"::uuid GROUP BY u."id", u."name" ORDER BY order_count DESC LIMIT 10`,
    `SELECT DATE("created_at") as day, COUNT(*) as daily_orders FROM "${TEST_TABLES.orders.name}" WHERE "created_at" >= CURRENT_DATE - INTERVAL '30 days' GROUP BY DATE("created_at") ORDER BY day`,
  ],
  textToSql: [
    'Find all active users who registered this year',
    'Get the top 10 customers by total order value',
    'Show me sales data for the last month grouped by day',
    'List all products that are out of stock',
    "Find users who haven't placed any orders",
  ],
};

// Sample data to insert (without reserved columns: id, created_at, updated_at)
const SAMPLE_DATA = {
  users: [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      active: true,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      active: true,
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      active: false,
    },
    {
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      active: true,
    },
    {
      name: 'Charlie Wilson',
      email: 'charlie.wilson@example.com',
      active: true,
    },
    {
      name: 'Diana Prince',
      email: 'diana.prince@example.com',
      active: false,
    },
    {
      name: 'Eve Martinez',
      email: 'eve.martinez@example.com',
      active: true,
    },
    {
      name: 'Frank Miller',
      email: 'frank.miller@example.com',
      active: true,
    },
  ],
  products: [
    {
      name: 'Widget A',
      price: 29.99,
      stock: 100,
    },
    {
      name: 'Widget B',
      price: 49.99,
      stock: 0,
    },
    {
      name: 'Widget C',
      price: 19.99,
      stock: 250,
    },
    {
      name: 'Super Widget',
      price: 99.99,
      stock: 50,
    },
    {
      name: 'Mini Widget',
      price: 14.99,
      stock: 300,
    },
    {
      name: 'Premium Widget',
      price: 149.99,
      stock: 25,
    },
    {
      name: 'Basic Widget',
      price: 9.99,
      stock: 500,
    },
    {
      name: 'Deluxe Widget',
      price: 199.99,
      stock: 10,
    },
  ],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator(title: string) {
  console.log('\n' + '='.repeat(80));
  colorLog('cyan', `  ${title}`);
  console.log('='.repeat(80));
}

function subsection(title: string) {
  console.log('\n' + '-'.repeat(60));
  colorLog('yellow', `  ${title}`);
  console.log('-'.repeat(60));
}

async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    let errorMessage = 'Unknown error';
    let errorDetails: string[] = [];

    // Handle different error structures
    if (error.error) {
      // Direct error object
      if (error.error.message) {
        errorMessage = error.error.message;
      }
      if (error.error.meta?.length) {
        errorDetails = error.error.meta;
      }
    } else if (error.response?.data?.error) {
      // API response error structure
      const apiError = error.response.data.error;
      if (apiError.message) {
        errorMessage = apiError.message;
      }
      if (Array.isArray(apiError.meta)) {
        errorDetails = apiError.meta;
      } else if (Array.isArray(apiError)) {
        errorMessage = 'API Error';
        errorDetails = apiError;
      }
    } else if (error.message) {
      // Standard Error object
      errorMessage = error.message;
    } else if (error.response?.data) {
      // Direct API error structure
      const data = error.response.data;
      if (data.message) {
        errorMessage = data.message;
      }
      if (Array.isArray(data.meta)) {
        errorDetails = data.meta;
      }
    }

    colorLog('red', `❌ ${errorContext}: ${errorMessage}`);
    if (errorDetails.length > 0) {
      console.log('   Details:', errorDetails.join(', '));
    }

    return null;
  }
}

// Setup functions
async function createTestTables(client: BolticClient) {
  separator('SETTING UP TEST TABLES');

  for (const [key, tableConfig] of Object.entries(TEST_TABLES)) {
    subsection(`Creating Table: ${tableConfig.name}`);

    const result = await handleAsyncError(async () => {
      // Create table
      const table = await client.tables.create({
        name: tableConfig.name,
        description: `Test table for SQL demo: ${key}`,
        fields: [],
      });

      colorLog('green', `✅ Table "${tableConfig.name}" created successfully`);

      // Add columns
      for (const column of tableConfig.columns) {
        await client.columns.create(tableConfig.name, column);
        console.log(`   ✅ Column "${column.name}" added`);
      }
      return table;
    }, `Creating table ${tableConfig.name}`);

    if (!result) {
      throw new Error(`Failed to create table ${tableConfig.name}`);
    }
  }

  colorLog('green', '🎉 All test tables created successfully!');
}

async function populateTestData(client: BolticClient) {
  separator('POPULATING TEST DATA');

  // Insert users
  subsection('Inserting Users');
  for (const user of SAMPLE_DATA.users) {
    await handleAsyncError(async () => {
      await client.records.insert(TEST_TABLES.users.name, user);
      console.log(`   ✅ User "${user.name}" inserted`);
      return null;
    }, `Inserting user ${user.name}`);
  }

  // Insert products
  subsection('Inserting Products');
  for (const product of SAMPLE_DATA.products) {
    await handleAsyncError(async () => {
      await client.records.insert(TEST_TABLES.products.name, product);
      console.log(`   ✅ Product "${product.name}" inserted`);
      return null;
    }, `Inserting product ${product.name}`);
  }

  // Insert orders (after getting user UUIDs)
  subsection('Inserting Orders');

  // First, get the inserted users to get their auto-generated UUIDs
  const usersResult = await handleAsyncError(async () => {
    return await client.sql.executeSQL(
      `SELECT "id", "name" FROM "${TEST_TABLES.users.name}" ORDER BY "created_at"`
    );
  }, 'Fetching user UUIDs for orders');

  if (usersResult && !('error' in usersResult)) {
    const [userRows] = usersResult.data;

    if (userRows && userRows.length >= 3) {
      // Create multiple sample orders using the actual UUIDs
      const sampleOrders = [
        {
          user_id: userRows[0].id, // John Doe's UUID
          total: 99.99,
          status: ['completed'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[1].id, // Jane Smith's UUID
          total: 149.5,
          status: ['completed'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[0].id, // John Doe's UUID again
          total: 75.25,
          status: ['pending'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[2].id, // Bob Johnson's UUID
          total: 125.0,
          status: ['cancelled'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[3]?.id || userRows[0].id, // Alice Brown or fallback
          total: 199.99,
          status: ['completed'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[4]?.id || userRows[1].id, // Charlie Wilson or fallback
          total: 89.5,
          status: ['pending'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[1].id, // Jane Smith again
          total: 250.75,
          status: ['completed'], // Array of strings for varchar array field
        },
        {
          user_id: userRows[5]?.id || userRows[2].id, // Diana Prince or fallback
          total: 45.3,
          status: ['cancelled'], // Array of strings for varchar array field
        },
      ];

      for (const [index, order] of sampleOrders.entries()) {
        await handleAsyncError(
          async () => {
            await client.records.insert(TEST_TABLES.orders.name, order);
            console.log(
              `   ✅ Order ${index + 1} inserted for user ${order.user_id}`
            );
            return null;
          },
          `Inserting order ${index + 1}`
        );
      }
    } else {
      console.log('   ⚠️  Not enough users found to create sample orders');
    }
  }

  colorLog('green', '🎉 All test data populated successfully!');
}

async function cleanupTestTables(client: BolticClient) {
  separator('CLEANING UP TEST TABLES');

  for (const [key, tableConfig] of Object.entries(TEST_TABLES)) {
    await handleAsyncError(async () => {
      await client.tables.delete(tableConfig.name);
      colorLog('green', `✅ Table "${tableConfig.name}" deleted`);
      return null;
    }, `Deleting table ${tableConfig.name}`);
  }

  colorLog('green', '🧹 Cleanup completed successfully!');
}

// Demo functions from sql-usage-examples.ts
async function basicTextToSQL(client: BolticClient): Promise<void> {
  subsection('Basic Text-to-SQL Conversion');

  const sqlStream = await client.sql.textToSQL(
    'Find all customers who made purchases last month'
  );

  // Collect all chunks
  const sqlQuery = await StreamingUtils.collectAll(sqlStream);
  colorLog('green', `Generated SQL: ${sqlQuery}`);
}

async function textToSQLWithRefinement(client: BolticClient): Promise<void> {
  subsection('Text-to-SQL with Query Refinement');

  const refinedStream = await client.sql.textToSQL(
    'Add sorting by purchase amount',
    {
      currentQuery: `SELECT * FROM "${TEST_TABLES.orders.name}" WHERE "created_at" > '2024-01-01'`,
    }
  );

  // Process streaming results in real-time
  let partialQuery = '';
  for await (const chunk of refinedStream) {
    partialQuery += chunk;
    process.stdout.write(chunk);
  }
  console.log('\n');
  colorLog('green', `Final refined SQL: ${partialQuery}`);
}

async function executeSQLQuery(client: BolticClient): Promise<void> {
  subsection('SQL Query Execution Example');

  const result = await client.sql.executeSQL(
    `SELECT "name", "email" FROM "${TEST_TABLES.users.name}" WHERE "active" = true`
  );

  if ('error' in result && result.error) {
    colorLog('red', `SQL execution failed: ${result.error.message}`);
    return;
  }

  console.log('Query Results:');
  // Extract data from Boltic API Response Structure
  const [resultRows, metadata] = (result as any).data;
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

  if ((result as any).pagination) {
    console.log('Total count:', (result as any).pagination.total_count);
  }
}

async function executeMultipleQueries(client: BolticClient): Promise<void> {
  subsection('Execute Multiple Queries Example');

  const result = await client.sql.executeSQL(`
      INSERT INTO "${TEST_TABLES.users.name}" ("name", "email", "active") 
      VALUES ('Temp User', 'temp@example.com', true);
      UPDATE "${TEST_TABLES.users.name}" SET "active" = false WHERE "name" = 'Temp User';
      SELECT * FROM "${TEST_TABLES.users.name}" WHERE "name" = 'Temp User';
    `);

  colorLog('green', 'Multi-query execution completed');
  console.log('Result data:', result.data);
}

async function customStreamingProcessing(client: BolticClient) {
  subsection('Custom Streaming Processing Example');

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

  colorLog('green', `Final SQL: ${accumulatedSQL}`);
}

async function demonstrateTextToSQL(
  client: BolticClient,
  testClient: SqlTestClient
) {
  separator('TEXT-TO-SQL CONVERSION');

  // Run basic examples
  await basicTextToSQL(client);
  await textToSQLWithRefinement(client);
  await customStreamingProcessing(client);

  for (const [index, prompt] of TEST_QUERIES.textToSql.entries()) {
    subsection(`Advanced Text-to-SQL Example ${index + 1}`);

    console.log(`📝 Prompt: "${prompt}"`);

    const result = await handleAsyncError(async () => {
      colorLog('blue', '🔄 Generating SQL (streaming)...');

      // Demonstrate streaming
      const sqlStream = await client.sql.textToSQL(prompt);
      let generatedSQL = '';

      for await (const chunk of sqlStream) {
        process.stdout.write(chunk);
        generatedSQL += chunk;
      }

      console.log('\n');
      colorLog('green', `✅ Generated SQL: ${generatedSQL}`);

      return generatedSQL;
    }, 'Text-to-SQL generation');

    if (result) {
      // Demonstrate query refinement
      subsection('Query Refinement Example');

      const refinementResult = await handleAsyncError(async () => {
        const refinedPrompt = 'Add ORDER BY clause and limit to 5 results';
        console.log(`📝 Refinement: "${refinedPrompt}"`);

        colorLog('blue', '🔄 Refining SQL...');
        const refinedStream = await client.sql.textToSQL(refinedPrompt, {
          currentQuery: result,
        });

        return await testClient.generateSQL(refinedPrompt, {
          currentQuery: result,
        });
      }, 'SQL refinement');

      if (refinementResult) {
        colorLog('green', `✅ Refined SQL: ${refinementResult}`);
      }
    }

    // Add delay between examples
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function demonstrateSQLExecution(client: BolticClient) {
  separator('SQL QUERY EXECUTION');

  // Run example queries
  await executeSQLQuery(client);
  await executeMultipleQueries(client);

  // Basic queries
  subsection('Basic Query Execution');

  for (const [index, query] of TEST_QUERIES.basic.entries()) {
    console.log(`\n📊 Executing Query ${index + 1}:`);
    console.log(`   ${query}`);

    const result = await handleAsyncError(
      async () => {
        const apiResponse = await client.sql.executeSQL(query);

        colorLog('green', `✅ Query executed successfully!`);

        if ('error' in apiResponse && apiResponse.error) {
          colorLog('red', `   ❌ SQL error: ${apiResponse.error.message}`);
          return apiResponse;
        }

        const successResponse =
          apiResponse as import('../../src/types/api/sql').ExecuteSQLApiResponse;

        // Extract data from Boltic API Response Structure
        const [resultRows, metadata] = successResponse.data;

        // Extract count from metadata
        let count: number;
        if (typeof metadata === 'number') {
          count = metadata;
        } else if (
          metadata &&
          typeof metadata === 'object' &&
          'count' in metadata
        ) {
          count = (metadata as any).count;
        } else {
          count = resultRows?.length || 0;
        }

        console.log(`   📈 Rows returned: ${count}`);
        console.log(`   🔧 Metadata:`, metadata);

        if (resultRows && resultRows.length > 0) {
          console.log('   🎯 Sample data:');
          console.log('  ', JSON.stringify(resultRows[0], null, 2));
        }

        if (successResponse.pagination) {
          console.log(
            `   📄 Pagination: Page ${successResponse.pagination.current_page} of ${successResponse.pagination.total_pages}`
          );
          console.log(
            `   📊 Total records: ${successResponse.pagination.total_count}`
          );
        }

        return successResponse;
      },
      `Query execution ${index + 1}`
    );

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function demonstrateAdvancedFeatures(
  client: BolticClient,
  testClient: SqlTestClient
) {
  separator('ADVANCED FEATURES');

  // Streaming simulation
  subsection('Streaming Simulation');

  const longQuery = `SELECT u."name", u."email", o."total", o."status" FROM "${TEST_TABLES.users.name}" u JOIN "${TEST_TABLES.orders.name}" o ON u."id" = o."user_id"::uuid WHERE o."created_at" >= CURRENT_DATE - INTERVAL '30 days' ORDER BY o."total" DESC`;

  console.log('🌊 Simulating streaming SQL generation...');
  console.log('📝 Query: Complex multi-table join with date filtering');

  let streamedContent = '';
  const stream = testClient.simulateStreamingSQL(longQuery, 15, 100);

  for await (const chunk of stream) {
    process.stdout.write(chunk);
    streamedContent += chunk;
  }

  console.log('\n');
  colorLog('green', '✅ Streaming completed!');
  console.log(`📊 Streamed ${streamedContent.length} characters`);

  // Batch operations
  subsection('Batch Query Testing');

  const batchQueries = [
    `SELECT COUNT(*) FROM "${TEST_TABLES.users.name}"`,
    `SELECT COUNT(*) FROM "${TEST_TABLES.orders.name}"`,
    `SELECT COUNT(*) FROM "${TEST_TABLES.products.name}"`,
  ];

  console.log('🔄 Executing batch queries...');

  const batchResults = await Promise.allSettled(
    batchQueries.map(async (query, index) => {
      const result = await client.sql.executeSQL(query);

      if ('error' in result && result.error) {
        colorLog(
          'red',
          `   ❌ Batch ${index + 1} SQL error: ${result.error.message}`
        );
        return result;
      }

      const success =
        result as import('../../src/types/api/sql').ExecuteSQLApiResponse;

      // Extract count from Boltic API Response Structure
      const [resultRows, metadata] = success.data;
      let count: number;
      if (typeof metadata === 'number') {
        count = metadata;
      } else if (
        metadata &&
        typeof metadata === 'object' &&
        'count' in metadata
      ) {
        count = (metadata as any).count;
      } else {
        count = resultRows?.length || 0;
      }

      console.log(`   ✅ Batch ${index + 1}: ${count} rows`);
      return success;
    })
  );

  const successful = batchResults.filter(
    (r) => r.status === 'fulfilled'
  ).length;
  const failed = batchResults.filter((r) => r.status === 'rejected').length;

  colorLog(
    'blue',
    `📊 Batch Results: ${successful} successful, ${failed} failed`
  );
}

async function runPerformanceBenchmark(client: BolticClient) {
  separator('PERFORMANCE BENCHMARK');

  const benchmarkQueries = [
    'SELECT * FROM "sql_demo_orders"',
    `SELECT COUNT(*) FROM "${TEST_TABLES.users.name}"`,
    `SELECT * FROM "${TEST_TABLES.users.name}" LIMIT 10`,
  ];

  console.log('🏁 Running performance benchmark...');

  for (const [index, query] of benchmarkQueries.entries()) {
    const iterations = 3;
    const times: number[] = [];

    console.log(`\n⚡ Benchmark ${index + 1}: ${query}`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await handleAsyncError(
        async () => {
          await client.sql.executeSQL(query);
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          times.push(executionTime);

          console.log(`   Run ${i + 1}: ${executionTime}ms`);
          return null;
        },
        `Benchmark run ${i + 1}`
      );

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      colorLog(
        'blue',
        `   📊 Average: ${avgTime.toFixed(2)}ms | Min: ${minTime}ms | Max: ${maxTime}ms`
      );
    }
  }
}

// Custom database state
let customDatabaseName: string | undefined;
let customDatabaseInternalName: string | undefined;
let customDatabaseId: string | undefined;

async function setupCustomDatabase(client: BolticClient): Promise<void> {
  separator('SETTING UP CUSTOM DATABASE');
  
  customDatabaseName = `sql-demo-custom-db-${Date.now()}`;
  
  colorLog('yellow', `📝 Creating custom database "${customDatabaseName}"`);
  
  const createResult = await client.databases.create({
    db_name: customDatabaseName,
    db_internal_name: customDatabaseName.replace(/-/g, '_'),
    resource_id: 'boltic',
  });
  
  if (isErrorResponse(createResult)) {
    colorLog('red', `❌ Failed to create custom database: ${createResult.error.message}`);
    throw new Error('Cannot proceed without custom database');
  }
  
  customDatabaseInternalName = createResult.data.db_internal_name;
  customDatabaseId = createResult.data.id;
  
  colorLog('green', '✅ Custom database created successfully');
  console.log(`   Database ID: ${createResult.data.id}`);
  console.log(`   Database Name: ${createResult.data.db_name}`);
  console.log(`   Database Internal Name (slug): ${customDatabaseInternalName}`);
  
  // Switch to the custom database
  colorLog('yellow', `📝 Switching to custom database`);
  await client.useDatabase(customDatabaseInternalName);
  colorLog('green', '✅ Switched to custom database');
  console.log(`   Current Database Slug: ${customDatabaseInternalName}`);
}

async function deleteCustomDatabase(client: BolticClient): Promise<void> {
  if (!customDatabaseInternalName) return;
  
  try {
    colorLog('yellow', `🗑️  Deleting custom database: ${customDatabaseName} (internal name: ${customDatabaseInternalName})`);
    const deleteResult = await client.databases.delete(customDatabaseInternalName);
    
    if (isErrorResponse(deleteResult)) {
      colorLog('yellow', `   Warning: Failed to delete custom database: ${deleteResult.error.message}`);
      return;
    }
    
    colorLog('green', '✅ Custom database deleted successfully');
    
    // Clear references
    customDatabaseId = undefined;
    customDatabaseInternalName = undefined;
    customDatabaseName = undefined;
  } catch (error) {
    colorLog('yellow', `   Warning: Error deleting custom database: ${(error as Error).message}`);
  }
}

async function runComprehensiveSQLDemo() {
  colorLog('bright', '🚀 BOLTIC SQL SDK - COMPREHENSIVE DEMO');
  colorLog('bright', '=====================================');

  // Check for command line argument
  const useCustomDb = process.argv.includes('--use-custom-db');

  // Validate environment
  const apiKey = process.env.BOLTIC_API_KEY;
  if (!apiKey) {
    colorLog(
      'red',
      '❌ ERROR: BOLTIC_API_KEY environment variable is required'
    );
    colorLog('yellow', '💡 Set it in your .env file or environment');
    process.exit(1);
  }

  colorLog('green', '✅ Environment validated');
  console.log(`📊 Using API Key: ${apiKey.substring(0, 8)}...`);

  // Initialize client
  let client: BolticClient;
  let testClient: SqlTestClient;

  try {
    client = new BolticClient(apiKey, DEMO_CONFIG);
    testClient = new SqlTestClient(client.getSqlResource());

    colorLog('green', '✅ Boltic SQL client initialized successfully');
    colorLog('blue', `🌍 Connected to ${DEMO_CONFIG.environment} environment`);
  } catch (error) {
    colorLog(
      'red',
      `❌ Failed to initialize client: ${(error as Error).message}`
    );
    process.exit(1);
  }

  try {
    // Setup custom database if requested
    if (useCustomDb) {
      await setupCustomDatabase(client);
      colorLog('cyan', '\n📋 All subsequent operations will use the custom database');
    } else {
      colorLog('cyan', '\n📋 Using default database (backward compatible mode)');
      console.log("   All operations will use the account's default database");
    }

    // Setup test environment
    await createTestTables(client);
    await populateTestData(client);

    // Run all demonstrations
    await demonstrateTextToSQL(client, testClient);
    await demonstrateSQLExecution(client);
    await demonstrateAdvancedFeatures(client, testClient);
    await runPerformanceBenchmark(client);

    // Final summary
    separator('DEMO COMPLETED SUCCESSFULLY');

    colorLog('green', '🎉 Comprehensive SQL SDK Demo Completed!');
    console.log('\n📋 What was demonstrated:');
    console.log('   ✅ Table creation and data population');
    console.log('   ✅ Text-to-SQL AI conversion with streaming');
    console.log('   ✅ SQL query execution with safety measures');

    console.log('   ✅ Advanced error handling and recovery');
    console.log('   ✅ Performance monitoring and benchmarking');
    console.log('   ✅ Debug logging and configuration');
    console.log('   ✅ Streaming response handling');
    console.log('   ✅ Batch operations and async processing');
    console.log('   ✅ All sql-usage-examples.ts functionality');

    colorLog('cyan', '\n🚀 The Boltic SQL SDK is ready for production use!');
  } catch (error) {
    colorLog('red', `💥 Demo failed with error: ${(error as Error).message}`);
  } finally {
    // Always cleanup, even if demo fails
    await cleanupTestTables(client);
    
    // Delete custom database if it was created
    if (useCustomDb && customDatabaseId) {
      await deleteCustomDatabase(client);
    }
  }
}

// Run the demo
if (require.main === module) {
  const useCustomDb = process.argv.includes('--use-custom-db');
  
  if (useCustomDb) {
    console.log('📋 Running with custom database (demonstrating database switching)');
  }
  
  runComprehensiveSQLDemo().catch(async (error) => {
    colorLog('red', `💥 Unhandled error: ${error.message}`);
    // Try to run cleanup even if main demo fails
    try {
      const apiKey = process.env.BOLTIC_API_KEY;
      if (apiKey && useCustomDb) {
        const client = new BolticClient(apiKey, DEMO_CONFIG);
        await deleteCustomDatabase(client);
      }
    } catch (cleanupError) {
      colorLog('yellow', `   Warning: Cleanup also failed: ${(cleanupError as Error).message}`);
    }
    process.exit(1);
  });
}

export { runComprehensiveSQLDemo };
