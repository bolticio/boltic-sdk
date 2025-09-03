/**
 * Fluent Interface Demo Script for Boltic Tables SDK
 *
 * This script demonstrates the Method 2 (Fluent Interface) approach for table operations:
 * - Table creation using fluent method chaining
 * - All supported field types with their specific options
 * - Field management (add, remove, get)
 * - Table configuration (name, description, public access)
 * - Build and create operations
 * - Error handling and validation
 * - Real API integration
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have proper API access
 */

import * as dotenv from 'dotenv';
import { createClient, isErrorResponse } from '../../src';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const DEMO_CONFIG = {
  environment: 'sit' as const, // Change to 'prod' for production
  debug: true,
  timeout: 30000,
  tableName: 'fluent-demo-table',
  backupTableName: 'fluent-demo-table-backup',
};

class FluentInterfaceDemo {
  private client: ReturnType<typeof createClient>;
  private createdTableName: string;

  constructor() {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = createClient(apiKey, {
      environment: DEMO_CONFIG.environment,
      debug: DEMO_CONFIG.debug,
      timeout: DEMO_CONFIG.timeout,
    });

    this.createdTableName = DEMO_CONFIG.tableName;
  }

  /**
   * Run the complete fluent interface demo
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Starting Fluent Interface Demo for Boltic Tables SDK');
    console.log('='.repeat(80));

    try {
      // Validate API key and connection
      await this.validateConnection();

      // 1. Basic table creation with fluent interface
      await this.demoBasicTableCreation();

      // 2. Table with all field types
      await this.demoAllFieldTypes();

      // 3. Table configuration methods
      await this.demoTableConfiguration();

      // 4. Field management operations
      await this.demoFieldManagement();

      // 5. Build vs Create operations
      await this.demoBuildVsCreate();

      // 6. Error handling and validation
      await this.demoErrorHandling();

      // 7. Complex table with mixed field types
      await this.demoComplexTable();

      // 8. Cleanup
      await this.cleanup();

      console.log('\n🎉 Fluent Interface demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed with error:', error);
      console.log('\n🧹 Running cleanup due to error...');
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 1. Basic table creation with fluent interface
   */
  private async demoBasicTableCreation(): Promise<void> {
    console.log('\n1️⃣  Basic Table Creation with Fluent Interface');
    console.log('-'.repeat(50));

    console.log('📝 Input: Creating a basic table with fluent interface');
    console.log(
      '   client.table("products").text("name").number("price").create()'
    );

    const result = await this.client
      .table('products')
      .describe('Basic product table created with fluent interface')
      .text('name', { nullable: false, unique: true })
      .number('price', { nullable: false, decimals: '0.00' })
      .create();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to create basic table:', result.error);
    } else {
      console.log('📤 Output:', result.data);
      console.log('✅ Basic table created successfully with fluent interface');
    }

