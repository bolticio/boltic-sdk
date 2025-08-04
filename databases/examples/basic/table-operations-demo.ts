import { BolticClient } from '../../src/client/boltic-client';
import { ApiError, ValidationError } from '../../src/errors/utils';
import { SchemaHelpers } from '../../src/utils/table/schema-helpers';

async function comprehensiveTableOperationsDemo() {
  console.log('=== Comprehensive Table Operations Demo ===');

  // Initialize the client
  const client = new BolticClient('your-api-key-here');

  try {
    // Set database context
    client.useDatabase('comprehensive-demo-db', 'Comprehensive Demo Database');
    console.log('✓ Database context set');

    // 1. COMPREHENSIVE SCHEMA CREATION WITH ALL FIELD TYPES
    console.log('\n1. Creating comprehensive schema with all field types...');

    const comprehensiveSchema = [
      // Text fields
      SchemaHelpers.textField('title', {
        is_unique: true,
        is_nullable: false,
        description: 'Product title',
      }),
      SchemaHelpers.longTextField('description', {
        description: 'Detailed product description',
      }),

      // Numeric fields
      SchemaHelpers.numberField('quantity', {
        is_nullable: false,
        decimals: 0,
        description: 'Stock quantity',
      }),
      SchemaHelpers.currencyField('price', 'USD', {
        is_nullable: false,
        decimals: 2,
        description: 'Product price in USD',
      }),

      // Selection fields
      SchemaHelpers.checkboxField('is_featured', {
        default_value: false,
        description: 'Whether product is featured',
      }),
      SchemaHelpers.dropdownField(
        'category',
        ['electronics', 'clothing', 'books', 'home-garden', 'sports', 'toys'],
        {
          is_nullable: false,
          multiple_selections: false,
          description: 'Product category',
        }
      ),

      // Contact fields
      SchemaHelpers.emailField('vendor_email', {
        description: 'Vendor contact email',
      }),
      SchemaHelpers.phoneNumberField('vendor_phone', 'international', {
        description: 'Vendor contact phone',
      }),
      SchemaHelpers.linkField('product_url', {
        description: 'Product webpage URL',
      }),

      // Advanced fields
      SchemaHelpers.vectorField('search_embedding', 1536, {
        is_visible: false,
        description: 'Search embedding vector',
      }),
      SchemaHelpers.halfVectorField('compact_embedding', 512, {
        is_visible: false,
        description: 'Compact half-precision embedding',
      }),
      SchemaHelpers.sparseVectorField('sparse_features', 2048, {
        is_visible: false,
        description: 'Sparse feature vector',
      }),
      SchemaHelpers.jsonField('specifications', {
        description: 'Product technical specifications',
      }),
      SchemaHelpers.dateTimeField('created_at', {
        is_nullable: false,
        date_format: 'YYYY-MM-DD',
        time_format: 'HH:mm:ss',
        description: 'Creation timestamp',
      }),
      SchemaHelpers.dateTimeField('last_updated', {
        description: 'Last update timestamp',
      }),
    ];

    // 2. METHOD 1 (DIRECT API) - CREATE TABLE
    console.log('\n2. Creating table using Method 1 (Direct API)...');

    const { data: table, error: createError } = await client.tables.create({
      table_name: 'comprehensive_products',
      schema: comprehensiveSchema,
      description: 'Comprehensive product catalog with all field types',
      is_public: false,
    });

    if (createError) {
      console.error('❌ Failed to create table:', createError);
      return;
    }

    console.log('✓ Table created successfully:', table?.name);
    console.log(`  - ID: ${table?.id}`);
    console.log(`  - Created at: ${table?.created_at}`);

    // 3. METHOD 2 (FLUENT INTERFACE) - QUERY OPERATIONS
    console.log(
      '\n3. Testing Method 2 (Fluent Interface) - Query Operations...'
    );

    // List tables with complex filtering and sorting
    const { data: tables, pagination } = await client
      .table()
      .where({
        is_public: false,
        created_by: table?.created_by,
      })
      .sort([
        { field: 'created_at', order: 'desc' },
        { field: 'name', order: 'asc' },
      ])
      .limit(10)
      .offset(0)
      .findAll();

    console.log(`✓ Found ${tables?.length} tables using fluent interface`);
    console.log(`  - Total: ${pagination?.total}, Page: ${pagination?.page}`);

    // Find specific table using fluent interface
    const { data: foundTable } = await client
      .table()
      .where({ name: 'comprehensive_products' })
      .findOne();

    if (foundTable) {
      console.log('✓ Found table using fluent interface:', foundTable.name);
    }

    // 4. METHOD 1 (DIRECT API) - METADATA AND UPDATES
    console.log('\n4. Testing Method 1 (Direct API) - Metadata and Updates...');

    // Get detailed metadata
    const { data: metadata } = await client.tables.getMetadata(
      'comprehensive_products'
    );

    if (metadata) {
      console.log('✓ Table metadata retrieved:', {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        is_public: metadata.is_public,
        created_at: metadata.created_at,
        account_id: metadata.account_id,
        db_id: metadata.db_id,
      });
    }

    // 5. METHOD 2 (FLUENT INTERFACE) - ACCESS CONTROL
    console.log('\n5. Testing Method 2 (Fluent Interface) - Access Control...');

    // Update table access using fluent interface
    await client
      .table()
      .where({ name: 'comprehensive_products' })
      .set({ is_shared: true })
      .setAccess();

    console.log(
      '✓ Table access updated using fluent interface (set to shared)'
    );

    // 6. METHOD 1 (DIRECT API) - RENAME OPERATION
    console.log('\n6. Testing Method 1 (Direct API) - Rename Operation...');

    await client.tables.rename(
      'comprehensive_products',
      'advanced_product_catalog'
    );
    console.log(
      '✓ Table renamed using direct API: comprehensive_products → advanced_product_catalog'
    );

    // 7. MIXED OPERATIONS - CREATE ADDITIONAL TABLES FOR TESTING
    console.log('\n7. Creating additional tables for comprehensive testing...');

    // User table using Method 2
    const userSchema = [
      SchemaHelpers.textField('username', {
        is_unique: true,
        is_nullable: false,
      }),
      SchemaHelpers.emailField('email', {
        is_unique: true,
        is_nullable: false,
      }),
      SchemaHelpers.textField('first_name'),
      SchemaHelpers.textField('last_name'),
      SchemaHelpers.phoneNumberField('phone', 'e164'),
      SchemaHelpers.checkboxField('email_verified', { default_value: false }),
      SchemaHelpers.dropdownField(
        'subscription_tier',
        ['free', 'premium', 'enterprise'],
        { is_nullable: false }
      ),
      SchemaHelpers.jsonField('preferences'),
      SchemaHelpers.dateTimeField('created_at', { is_nullable: false }),
      SchemaHelpers.dateTimeField('last_login'),
    ];

    await client.table().create({
      table_name: 'users',
      schema: userSchema,
      description: 'User profiles and authentication data',
    });

    console.log('✓ User table created using fluent interface');

    // Analytics table using Method 1
    const analyticsSchema = [
      SchemaHelpers.textField('event_name', { is_nullable: false }),
      SchemaHelpers.textField('user_id'),
      SchemaHelpers.jsonField('event_data'),
      SchemaHelpers.linkField('referrer_url'),
      SchemaHelpers.numberField('session_duration', { decimals: 2 }),
      SchemaHelpers.checkboxField('is_conversion'),
      SchemaHelpers.vectorField('user_embedding', 384),
      SchemaHelpers.dateTimeField('timestamp', { is_nullable: false }),
    ];

    await client.tables.create({
      table_name: 'analytics_events',
      schema: analyticsSchema,
      description: 'User behavior analytics and events',
      is_public: false,
    });

    console.log('✓ Analytics table created using direct API');

    // 8. COMPREHENSIVE LISTING AND FILTERING
    console.log('\n8. Testing comprehensive listing and filtering...');

    // Method 1: Get all tables
    const { data: allTablesMethod1 } = await client.tables.findAll();
    console.log(`✓ Method 1 - Found ${allTablesMethod1?.length} total tables`);

    // Method 2: Get public tables only
    const { data: publicTables } = await client
      .table()
      .where({ is_public: true })
      .sort([{ field: 'name', order: 'asc' }])
      .findAll();
    console.log(`✓ Method 2 - Found ${publicTables?.length} public tables`);

    // Method 2: Get recent tables
    const { data: recentTables } = await client
      .table()
      .sort([{ field: 'created_at', order: 'desc' }])
      .limit(5)
      .findAll();
    console.log(
      `✓ Method 2 - Found ${recentTables?.length} most recent tables`
    );

    // 9. UPDATE OPERATIONS TESTING
    console.log('\n9. Testing various update operations...');

    // Method 2: Update multiple properties
    await client
      .table()
      .where({ name: 'users' })
      .set({
        is_shared: true,
        name: 'user_profiles',
      })
      .update();
    console.log('✓ Method 2 - Updated user table properties');

    // Method 1: Set access for analytics table
    await client.tables.setAccess({
      table_name: 'analytics_events',
      is_shared: false,
    });
    console.log('✓ Method 1 - Updated analytics table access');

    // 10. FINAL COMPREHENSIVE LISTING
    console.log('\n10. Final comprehensive table listing...');

    const { data: finalTables, pagination: finalPagination } = await client
      .table()
      .sort([{ field: 'created_at', order: 'desc' }])
      .findAll();

    console.log('✓ Final table inventory:');
    finalTables?.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
      console.log(`     - Description: ${table.description || 'N/A'}`);
      console.log(`     - Public: ${table.is_public}`);
      console.log(`     - Created: ${table.created_at}`);
      console.log(`     - DB: ${table.db_id}`);
      console.log('');
    });

    console.log(`📊 Total tables: ${finalPagination?.total}`);

    // 11. CLEANUP OPERATIONS
    console.log('\n11. Cleaning up created tables...');

    // Method 1: Delete by name
    await client.tables.delete('advanced_product_catalog');
    console.log('✓ Method 1 - Deleted advanced_product_catalog');

    // Method 2: Delete using fluent interface
    await client.table().where({ name: 'user_profiles' }).delete();
    console.log('✓ Method 2 - Deleted user_profiles');

    // Method 1: Delete with options
    await client.tables.delete({
      where: { name: 'analytics_events' },
    });
    console.log('✓ Method 1 - Deleted analytics_events');

    console.log('\n🎉 Comprehensive demo completed successfully!');
  } catch (error) {
    console.error('\n❌ Error occurred during demo:');

    if (error instanceof ValidationError) {
      console.log('🔍 Validation Error:', error.message);
      console.log('📋 Validation Failures:');
      error.failures.forEach((failure, index) => {
        console.log(`  ${index + 1}. Field: ${failure.field}`);
        console.log(`     Message: ${failure.message}`);
      });
    } else if (error instanceof ApiError) {
      console.log('🌐 API Error:', {
        status: error.statusCode,
        message: error.message,
        response: error.response,
      });
    } else {
      console.log('⚠️ Unexpected error:', error);
    }
  }
}

