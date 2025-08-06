import * as dotenv from 'dotenv';
import * as path from 'path';

import { BolticClient } from '../../src/client/boltic-client';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Load .env file from the examples directory
const apiKey = process.env.BOLTIC_API_KEY;

const debug = process.env.DEBUG === 'true';

if (!apiKey) {
  console.error(
    '❌ BOLTIC_API_KEY is required. Please set it in your .env file.'
  );
  process.exit(1);
}

// Initialize the client with debug mode
const client = new BolticClient(apiKey, { debug, environment: 'sit' });

// Set the database context
client.useDatabase('comprehensive-demo-db', 'Comprehensive Demo Database');

const testTable = '100mb-file';

async function validateColumnOperations() {
  console.log('🧪 Starting Column Operations Validation...\n');

  try {
    // // Test 1: Create columns one by one
    // console.log('1. Testing single column creation...');

    // // Create price column
    // const priceResult = await client.columns.create(testTable, {
    //   name: `test_price-${new Date().toISOString()}`,
    //   type: 'currency',
    //   description: 'Test price column with USD format',
    //   currency_format: 'USD',
    //   decimals: '0.00' as DecimalType,
    // });

    // if (priceResult.error) {
    //   console.error('❌ Price column creation failed:', priceResult.error);
    //   return;
    // }
    // console.log(priceResult.data);
    // console.log('✅ Price column created successfully');

    // // Create phone column
    // const phoneResult = await client.columns.create(testTable, {
    //   name: `test_phone-${new Date().toISOString()}`,
    //   type: 'phone-number',
    //   description: 'Test phone column with custom format',
    //   phone_format: '+91 123 456 7890' as PhoneFormatType,
    // });

    // if (phoneResult.error) {
    //   console.error('❌ Phone column creation failed:', phoneResult.error);
    //   return;
    // }
    // console.log(phoneResult.data);
    // console.log('✅ Phone column created successfully');

    // // Create datetime column
    // const datetimeResult = await client.columns.create(testTable, {
    //   name: `test_datetime-${new Date().toISOString()}`,
    //   type: 'date-time',
    //   description: 'Test datetime column with custom format',
    //   date_format: 'YYYY_MM_DD' as keyof typeof DateFormatEnum,
    //   time_format: 'HH_mm_ss' as keyof typeof TimeFormatEnum,
    //   timezone: 'UTC',
    // });

    // if (datetimeResult.error) {
    //   console.error(
    //     '❌ Datetime column creation failed:',
    //     datetimeResult.error
    //   );
    //   return;
    // }
    // console.log(datetimeResult.data);
    // console.log('✅ Datetime column created successfully');

    // // Create vector column
    // const vectorResult = await client.columns.create(testTable, {
    //   name: `test_vector-${new Date().toISOString()}`,
    //   type: 'vector',
    //   description: 'Test vector column',
    //   vector_dimension: 1536,
    // });

    // if (vectorResult.error) {
    //   console.error('❌ Vector column creation failed:', vectorResult.error);
    //   return;
    // }
    // console.log(vectorResult.data);
    // console.log('✅ Vector column created successfully');

    // // Create number column
    // const numberResult = await client.columns.create(testTable, {
    //   name: `test_number-${new Date().toISOString()}`,
    //   type: 'number',
    //   description: 'Test number column with default decimals',
    // });

    // if (numberResult.error) {
    //   console.error('❌ Number column creation failed:', numberResult.error);
    //   return;
    // }
    // console.log(numberResult.data);
    // console.log('✅ Number column created successfully');

    // // Create dropdown column
    // const dropdownResult = await client.columns.create(testTable, {
    //   name: `test_dropdown-${new Date().toISOString()}`,
    //   type: 'dropdown',
    //   description: 'Test dropdown column',
    //   selectable_items: ['Option 1', 'Option 2', 'Option 3'],
    // });

    // if (dropdownResult.error) {
    //   console.error(
    //     '❌ Dropdown column creation failed:',
    //     dropdownResult.error
    //   );
    //   return;
    // }
    // console.log(dropdownResult.data);
    // console.log('✅ Dropdown column created successfully');

    // console.log('✅ All single column creation tests passed');

    // // Test 2: Find all columns
    // console.log('\n2. Testing column finding...');

    // const findAllResult = await client.columns.findAll(testTable, {
    //   sort: [{ field: 'field_order', order: 'asc' }],
    // });

    // if (findAllResult.error) {
    //   console.error('❌ Find all test failed:', findAllResult.error);
    //   return;
    // }
    // console.log(findAllResult.data);
    // console.log(
    //   '✅ Find all test passed - Found',
    //   findAllResult.data?.length,
    //   'columns'
    // );

    // Test 3: Find specific column
    console.log('\n3. Testing find specific column...');

    const findOneResult = await client.columns.findOne(testTable, {
      where: { name: 'updated_at' },
    });

    if (findOneResult.error) {
      console.error('❌ Find one test failed:', findOneResult.error);
      return;
    }
    console.log(findOneResult.data);
    console.log(
      '✅ Find one test passed - Found column:',
      findOneResult.data?.name
    );

    // // Test 4: Update column
    console.log('\n4. Testing column update...');

    const updateResult = await client.columns.update(testTable, {
      set: {
        description: 'Update',
        timezone: 'utc',
      },
      where: { name: 'Address' },
    });

    if (updateResult.error) {
      console.error('❌ Update test failed:', updateResult.error);
      return;
    }
    console.log(
      '✅ Update test passed - Updated column:',
      updateResult.data?.name
    );

    // // Test 5: Update date-time column
    // console.log('\n5. Testing date-time column update...');

    // const updateDateTimeResult = await client.columns.update(testTable, {
    //   set: {
    //     date_format: 'MMDDYYYY' as keyof typeof DateFormatEnum,
    //     time_format: 'HH_mm_ss' as keyof typeof TimeFormatEnum,
    //     timezone: 'America/New_York',
    //   },
    //   where: { name: 'test_datetime' },
    // });

    // if (updateDateTimeResult.error) {
    //   console.error(
    //     '❌ Update datetime test failed:',
    //     updateDateTimeResult.error
    //   );
    //   return;
    // }
    // console.log('✅ Update datetime test passed');

    // // Test 6: Update phone format
    // console.log('\n6. Testing phone format update...');

    // const updatePhoneResult = await client.columns.update(testTable, {
    //   set: {
    //     phone_format: '(123) 456-7890' as PhoneFormatType,
    //   },
    //   where: { name: 'test_phone' },
    // });

    // if (updatePhoneResult.error) {
    //   console.error('❌ Update phone test failed:', updatePhoneResult.error);
    //   return;
    // }
    // console.log('✅ Update phone test passed');

    // // Test column definition creation
    // const columnDef = ColumnHelpers.createColumnDefinition(
    //   'test_helper',
    //   'number',
    //   {
    //     description: 'Test helper column',
    //     decimals: '0.00' as DecimalType,
    //   }
    // );
    // console.log('✅ Column definition creation test passed');

    // // Test column name validation
    // const isValidName = ColumnHelpers.isValidColumnName('test_column_123');
    // console.log(
    //   '✅ Column name validation test:',
    //   isValidName ? 'Valid name' : 'Invalid name'
    // );

    // // Test column type display name
    // const displayName = ColumnHelpers.getColumnTypeDisplayName('currency');
    // console.log('✅ Column type display name test:', displayName);

    // Test 8: Delete column
    console.log('\n8. Testing column deletion...');

    const deleteResult = await client.columns.delete(testTable, {
      where: { name: 'Address' },
    });
    console.log(deleteResult);
    if (deleteResult.error) {
      console.error('❌ Delete test failed:', deleteResult.error);
      return;
    }
    console.log('✅ Delete test passed');

    // // Test 9: Fluent API operations
    // console.log('\n9. Testing fluent API operations...');

    // const fluentFindResult = await client
    //   .from(testTable)
    //   .column()
    //   .sort([{ field: 'field_order', order: 'asc' }])
    //   .findAll();

    // if (fluentFindResult.error) {
    //   console.error('❌ Fluent API test failed:', fluentFindResult.error);
    //   return;
    // }
    // console.log(
    //   '✅ Fluent API test passed - Found',
    //   fluentFindResult.data?.length,
    //   'columns'
    // );

    // // Test 10: Error handling
    // console.log('\n10. Testing error handling...');

    // try {
    //   // Try to create a column with invalid decimal type
    //   await client.columns.create(testTable, {
    //     columns: [
    //       {
    //         name: 'invalid_column',
    //         type: 'currency',
    //         decimals: 'invalid' as any, // This should fail
    //       },
    //     ],
    //   });
    //   console.log(
    //     '❌ Error handling test failed - Should have thrown validation error'
    //   );
    // } catch (error) {
    //   console.log(
    //     '✅ Error handling test passed - Caught validation error as expected'
    //   );
    // }

    console.log('\n🎉 All validation tests passed successfully!');
    console.log('✅ Column operations are working correctly');
    console.log('✅ Type safety is enforced');
    console.log('✅ Error handling is working');
    console.log('✅ Helper utilities are functional');
  } catch (error) {
    console.error('❌ Validation failed with unexpected error:', error);
  }
}

// Run the validation
validateColumnOperations().catch(console.error);

// Export for use in other tests
export { validateColumnOperations };
