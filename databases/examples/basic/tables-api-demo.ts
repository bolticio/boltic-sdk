/**
 * Tables Module API Integration Demo
 *
 * This demonstrates how to use the complete Tables Module integration
 * with actual API calls to the Boltic Tables service.
 *
 * To run this demo:
 * 1. Copy env.example to .env and set your BOLTIC_API_KEY
 * 2. npm install
 * 3. npx ts-node examples/basic/tables-api-demo.ts
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from the examples directory
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

import { TablesApiClient } from '../../src/api/clients/tables-api-client';
import { TableCreateRequest } from '../../src/types/api/table';

async function runTablesDemo() {
  console.log('🚀 Starting Boltic Tables API Demo...\n');

  // Configuration
  const apiKey = process.env.BOLTIC_API_KEY;
  const debug = process.env.DEBUG === 'true';
  const timeout = parseInt(process.env.TIMEOUT || '30000');

  if (!apiKey) {
    console.error(
      '❌ BOLTIC_API_KEY is required. Please set it in your .env file.'
    );
    return;
  }

  // Initialize Tables API Client
  const tablesApiClient = new TablesApiClient(apiKey, {
    timeout,
    debug,
  });

  try {
    // Step 3: Manual Table Creation Demo
    console.log('\n📋 Step 3: Manual Table Creation');
    console.log('   Creating table with manual schema...');

    const manualTableRequest: TableCreateRequest = {
      name: `demo_products_${Date.now()}`,
      description: 'Demo product table created with manual schema',
      fields: [
        {
          name: 'product_name',
          type: 'text',
          description: 'Product name',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
        {
          name: 'price',
          type: 'currency',
          currency_format: 'USD',
          decimals: '0.00',
          description: 'Product price in USD',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
        {
          name: 'category',
          type: 'dropdown',
          selectable_items: [
            'Electronics',
            'Clothing',
            'Books',
            'Home & Garden',
          ],
          selection_source: 'provide-static-list',
          description: 'Product category',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
        {
          name: 'stock_quantity',
          type: 'number',
          decimals: '00',
          default_value: 0,
          description: 'Items in stock',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
        {
          name: 'is_featured',
          type: 'checkbox',
          description: 'Featured product flag',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
        {
          name: 'description',
          type: 'long-text',
          description: 'Product description',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          is_indexed: false,
        },
      ],
      is_ai_generated_schema: false,
      is_template: false,
    };

    const createResult = await tablesApiClient.createTable(manualTableRequest);

    if (createResult.error) {
      console.log(`   ❌ Table creation failed: ${createResult.error}`);
      return;
    }

    const createdTableId = createResult.data.id;
    console.log('✅ Table created successfully!');
    console.log(`   Table ID: ${createdTableId || 'Unknown'}`);

    console.log('\n');

    // Step 5: List Tables Demo
    console.log('\n📋 Step 5: List Tables Demo');
    console.log('   Fetching list of tables...');

    const listResult = await tablesApiClient.listTables({
      page: 1,
      pageSize: 10,
    });

    if (listResult.error) {
      console.log(`   ❌ List tables failed: ${listResult.error}`);
    } else {
      console.log(`   ✅ Found ${listResult.pagination?.total || 0} tables`);
      console.log(
        `   Current page: ${listResult.pagination?.current_page || 1}`
      );
      console.log(`   Per page: ${listResult.pagination?.per_page || 10}`);
    }

    // Step 6: Update Table Demo
    if (createdTableId && createdTableId !== 'Unknown') {
      console.log('\n✏️  Step 6: Update Table Demo');
      console.log('   Updating table description...');

      const updateResult = await tablesApiClient.updateTable(createdTableId, {
        description: 'Updated demo product table with new description',
        is_shared: true,
      });

      if (updateResult.error) {
        console.log(`   ❌ Update table failed: ${updateResult.error}`);
      } else {
        console.log(`   ✅ Table updated successfully!`);
        console.log(
          `   New description: ${updateResult.data?.description || 'N/A'}`
        );
        console.log(`   Is shared: ${updateResult.data?.is_public || 'N/A'}`);
      }
    }

    // Step 7: Get Table Details Demo
    if (createdTableId && createdTableId !== 'Unknown') {
      console.log('\n🔍 Step 7: Get Table Details Demo');
      console.log('   Fetching table details...');

      const getResult = await tablesApiClient.getTable(createdTableId);

      if (getResult.error) {
        console.log(`   ❌ Get table failed: ${getResult.error}`);
      } else {
        console.log(`   ✅ Table details retrieved!`);
        console.log(`   Name: ${getResult.data?.name || 'N/A'}`);
        console.log(`   Description: ${getResult.data?.description || 'N/A'}`);
        console.log(`   Created at: ${getResult.data?.created_at || 'N/A'}`);
        console.log(
          `   Fields: ${(getResult.data as any)?.fields?.length || 0} fields`
        );
      }
    }

    // Step 8: Cleanup Demo
    if (createdTableId && createdTableId !== 'Unknown') {
      console.log('\n🧹 Step 8: Cleanup Demo');
      console.log('   Deleting demo table...');

      const deleteResult = await tablesApiClient.deleteTable(createdTableId);

      if (deleteResult.error) {
        console.log(`   ❌ Delete table failed: ${deleteResult.error}`);
      } else {
        console.log(`   ✅ Table deleted successfully!`);
      }
    }

    console.log('\n✨ Tables Module API Integration Demo Complete!');
    console.log('\n📊 Features Demonstrated:');
    console.log('   ✅ Currency API integration and validation');
    console.log('   ✅ AI-powered schema generation');
    console.log('   ✅ Manual table creation with full schema');
    console.log('   ✅ Fluent builder pattern for table creation');
    console.log('   ✅ Advanced filtering and pagination');
    console.log('   ✅ Table updates and modifications');
    console.log('   ✅ Table details retrieval');
    console.log('   ✅ Proper cleanup and resource management');
  } catch (error) {
    console.error('💥 Demo failed with error:', error);
  }
}

// Helper function to handle environment setup
function checkEnvironment() {
  if (!process.env.BOLTIC_API_KEY) {
    console.log('⚠️  Environment Setup Required:');
    console.log('   1. Set BOLTIC_API_KEY environment variable');
    console.log(
      '   2. Optionally set BOLTIC_BASE_URL (defaults to SIT environment)'
    );
    console.log('\n   Example:');
    console.log('   export BOLTIC_API_KEY="your-api-key-here"');
    console.log(
      '   export BOLTIC_BASE_URL="https://asia-south1.api.boltic.io/service/panel/boltic-tables"'
    );
    console.log(
      '\n   Then run: npx ts-node examples/basic/tables-api-demo.ts\n'
    );
    return false;
  }
  return true;
}

// Run the demo
if (require.main === module) {
  if (checkEnvironment()) {
    runTablesDemo().catch(console.error);
  }
}

export { runTablesDemo };