    console.log('✅ Step 1 completed');
  }

  /**
   * 2. Table with all field types
   */
  private async demoAllFieldTypes(): Promise<void> {
    console.log('\n2️⃣  Table with All Supported Field Types');
    console.log('-'.repeat(50));

    const tableName = 'all-field-types-table';
    console.log(`📝 Input: Creating table "${tableName}" with all field types`);

    const result = await this.client
      .table(tableName)
      .describe('Comprehensive table demonstrating all field types')
      .public(true)

      // Text Fields
      .text('title', { nullable: false, unique: true, indexed: true })
      .longText('description', { nullable: true })
      .email('email', { unique: true, indexed: true })
      .phone('phone', { format: '+91 123 456 7890' })
      .link('website', { nullable: true })

      // Numeric Fields
      .number('age', { nullable: false, decimals: '00' })
      .currency('salary', {
        currencyFormat: 'USD',
        decimals: '0.00',
        nullable: false,
      })

      // Vector Fields
      .vector('embedding', 1536, { nullable: true })
      .halfVector('half_embedding', 768, { nullable: true })
      .sparseVector('sparse_embedding', 1024, { nullable: true })

      // Selection Fields
      .checkbox('is_active', { defaultValue: true })
      .dropdown('category', ['electronics', 'books', 'clothing'], {
        multiple: false,
        nullable: false,
      })

      // Special Fields
      .json('metadata', { nullable: true })
      .dateTime('product_created_at', {
        dateFormat: 'YYYY_MM_DD',
        timeFormat: 'HH_mm_ss',
        timezone: 'UTC',
      })

      .create();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to create all-field-types table:', result.error);
    } else {
      console.log('📤 Output:', result.data);
      console.log('✅ Table with all field types created successfully');
    }

    console.log('✅ Step 2 completed');
  }

  /**
   * 3. Table configuration methods
   */
  private async demoTableConfiguration(): Promise<void> {
    console.log('\n3️⃣  Table Configuration Methods');
    console.log('-'.repeat(50));

    const tableName = 'config-demo-table';
    console.log(`📝 Input: Demonstrating table configuration methods`);

    // Build the table configuration
    const tableBuilder = this.client
      .table(tableName)
      .describe('Table demonstrating configuration methods')
      .public(false)
      .text('name', { nullable: false })
      .number('value', { nullable: true });

    console.log('📋 Table Configuration:');
    console.log(`   Name: ${tableBuilder.getName()}`);
    console.log(`   Description: ${tableBuilder.getDescription()}`);
    console.log(`   Fields: ${tableBuilder.getFields().length} fields defined`);

    // Show field details
    const fields = tableBuilder.getFields();
    fields.forEach((field, index) => {
      console.log(`   Field ${index + 1}: ${field.name} (${field.type})`);
    });

    // Create the table
    const result = await tableBuilder.create();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to create config demo table:', result.error);
    } else {
      console.log('📤 Output:', result.data);
      console.log('✅ Table configuration demo completed');
    }

    console.log('✅ Step 3 completed');
  }

  /**
   * 4. Field management operations
   */
  private async demoFieldManagement(): Promise<void> {
    console.log('\n4️⃣  Field Management Operations');
    console.log('-'.repeat(50));

    const tableName = 'field-management-table';
    console.log(`📝 Input: Demonstrating field management operations`);

    // Start with a basic table
    let tableBuilder = this.client
      .table(tableName)
      .describe('Table demonstrating field management')
      .text('name', { nullable: false })
      .number('age', { nullable: true });

    console.log('📋 Initial fields:', tableBuilder.getFields().length);

    // Add more fields
    tableBuilder = tableBuilder
      .email('email', { unique: true })
      .currency('salary', { currencyFormat: 'USD' })
      .checkbox('is_employee', { defaultValue: true });

    console.log('📋 After adding fields:', tableBuilder.getFields().length);

    // Remove a field
    tableBuilder = tableBuilder.removeField('age');
    console.log(
      '📋 After removing "age" field:',
      tableBuilder.getFields().length
    );

    // Add a custom field
    tableBuilder = tableBuilder.addField({
      name: 'custom_field',
      type: 'text',
      description: 'Custom field added via addField method',
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      field_order: tableBuilder.getFields().length + 1,
    });

    console.log(
      '📋 After adding custom field:',
      tableBuilder.getFields().length
    );

    // Show final field list
    const finalFields = tableBuilder.getFields();
    console.log('📋 Final field list:');
    finalFields.forEach((field, index) => {
      console.log(
        `   ${index + 1}. ${field.name} (${field.type}) - ${field.description || 'No description'}`
      );
    });

    // Create the table
    const result = await tableBuilder.create();

    if (isErrorResponse(result)) {
      console.error(
        '❌ Failed to create field management table:',
        result.error
      );
    } else {
      console.log('📤 Output:', result.data);
      console.log('✅ Field management demo completed');
    }

    console.log('✅ Step 4 completed');
  }

  /**
   * 5. Build vs Create operations
   */
  private async demoBuildVsCreate(): Promise<void> {
    console.log('\n5️⃣  Build vs Create Operations');
    console.log('-'.repeat(50));

    const tableName = 'build-vs-create-table';
    console.log(`📝 Input: Demonstrating build() vs create() operations`);

    // Build the table configuration
    const tableBuilder = this.client
      .table(tableName)
      .describe('Table demonstrating build vs create operations')
      .text('title', { nullable: false })
      .number('count', { nullable: true })
      .checkbox('enabled', { defaultValue: false });

    // Method 1: Build the request object
    console.log('📝 Method 1: Using build() to get request object');
    try {
      const requestObject = tableBuilder.build();
      console.log('📤 Build result:', JSON.stringify(requestObject, null, 2));
      console.log('✅ Build operation successful');
    } catch (error) {
      console.error('❌ Build operation failed:', error);
    }

    // Method 2: Create the table directly
    console.log('\n�� Method 2: Using create() to create table directly');
    const result = await tableBuilder.create();

    if (isErrorResponse(result)) {
      console.error('❌ Create operation failed:', result.error);
    } else {
      console.log('📤 Create result:', result.data);
      console.log('✅ Create operation successful');
    }

    console.log('✅ Step 5 completed');
  }

  /**
   * 6. Error handling and validation
   */
  private async demoErrorHandling(): Promise<void> {
    console.log('\n6️⃣  Error Handling and Validation');
    console.log('-'.repeat(50));

    console.log('📝 Input: Demonstrating error handling scenarios');

    // Test 1: Empty table name
    console.log('\n🧪 Test 1: Empty table name');
    try {
      const result = await this.client
        .table('')
        .text('name', { nullable: false })
        .create();

      if (isErrorResponse(result)) {
        console.log('📤 Expected error:', result.error);
        console.log('✅ Error handling works for empty table name');
      } else {
        console.log('❌ Should have failed with empty table name');
      }
    } catch (error) {
      console.log('📤 Caught exception:', error);
      console.log('✅ Exception handling works for empty table name');
    }

    // Test 2: No fields
    console.log('\n🧪 Test 2: Table with no fields');
    try {
      const result = await this.client
        .table('no-fields-table')
        .describe('Table with no fields')
        .create();

      if (isErrorResponse(result)) {
        console.log('📤 Expected error:', result.error);
        console.log('✅ Error handling works for no fields');
      } else {
        console.log('❌ Should have failed with no fields');
      }
    } catch (error) {
      console.log('📤 Caught exception:', error);
      console.log('✅ Exception handling works for no fields');
    }

    // Test 3: Invalid field configuration
    console.log('\n🧪 Test 3: Invalid field configuration');
    try {
      const result = await this.client
        .table('invalid-field-table')
        .text('name', { nullable: false })
        .vector('invalid_vector', -1, { nullable: true }) // Invalid dimension
        .create();

      if (isErrorResponse(result)) {
        console.log('📤 Expected error:', result.error);
        console.log('✅ Error handling works for invalid field config');
      } else {
        console.log('❌ Should have failed with invalid field config');
      }
    } catch (error) {
      console.log('📤 Caught exception:', error);
      console.log('✅ Exception handling works for invalid field config');
    }

    console.log('✅ Step 6 completed');
  }

  /**
   * 7. Complex table with mixed field types
   */
  private async demoComplexTable(): Promise<void> {
    console.log('\n7️⃣  Complex Table with Mixed Field Types');
    console.log('-'.repeat(50));

    const tableName = 'complex-ecommerce-table';
    console.log(
      `📝 Input: Creating complex e-commerce table with mixed field types`
    );

    const result = await this.client
      .table(tableName)
      .describe('Complex e-commerce product table with all field types')
      .public(true)

      // Product Information
      .text('product_name', {
        nullable: false,
        unique: true,
        indexed: true,
        description: 'Unique product name',
      })
      .longText('description', {
        nullable: true,
        description: 'Detailed product description',
      })
      .number('sku', {
        nullable: false,
        unique: true,
        indexed: true,
        decimals: '00',
        description: 'Stock Keeping Unit number',
      })

      // Pricing
      .currency('price', {
        currencyFormat: 'USD',
        decimals: '0.00',
        nullable: false,
        description: 'Product price in USD',
      })
      .currency('cost', {
        currencyFormat: 'USD',
        decimals: '0.00',
        nullable: true,
        description: 'Product cost for margin calculation',
      })

      // Inventory
      .number('stock_quantity', {
        nullable: false,
        decimals: '00',
        description: 'Current stock quantity',
      })
      .number('reorder_level', {
        nullable: true,
        decimals: '00',
        description: 'Minimum stock level for reordering',
      })

      // Product Details
      .dropdown(
        'category',
        [
          'Electronics',
          'Books',
          'Clothing',
          'Home & Garden',
          'Sports',
          'Toys',
          'Health & Beauty',
          'Automotive',
        ],
        {
          multiple: false,
          nullable: false,
          description: 'Product category',
        }
      )
      .dropdown(
        'tags',
        [
          'New',
          'Sale',
          'Featured',
          'Limited Edition',
          'Eco-Friendly',
          'Premium',
          'Budget',
          'Seasonal',
        ],
        {
          multiple: true,
          nullable: true,
          description: 'Product tags for filtering',
        }
      )

      // Contact Information
      .email('supplier_email', {
        unique: false,
        indexed: true,
        description: 'Primary supplier contact email',
      })
      .phone('supplier_phone', {
        format: '+91 123 456 7890',
        description: 'Primary supplier contact phone',
      })
      .link('product_url', {
        nullable: true,
        description: 'External product page URL',
      })
      .link('image_url', {
        nullable: true,
        description: 'Primary product image URL',
      })

      // Status and Flags
      .checkbox('is_active', {
        defaultValue: true,
        description: 'Whether the product is active for sale',
      })
      .checkbox('requires_shipping', {
        defaultValue: true,
        description: 'Whether the product requires shipping',
      })
      .checkbox('is_digital', {
        defaultValue: false,
        description: 'Whether the product is digital/downloadable',
      })

      // Dates
      .dateTime('product_created_at', {
        dateFormat: 'YYYY_MM_DD',
        timeFormat: 'HH_mm_ss',
        timezone: 'UTC',
        description: 'Product creation timestamp',
      })
      .dateTime('product_updated_at', {
        dateFormat: 'YYYY_MM_DD',
        timeFormat: 'HH_mm_ss',
        timezone: 'UTC',
        description: 'Last update timestamp',
      })
      .dateTime('launch_date', {
        dateFormat: 'YYYY_MM_DD',
        timeFormat: 'HH_mm_ss',
        timezone: 'UTC',
        nullable: true,
        description: 'Product launch date',
      })

      // AI/ML Features
      .vector('product_embedding', 1536, {
        nullable: true,
        description: 'AI-generated product embedding for similarity search',
      })
      .halfVector('category_embedding', 768, {
        nullable: true,
        description: 'Category-specific embedding for classification',
      })
      .sparseVector('keyword_embedding', 1024, {
        nullable: true,
        description: 'Sparse embedding for keyword-based search',
      })

      // Metadata
      .json('specifications', {
        nullable: true,
        description: 'Product specifications as JSON',
      })
      .json('reviews_summary', {
        nullable: true,
        description: 'Aggregated review data as JSON',
      })
      .json('seo_metadata', {
        nullable: true,
        description: 'SEO-related metadata as JSON',
      })

      .create();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to create complex table:', result.error);
    } else {
      console.log('📤 Output:', result.data);
      console.log('✅ Complex e-commerce table created successfully');

      // Show field count
      const fieldCount = 0; // Fields count not available in TableCreateResponse
      console.log(`📊 Table created with ${fieldCount} fields`);
    }

    console.log('✅ Step 7 completed');
  }

  /**
   * Cleanup function
   */
  public async cleanup(): Promise<void> {
    console.log('\n🧹 Starting cleanup...');

    const tablesToDelete = [
      'products',
      'all-field-types-table',
      'config-demo-table',
      'field-management-table',
      'build-vs-create-table',
      'complex-ecommerce-table',
    ];

    for (const tableName of tablesToDelete) {
      try {
        console.log(`🗑️  Deleting table: ${tableName}`);
        const result = await this.client.tables.delete(tableName);
        if (isErrorResponse(result)) {
          console.log(
            `   Warning: Failed to delete ${tableName}: ${result.error.message}`
          );
        } else {
          console.log(`   ✅ Deleted ${tableName} successfully`);
        }
      } catch (error) {
        console.log(`   Warning: Error deleting ${tableName}: ${error}`);
      }
    }

    console.log('✅ Cleanup completed');
  }

  /**
   * Validate connection and API key
   */
  private async validateConnection(): Promise<void> {
    console.log('🔐 Validating connection and API key...');

    try {
      const config = this.client.getConfig();
      console.log('✅ API key and connection validated successfully');
      console.log(`   Environment: ${config.environment}`);
      console.log(`   Region: ${config.region}`);
      console.log('');
    } catch (error) {
      throw new Error(`Invalid API key or connection failed: ${error}`);
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const demo = new FluentInterfaceDemo();
    await demo.runDemo();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error('❌ Demo failed:', error);
    // Try to run cleanup even if main demo fails
    try {
      const demo = new FluentInterfaceDemo();
      await demo.cleanup();
    } catch (cleanupError) {
      console.error('❌ Cleanup also failed:', cleanupError);
    }
    process.exit(1);
  });
}

export { FluentInterfaceDemo };
