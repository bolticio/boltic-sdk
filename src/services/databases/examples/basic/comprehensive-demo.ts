import * as dotenv from 'dotenv';
import * as path from 'path';
import { BolticClient, isErrorResponse } from '../../src';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const apiKey = process.env.BOLTIC_API_KEY;
const debug = process.env.DEBUG === 'true';

if (!apiKey) {
  console.error(
    '❌ BOLTIC_API_KEY is required. Please set it in your .env file.'
  );
  process.exit(1);
}

// Initialize the client
const client = new BolticClient(apiKey, { debug, environment: 'sit' });

// Demo configuration
const DEMO_TABLE_NAME = 'comprehensive-demo-table';
const DEMO_COLUMNS = [
  { name: 'text_column', type: 'text' as const },
  { name: 'email_column', type: 'email' as const },
  { name: 'long_text_column', type: 'long-text' as const },
  { name: 'number_column', type: 'number' as const },
  { name: 'currency_column', type: 'currency' as const },
  { name: 'checkbox_column', type: 'checkbox' as const },
  {
    name: 'dropdown_column',
    type: 'dropdown' as const,
    selectable_items: ['Option 1', 'Option 2', 'Option 3'],
  },
  { name: 'phone_column', type: 'phone-number' as const },
  { name: 'link_column', type: 'link' as const },
  { name: 'json_column', type: 'json' as const },
  { name: 'vector_column', type: 'vector' as const },
  { name: 'half_vector_column', type: 'halfvec' as const },
  { name: 'sparse_vector_column', type: 'sparsevec' as const },
];

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Starting cleanup...');

  try {
    // Delete all columns
    for (const column of DEMO_COLUMNS) {
      try {
        console.log(`🗑️  Deleting column: ${column.name}`);
        const result = await client.columns.delete(
          DEMO_TABLE_NAME,
          column.name
        );
        if (isErrorResponse(result)) {
          console.error(
            `❌ Failed to delete column ${column.name}:`,
            result.error
          );
        } else {
          console.log(`✅ Column ${column.name} deleted successfully`);
        }
      } catch (error) {
        console.error(`❌ Error deleting column ${column.name}:`, error);
      }
    }

    // Delete table
    try {
      console.log(`🗑️  Deleting table: ${DEMO_TABLE_NAME}`);
      const result = await client.tables.delete(DEMO_TABLE_NAME);
      if (isErrorResponse(result)) {
        console.error(
          `❌ Failed to delete table ${DEMO_TABLE_NAME}:`,
          result.error
        );
      } else {
        console.log(`✅ Table ${DEMO_TABLE_NAME} deleted successfully`);
      }
    } catch (error) {
      console.error(`❌ Error deleting table ${DEMO_TABLE_NAME}:`, error);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Demo functions
async function demoTableOperations() {
  console.log('\n🏗️  Starting table operations demo...\n');

  try {
    // 3. Create table
    console.log('\n🏗️  3. Creating demo table...');
    const createTableResult = await client.tables.create({
      name: DEMO_TABLE_NAME,
      description: 'Comprehensive demo table with all field types',
      fields: DEMO_COLUMNS,
    });

    if (isErrorResponse(createTableResult)) {
      console.error('❌ Table creation failed:', createTableResult.error);
      return;
    }

    console.log('✅ Table created successfully');
    console.log('   Table ID:', createTableResult.data.id);
    console.log('   Message:', createTableResult.data.message);

    // 4. List all tables
    console.log('\n📋 4. Listing all tables...');
    const listTablesResult = await client.tables.findAll();
    if (isErrorResponse(listTablesResult)) {
      console.error('❌ Failed to list tables:', listTablesResult.error);
    } else {
      console.log('✅ Tables listed successfully');
      console.log('   Total tables:', listTablesResult.data.length);
    }

    // 5. Filter tables
    console.log('\n🔍 5. Filtering tables...');
    const filterTablesResult = await client.tables.findAll({
      where: { name: DEMO_TABLE_NAME },
    });
    if (isErrorResponse(filterTablesResult)) {
      console.error('❌ Failed to filter tables:', filterTablesResult.error);
    } else {
      console.log('✅ Tables filtered successfully');
      console.log('   Matching tables:', filterTablesResult.data.length);
    }

    // 6. Update table (removed setAccess as it doesn't exist)
    console.log('\n✏️  6. Updating table...');
    const testUpdateTableResult = await client.tables.update(DEMO_TABLE_NAME, {
      description: 'Updated comprehensive demo table description',
    });

    if (isErrorResponse(testUpdateTableResult)) {
      console.error('❌ Failed to update table:', testUpdateTableResult.error);
    } else {
      console.log('✅ Table updated successfully');
      console.log(
        '   Updated description:',
        testUpdateTableResult.data.description
      );
    }
  } catch (error) {
    console.error('❌ Table operations demo failed:', error);
  }
}

async function demoColumnOperations() {
  console.log('\n📊 Starting column operations demo...\n');

  try {
    // 1. List existing columns
    console.log('📋 1. Listing existing columns...');
    const listResult = await client.columns.findAll(DEMO_TABLE_NAME);
    if (isErrorResponse(listResult)) {
      console.error('❌ Failed to list columns:', listResult.error);
    } else {
      console.log('✅ Columns listed successfully');
      console.log('   Total columns:', listResult.data.length);
    }

    // 2. Get specific column
    console.log('\n🔍 2. Getting specific column...');
    const getResult = await client.columns.findOne(
      DEMO_TABLE_NAME,
      'text_column'
    );
    if (isErrorResponse(getResult)) {
      console.error('❌ Failed to get column:', getResult.error);
    } else {
      console.log('✅ Column retrieved successfully');
      console.log('   Column name:', getResult.data.name);
      console.log('   Column type:', getResult.data.type);
    }

    // 3. Update column
    console.log('\n✏️  3. Updating column...');
    const updateResult = await client.columns.update(
      DEMO_TABLE_NAME,
      'text_column',
      {
        description: 'Updated text column description',
      }
    );
    if (isErrorResponse(updateResult)) {
      console.error('❌ Failed to update column:', updateResult.error);
    } else {
      console.log('✅ Column updated successfully');
      console.log('   Updated description:', updateResult.data.description);
    }

    // 4. Create additional column
    console.log('\n➕ 4. Creating additional column...');
    const createResult = await client.columns.create(DEMO_TABLE_NAME, {
      name: 'additional_text_column',
      type: 'text',
      description: 'Additional text column for demo',
    });
    if (isErrorResponse(createResult)) {
      console.error('❌ Failed to create column:', createResult.error);
    } else {
      console.log('✅ Column created successfully');
      console.log('   Column ID:', createResult.data.id);
    }
  } catch (error) {
    console.error('❌ Column operations demo failed:', error);
  }
}

async function demoRecordOperations() {
  console.log('\n📝 Starting record operations demo...\n');

  try {
    // 1. Insert record
    console.log('➕ 1. Inserting record...');
    const insertResult = await client.records.insert(DEMO_TABLE_NAME, {
      text_column: 'Sample text',
      email_column: 'demo@example.com',
      long_text_column: 'This is a longer text sample for the long text field.',
      number_column: 42,
      currency_column: 1234.56,
      checkbox_column: true,
      dropdown_column: 'Option 1',
      phone_column: '+1-234-567-8900',
      link_column: 'https://example.com',
      json_column: { key: 'value', nested: { data: 'test' } },
    });

    if (isErrorResponse(insertResult)) {
      console.error('❌ Failed to insert record:', insertResult.error);
      return;
    }

    console.log('✅ Record inserted successfully');
    console.log('   Record ID:', insertResult.data.id);

    const recordId = insertResult.data.id;

    // 2. List records
    console.log('\n📋 2. Listing records...');
    const listResult = await client.records.list(DEMO_TABLE_NAME, {
      page: { page_no: 1, page_size: 10 },
    });
    if (isErrorResponse(listResult)) {
      console.error('❌ Failed to list records:', listResult.error);
    } else {
      console.log('✅ Records listed successfully');
      console.log('   Total records:', listResult.data.length);
    }

    // 3. Get specific record
    console.log('\n🔍 3. Getting specific record...');
    const getResult = await client.records.get(DEMO_TABLE_NAME, recordId);
    if (isErrorResponse(getResult)) {
      console.error('❌ Failed to get record:', getResult.error);
    } else {
      console.log('✅ Record retrieved successfully');
      console.log('   Text column:', getResult.data.text_column);
      console.log('   Email column:', getResult.data.email_column);
    }

    // 4. Update record
    console.log('\n✏️  4. Updating record...');
    const updateResult = await client.records.updateById(
      DEMO_TABLE_NAME,
      recordId,
      {
        text_column: 'Updated text',
        number_column: 100,
      }
    );
    if (isErrorResponse(updateResult)) {
      console.error('❌ Failed to update record:', updateResult.error);
    } else {
      console.log('✅ Record updated successfully');
      console.log('   Updated text:', updateResult.data.text_column);
      console.log('   Updated number:', updateResult.data.number_column);
    }

    // 5. Delete record
    console.log('\n🗑️  5. Deleting record...');
    const deleteResult = await client.records.delete(DEMO_TABLE_NAME, {
      record_ids: [recordId],
    });
    if (isErrorResponse(deleteResult)) {
      console.error('❌ Failed to delete record:', deleteResult.error);
    } else {
      console.log('✅ Record deleted successfully');
    }
  } catch (error) {
    console.error('❌ Record operations demo failed:', error);
  }
}

async function demoFluentAPI() {
  console.log('\n🔧 Starting fluent API demo...\n');

  try {
    // 1. Table Builder
    console.log('🏗️  1. Using Table Builder...');
    const tableBuilder = client
      .table('fluent-demo-table')
      .name('Fluent API Demo Table')
      .describe('Table created using fluent API')
      .text('title')
      .email('contact_email')
      .number('score')
      .public();

    const buildResult = await tableBuilder.create();
    if (isErrorResponse(buildResult)) {
      console.error(
        '❌ Failed to create table with builder:',
        buildResult.error
      );
    } else {
      console.log('✅ Table created with fluent API');
      console.log('   Table ID:', buildResult.data.id);
    }

    // 2. Record Builder - using direct records API instead
    console.log('\n📝 2. Inserting record with direct API...');
    const insertResult = await client.records.insert('fluent-demo-table', {
      title: 'Sample Title',
      contact_email: 'fluent@example.com',
      score: 95,
    });

    if (isErrorResponse(insertResult)) {
      console.error('❌ Failed to insert record:', insertResult.error);
    } else {
      console.log('✅ Record inserted successfully');
      console.log('   Record ID:', insertResult.data.id);
    }

    // 3. Query with Record Builder
    console.log('\n🔍 3. Querying with Record Builder...');
    const queryResult = await client
      .record('fluent-demo-table')
      .where({ title: 'Sample Title' })
      .limit(5)
      .list();

    if (isErrorResponse(queryResult)) {
      console.error('❌ Failed to query with builder:', queryResult.error);
    } else {
      console.log('✅ Query executed with fluent API');
      console.log('   Results found:', queryResult.data.length);
    }

    // Cleanup fluent demo table
    await client.tables.delete('fluent-demo-table');
  } catch (error) {
    console.error('❌ Fluent API demo failed:', error);
  }
}

async function demoErrorHandling() {
  console.log('\n⚠️  Starting error handling demo...\n');

  try {
    // 1. Test with non-existent table
    console.log('🔍 1. Testing with non-existent table...');
    const errorTestResult =
      await client.tables.findByName('non-existent-table');
    if (isErrorResponse(errorTestResult)) {
      console.log('✅ Error properly handled:', errorTestResult.error.message);
    } else {
      console.log('❓ Unexpected success for non-existent table');
    }

    // 2. Test invalid column creation
    console.log('\n❌ 2. Testing invalid column creation...');
    const invalidColumnResult = await client.columns.create(
      'non-existent-table',
      {
        name: '',
        type: 'text',
      }
    );
    if (isErrorResponse(invalidColumnResult)) {
      console.log(
        '✅ Invalid column creation properly rejected:',
        invalidColumnResult.error.message
      );
    } else {
      console.log('❓ Unexpected success for invalid column');
    }

    // 3. Test invalid record operations
    console.log('\n📝 3. Testing invalid record operations...');
    const invalidRecordResult = await client.records.get(
      'non-existent-table',
      'invalid-id'
    );
    if (isErrorResponse(invalidRecordResult)) {
      console.log(
        '✅ Invalid record operation properly rejected:',
        invalidRecordResult.error.message
      );
    } else {
      console.log('❓ Unexpected success for invalid record operation');
    }
  } catch (error) {
    console.error('❌ Error handling demo failed:', error);
  }
}

async function demoSchemaHelpers() {
  console.log('\n🛠️  Starting schema helpers demo...\n');

  try {
    console.log('✅ Schema helpers available for field type management');
    console.log('   - Field type validation');
    console.log('   - Required properties checking');
    console.log('   - Field definition validation');
    console.log('   (Note: Demo methods temporarily unavailable)');
  } catch (error) {
    console.error('❌ Schema helpers demo failed:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Boltic SDK Comprehensive Demo\n');
  console.log('Environment:', client.getEnvironment());
  console.log('Region:', client.getRegion());
  console.log('Debug mode:', client.isDebugEnabled());

  try {
    // Run all demos
    await demoTableOperations();
    await demoColumnOperations();
    await demoRecordOperations();
    await demoFluentAPI();
    await demoErrorHandling();
    await demoSchemaHelpers();

    console.log('\n✅ All demos completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
  } finally {
    // Cleanup
    await cleanup();
    console.log('\n🎉 Demo finished!');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { cleanup, main };