// Advanced schema validation demo
async function advancedSchemaValidationDemo() {
  console.log('\n=== Advanced Schema Validation Demo ===');

  // Test all field types with valid configurations
  console.log('\n1. Testing all field types with valid configurations...');

  const comprehensiveValidSchema = [
    SchemaHelpers.textField('title'),
    SchemaHelpers.longTextField('description'),
    SchemaHelpers.numberField('quantity', { decimals: 0 }),
    SchemaHelpers.currencyField('price', 'EUR'),
    SchemaHelpers.checkboxField('is_active', { default_value: true }),
    SchemaHelpers.dropdownField('status', ['active', 'inactive', 'pending']),
    SchemaHelpers.emailField('contact_email'),
    SchemaHelpers.phoneNumberField('phone', 'national'),
    SchemaHelpers.linkField('website'),
    SchemaHelpers.jsonField('metadata'),
    SchemaHelpers.dateTimeField('created_at'),
    SchemaHelpers.vectorField('embedding', 1536),
    SchemaHelpers.halfVectorField('half_embedding', 512),
    SchemaHelpers.sparseVectorField('sparse_embedding', 2048),
  ];

  const validResult = SchemaHelpers.validateSchema(comprehensiveValidSchema);
  console.log('✓ Comprehensive valid schema check:', validResult.isValid);

  // Test various invalid configurations
  console.log('\n2. Testing various validation failures...');

  const testCases = [
    {
      name: 'Duplicate field names',
      schema: [
        SchemaHelpers.textField('name'),
        SchemaHelpers.emailField('name'), // Duplicate
      ],
    },
    {
      name: 'Vector without dimension',
      schema: [
        {
          name: 'embedding',
          type: 'vector' as const,
          // Missing vector_dimension
        },
      ],
    },
    {
      name: 'HalfVec exceeding dimension limit',
      schema: [
        {
          name: 'half_embedding',
          type: 'halfvec' as const,
          vector_dimension: 70000, // Too large for halfvec
        },
      ],
    },
    {
      name: 'Invalid phone format',
      schema: [
        SchemaHelpers.phoneNumberField('phone', 'invalid_format' as any),
      ],
    },
    {
      name: 'Dropdown without items',
      schema: [
        {
          name: 'category',
          type: 'dropdown' as const,
          // Missing selectable_items
        },
      ],
    },
    {
      name: 'Too many dropdown items',
      schema: [
        {
          name: 'choice',
          type: 'dropdown' as const,
          selectable_items: Array.from({ length: 150 }, (_, i) => `option${i}`),
        },
      ],
    },
    {
      name: 'Invalid checkbox default',
      schema: [
        {
          name: 'is_enabled',
          type: 'checkbox' as const,
          default_value: 'invalid' as any,
        },
      ],
    },
    {
      name: 'Negative decimals',
      schema: [
        {
          name: 'price',
          type: 'number' as const,
          decimals: -1,
        },
      ],
    },
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n  ${index + 1}. Testing: ${testCase.name}`);
    const result = SchemaHelpers.validateSchema(testCase.schema as any);
    console.log(`     ❌ Valid: ${result.isValid}`);
    if (!result.isValid) {
      console.log(`     📋 Errors: ${result.errors.length}`);
      result.errors.forEach((error) => {
        console.log(`        - ${error}`);
      });
    }
  });
}

// Performance and stress testing demo
async function performanceTestingDemo() {
  console.log('\n=== Performance Testing Demo ===');

  console.log('\n1. Testing large schema creation...');

  // Create a large schema with many fields
  const largeSchema = Array.from({ length: 50 }, (_, index) => {
    const fieldTypes = [
      () => SchemaHelpers.textField(`text_field_${index}`),
      () => SchemaHelpers.numberField(`number_field_${index}`),
      () => SchemaHelpers.emailField(`email_field_${index}`),
      () => SchemaHelpers.checkboxField(`checkbox_field_${index}`),
      () => SchemaHelpers.dateTimeField(`date_field_${index}`),
    ];

    const randomType = fieldTypes[index % fieldTypes.length];
    return randomType();
  });

  console.log(`📏 Created schema with ${largeSchema.length} fields`);

  const startTime = Date.now();
  const result = SchemaHelpers.validateSchema(largeSchema);
  const endTime = Date.now();

  console.log(`⏱️ Validation time: ${endTime - startTime}ms`);
  console.log(`✅ Validation result: ${result.isValid}`);
  console.log(`📋 Errors found: ${result.errors.length}`);

  console.log('\n2. Testing schema validation performance...');

  const schema1 = largeSchema.slice(0, 30);
  const schema2 = [
    ...largeSchema.slice(0, 25), // Keep most fields
    ...Array.from({ length: 10 }, (_, i) =>
      SchemaHelpers.jsonField(`new_field_${i}`)
    ), // Add new fields
  ];

  const validationStart = Date.now();
  const validation1 = SchemaHelpers.validateSchema(schema1);
  const validation2 = SchemaHelpers.validateSchema(schema2);
  const validationEnd = Date.now();

  console.log(
    `⏱️ Multiple validation time: ${validationEnd - validationStart}ms`
  );
  console.log(
    `📊 Validation results: Schema1: ${validation1.isValid}, Schema2: ${validation2.isValid}`
  );
}

// Error handling and edge cases demo
async function errorHandlingDemo() {
  console.log('\n=== Error Handling Demo ===');

  const client = new BolticClient('test-api-key');
  client.useDatabase('test-db');

  const testScenarios = [
    {
      name: 'Empty schema',
      test: async () => {
        await client.tables.create({
          table_name: 'empty_table',
          schema: [],
        });
      },
    },
    {
      name: 'Invalid table name (starts with number)',
      test: async () => {
        await client.tables.create({
          table_name: '123invalid',
          schema: [SchemaHelpers.textField('title')],
        });
      },
    },
    {
      name: 'Reserved table name',
      test: async () => {
        await client.tables.create({
          table_name: 'table',
          schema: [SchemaHelpers.textField('title')],
        });
      },
    },
    {
      name: 'Table name too long',
      test: async () => {
        await client.tables.create({
          table_name: 'a'.repeat(150),
          schema: [SchemaHelpers.textField('title')],
        });
      },
    },
    {
      name: 'Description too long',
      test: async () => {
        await client.tables.create({
          table_name: 'valid_table',
          schema: [SchemaHelpers.textField('title')],
          description: 'a'.repeat(1500),
        });
      },
    },
  ];

  console.log('\n🧪 Testing error scenarios:');

  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n  ${index + 1}. ${scenario.name}:`);
    try {
      await scenario.test();
      console.log('     ❌ Expected error but operation succeeded');
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('     ✅ Caught ValidationError as expected');
        console.log(`     📋 Failures: ${error.failures.length}`);
        error.failures.forEach((failure) => {
          console.log(`        - ${failure.field}: ${failure.message}`);
        });
      } else {
        console.log('     ⚠️ Caught unexpected error type:', error);
      }
    }
  }
}

// Run all demos
async function runComprehensiveDemo() {
  console.log('🚀 Starting Comprehensive Table Operations Demo Suite');
  console.log('==================================================');

  try {
    await comprehensiveTableOperationsDemo();
    await advancedSchemaValidationDemo();
    await performanceTestingDemo();
    await errorHandlingDemo();

    console.log('\n🎉 All demos completed successfully!');
    console.log('✅ Method 1 (Direct API) tested thoroughly');
    console.log('✅ Method 2 (Fluent Interface) tested thoroughly');
    console.log('✅ All field types validated');
    console.log('✅ Error handling verified');
    console.log('✅ Performance characteristics measured');
  } catch (error) {
    console.error('\n💥 Demo suite failed:', error);
  }
}

// Export for use in other examples
export {
  advancedSchemaValidationDemo,
  comprehensiveTableOperationsDemo,
  errorHandlingDemo,
  performanceTestingDemo,
  runComprehensiveDemo,
};

// Run if this file is executed directly
if (require.main === module) {
  runComprehensiveDemo().catch(console.error);
}
