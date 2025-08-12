import * as dotenv from 'dotenv';
import * as path from 'path';
import { BolticClient } from '../../src/client/boltic-client';
import { SchemaHelpers } from '../../src/utils/table/schema-helpers';

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
  { name: 'dropdown_column', type: 'dropdown' as const },
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
        const result = await client.columns.delete(DEMO_TABLE_NAME, {
          where: { name: column.name },
        });
        if (result.error) {
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
      if (result.error) {
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
    console.error('❌ Error during cleanup:', error);
  }
}

async function comprehensiveDemo() {
  console.log('🚀 Starting Comprehensive Table and Column Operations Demo');
  console.log('='.repeat(60));

  try {
    // 1. Create a Boltic client by loading env
    console.log('\n1️⃣  Creating Boltic client...');
    console.log('📝 Input: API Key loaded from environment');
    console.log('📤 Output: Client initialized successfully');
    console.log('✅ Step 1 completed');

    // 2. Create a table using create function (manually and not by AI)
    console.log('\n2️⃣  Creating table using create function...');
    console.log('📝 Input: Table name and basic schema');

    const basicSchema = [
      SchemaHelpers.textField('role_number', {
        is_primary_key: false,
        is_nullable: false,
        is_unique: true,
        description: 'Role number',
      }),
      SchemaHelpers.textField('name', {
        is_nullable: false,
        description: 'Basic name field',
      }),
    ];

    const createTableResult = await client.tables.create({
      name: DEMO_TABLE_NAME,
      fields: basicSchema,
    });

    if (createTableResult.error) {
      console.error('❌ Table creation failed:', createTableResult.error);
      await cleanup();
      return;
    }

    console.log('📤 Output:', createTableResult.data);
    console.log('✅ Step 2 completed');

    // 3. List tables and filter table
    console.log('\n3️⃣  Listing tables and filtering...');

    // List all tables
    console.log('📝 Input: List all tables');
    const listTablesResult = await client.tables.findAll();
    if (listTablesResult.error) {
      console.error('❌ Failed to list tables:', listTablesResult.error);
    } else {
      console.log('📤 Output (all tables):', listTablesResult.data);
    }

    // Filter tables by name
    console.log('📝 Input: Filter tables by name containing "demo"');
    const filterTablesResult = await client.tables.findAll({
      where: { name: 'demo' },
    });
    if (filterTablesResult.error) {
      console.error('❌ Failed to filter tables:', filterTablesResult.error);
    } else {
      console.log('📤 Output (filtered tables):', filterTablesResult.data);
    }

    console.log('✅ Step 3 completed');

    // 4. Update table access to make it public
    console.log('\n4️⃣  Updating table access to public...');
    console.log('📝 Input: Update table access to public');

    const updateTableResult = await client.tables.setAccess({
      table_name: DEMO_TABLE_NAME,
      is_shared: true,
    });

    if (updateTableResult.error) {
      console.error(
        '❌ Failed to update table access:',
        updateTableResult.error
      );
    } else {
      console.log('📤 Output:', updateTableResult.data);
    }

    console.log('✅ Step 4 completed');

    // 5. Get a table by name
    console.log('\n5️⃣  Getting table by name...');
    console.log('📝 Input: Get table by name');

    const getTableResult = await client.tables.findOne({
      where: { name: DEMO_TABLE_NAME },
    });
    if (getTableResult.error) {
      console.error('❌ Failed to get table:', getTableResult.error);
    } else {
      console.log('📤 Output:', getTableResult.data);
    }

    console.log('✅ Step 5 completed');

    // 6. Add each type of column to the table using create column function
    console.log('\n6️⃣  Adding each type of column...');

    for (const column of DEMO_COLUMNS) {
      console.log(
        `\n📝 Input: Creating ${column.type} column "${column.name}"`
      );

      let columnData: any = {
        name: column.name,
        type: column.type,
        description: `${column.type} column for demonstration`,
      };

      // Add type-specific properties
      switch (column.type) {
        case 'currency':
          columnData.currency_format = 'USD';
          columnData.decimals = '0.00';
          break;
        case 'dropdown':
          columnData.selectable_items = ['Option 1', 'Option 2', 'Option 3'];
          columnData.multiple_selections = false;
          break;
        case 'phone-number':
          columnData.phone_format = '+91 123 456 7890';
          break;
        case 'vector':
        case 'halfvec':
        case 'sparsevec':
          columnData.vector_dimension = 1536;
          break;
        case 'number':
          columnData.decimals = '0.00';
          break;
        case 'checkbox':
          columnData.default_value = false;
          break;
      }

      const createColumnResult = await client.columns.create(
        DEMO_TABLE_NAME,
        columnData
      );

      if (createColumnResult.error) {
        console.error(
          `❌ Failed to create ${column.type} column:`,
          createColumnResult.error
        );
      } else {
        console.log(`📤 Output (${column.type}):`, createColumnResult.data);
      }
    }

    console.log('✅ Step 6 completed');

    // 7. List columns and filter columns
    console.log('\n7️⃣  Listing columns and filtering...');

    // List all columns
    console.log('📝 Input: List all columns');
    const listColumnsResult = await client.columns.findAll(DEMO_TABLE_NAME);
    if (listColumnsResult.error) {
      console.error('❌ Failed to list columns:', listColumnsResult.error);
    } else {
      console.log('📤 Output (all columns):', listColumnsResult.data);
    }

    // Filter columns by type
    console.log('📝 Input: Filter columns by type "text"');
    const filterColumnsResult = await client.columns.findAll(DEMO_TABLE_NAME, {
      where: { type: 'text' },
    });
    if (filterColumnsResult.error) {
      console.error('❌ Failed to filter columns:', filterColumnsResult.error);
    } else {
      console.log('📤 Output (filtered columns):', filterColumnsResult.data);
    }

    console.log('✅ Step 7 completed');

    // 8. Update column each type of column
    console.log('\n8️⃣  Updating each type of column...');

    for (const column of DEMO_COLUMNS) {
      console.log(
        `\n📝 Input: Updating ${column.type} column "${column.name}"`
      );

      const updateData: any = {
        description: `Updated ${column.type} column description`,
        is_visible: true,
        is_indexed: true,
      };

      // Add type-specific update properties
      switch (column.type) {
        case 'currency':
          updateData.currency_format = 'EUR';
          updateData.decimals = '0.00';
          break;
        case 'dropdown':
          updateData.selectable_items = [
            'Updated Option 1',
            'Updated Option 2',
            'Updated Option 3',
          ];
          break;
        case 'phone-number':
          updateData.phone_format = '+91 123 456 7890';
          break;
        case 'vector':
        case 'halfvec':
        case 'sparsevec':
          updateData.vector_dimension = 1024;
          break;
        case 'number':
          updateData.decimals = '0.00';
          break;
        case 'checkbox':
          updateData.default_value = true;
          break;
      }

      const updateColumnResult = await client.columns.update(DEMO_TABLE_NAME, {
        where: { name: column.name },
        set: updateData,
      });

      if (updateColumnResult.error) {
        console.error(
          `❌ Failed to update ${column.type} column:`,
          updateColumnResult.error
        );
      } else {
        console.log(
          `📤 Output (updated ${column.type}):`,
          updateColumnResult.data
        );
      }
    }

    console.log('✅ Step 8 completed');

    // 9. Get a column by name
    console.log('\n9️⃣  Getting column by name...');
    console.log('📝 Input: Get column by name "text_column"');

    const getColumnResult = await client.columns.findOne(DEMO_TABLE_NAME, {
      where: { name: 'text_column' },
    });
    if (getColumnResult.error) {
      console.error('❌ Failed to get column:', getColumnResult.error);
    } else {
      console.log('📤 Output:', getColumnResult.data);
    }

    console.log('✅ Step 9 completed');

    // 10. Delete columns
    console.log('\n🔟  Deleting columns...');

    // Delete a few columns as demonstration
    const columnsToDelete = ['text_column', 'email_column', 'number_column'];

    for (const columnName of columnsToDelete) {
      console.log(`📝 Input: Delete column "${columnName}"`);

      const deleteColumnResult = await client.columns.delete(DEMO_TABLE_NAME, {
        where: { name: columnName },
      });

      if (deleteColumnResult.error) {
        console.error(
          `❌ Failed to delete column ${columnName}:`,
          deleteColumnResult.error
        );
      } else {
        console.log(
          `📤 Output (deleted ${columnName}):`,
          deleteColumnResult.data
        );
      }
    }

    console.log('✅ Step 10 completed');

    // 11. Delete table
    console.log('\n1️⃣1️⃣  Deleting table...');
    console.log('📝 Input: Delete table');

    const deleteTableResult = await client.tables.delete(DEMO_TABLE_NAME);
    if (deleteTableResult.error) {
      console.error('❌ Failed to delete table:', deleteTableResult.error);
    } else {
      console.log('📤 Output:', deleteTableResult.data);
    }

    console.log('✅ Step 11 completed');

    console.log('\n🎉 Comprehensive demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed with error:', error);
    console.log('\n🧹 Running cleanup due to error...');
    await cleanup();
  }
}

// Run the demo
comprehensiveDemo().catch(async (error) => {
  console.error('❌ Demo failed:', error);
  await cleanup();
});
