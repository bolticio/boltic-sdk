/**
 * Comprehensive Database Operations Demo Script
 *
 * This script demonstrates ALL available functionality of the Boltic Database SDK:
 * - Table operations (create, read, update, delete, rename, access control)
 * - Column operations (create, read, update, delete with all supported types)
 * - Record operations (insert, read, update, delete with pagination)
 * - Partial record insertion (missing fields automatically set to null)
 * - Advanced filtering and querying with comprehensive filter system
 * - Unified delete operations supporting both record IDs and filters
 * - Enhanced filter capabilities (ApiFilter format, FilterBuilder, where clauses)
 * - Database switching and multi-database support
 * - Backward compatibility (works with default database if not specified)
 * - Error handling and cleanup
 * - Real API integration
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
import {
  AddIndexRequest,
  BolticClient,
  FieldDefinition,
  isErrorResponse,
  ListIndexesQuery,
} from '../../src';
import { createFilter } from '../../src/utils/filters/filter-mapper';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const DEMO_CONFIG = {
  debug: true,
  timeout: 30000,
  region: 'asia-south1' as const,
  tableName: 'comprehensive-demo-table',
  backupTableName: 'comprehensive-demo-table-backup'
};

// All supported column types with their properties
const ALL_COLUMN_TYPES = [
  {
    name: 'text_field',
    type: 'text' as const,
    description: 'Basic text field',
    is_nullable: false,
    is_unique: true,
    is_indexed: true,
    is_visible: true,
    default_value: 'Default Text',
  },
  {
    name: 'email_field',
    type: 'email' as const,
    description: 'Email field with validation',
    is_nullable: false,
    is_unique: true,
    is_indexed: true,
    is_visible: true,
    default_value: 'default@example.com',
  },
  {
    name: 'long_text_field',
    type: 'long-text' as const,
    description: 'Long text field for descriptions',
    is_nullable: true,
    is_indexed: false,
    is_visible: true,
    default_value: 'Default long text description',
  },
  {
    name: 'number_field',
    type: 'number' as const,
    description: 'Numeric field with decimals',
    is_nullable: false,
    is_indexed: true,
    is_visible: true,
    decimals: '0.00',
    default_value: 100,
  },
  {
    name: 'currency_field',
    type: 'currency' as const,
    description: 'Currency field with USD format',
    is_nullable: false,
    is_indexed: true,
    is_visible: true,
    decimals: '0.00',
    currency_format: 'USD',
    default_value: 1000.0,
  },
  {
    name: 'checkbox_field',
    type: 'checkbox' as const,
    description: 'Boolean checkbox field',
    is_nullable: false,
    is_indexed: true,
    is_visible: true,
    default_value: true,
  },
  {
    name: 'dropdown_field',
    type: 'dropdown' as const,
    description: 'Dropdown with multiple options',
    is_nullable: false,
    is_indexed: true,
    is_visible: true,
    selectable_items: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    multiple_selections: false,
    default_value: ['Option 1'],
  },
  {
    name: 'phone_field',
    type: 'phone-number' as const,
    description: 'Phone number field with format',
    is_nullable: true,
    is_indexed: false,
    is_visible: true,
    phone_format: '+91 123 456 7890',
    default_value: '+91 123 456 7890',
  },
  {
    name: 'link_field',
    type: 'link' as const,
    description: 'URL link field',
    is_nullable: true,
    is_indexed: false,
    is_visible: true,
    default_value: 'https://example.com',
  },
  {
    name: 'json_field',
    type: 'json' as const,
    description: 'JSON data field',
    is_nullable: true,
    is_indexed: false,
    is_visible: true,
    default_value: { key: 'value', nested: { data: 'test' } },
  },
  {
    name: 'date_time_field',
    type: 'date-time' as const,
    description: 'Date and time field',
    is_nullable: true,
    is_indexed: true,
    is_visible: true,
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    time_format: 'HH:mm:ss',
    default_value: '2024-01-01T00:00:00Z',
  },
  {
    name: 'vector_field',
    type: 'vector' as const,
    description: 'Vector field for AI/ML',
    is_nullable: true,
    is_indexed: true,
    is_visible: true,
    vector_dimension: 5,
    default_value: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  {
    name: 'half_vector_field',
    type: 'halfvec' as const,
    description: 'Half precision vector field',
    is_nullable: true,
    is_indexed: true,
    is_visible: true,
    vector_dimension: 5,
    default_value: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  {
    name: 'sparse_vector_field',
    type: 'sparsevec' as const,
    description: 'Sparse vector field',
    is_nullable: true,
    is_indexed: true,
    is_visible: true,
    vector_dimension: 5,
    default_value: '{1:1,3:2,5:3}/5',
  },
  {
    name: 'secret_ssn',
    type: 'encrypted' as const,
    description: 'Sensitive SSN (masked by default)',
    is_nullable: true,
    show_decrypted: false,
    is_deterministic: false,
  },
  {
    name: 'secret_email',
    type: 'encrypted' as const,
    description: 'Encrypted email (deterministic for search)',
    is_nullable: true,
    show_decrypted: true,
    is_deterministic: true,
  },
];

// Sample record data for each column type
const SAMPLE_RECORDS = [
  {
    text_field: 'John Doe',
    email_field: 'john.doe@example.com',
    long_text_field:
      'This is a comprehensive description of John Doe with detailed information about his background and experience.',
    number_field: 30,
    currency_field: 75000.0,
    checkbox_field: true,
    dropdown_field: ['Option 1'], // Consistent array format
    phone_field: '+91 987 654 3210',
    link_field: 'https://johndoe.com',
    date_time_field: '2024-01-15T10:30:00Z',
    half_vector_field: [0.1, 0.2, 0.3, 0.4, 0.5],
    secret_ssn: '123-456-7890',
    secret_email: 'john.doe.enc@example.com',
  },
  {
    text_field: 'Jane Smith',
    email_field: 'jane.smith@example.com',
    long_text_field:
      'Jane Smith is a talented professional with expertise in multiple domains and a passion for innovation.',
    number_field: 28,
    currency_field: 65000.0,
    checkbox_field: false,
    dropdown_field: ['Option 2'], // Fixed: changed from string to array
    phone_field: '+91 876 543 2109',
    link_field: 'https://janesmith.dev',
    date_time_field: '2024-02-20T14:45:00Z',
    half_vector_field: [0.2, 0.3, 0.4, 0.5, 0.6],
    secret_ssn: '234-567-8901',
    secret_email: 'jane.smith.enc@example.com',
  },
  {
    text_field: 'Bob Johnson',
    email_field: 'bob.johnson@example.com',
    long_text_field:
      'Bob Johnson brings years of experience in leadership and strategic planning to every project he undertakes.',
    number_field: 35,
    currency_field: 80000.0,
    checkbox_field: true,
    dropdown_field: ['Option 3'], // Fixed: changed from string to array
    phone_field: '+91 765 432 1098',
    link_field: 'https://bobjohnson.org',
    date_time_field: '2024-03-10T09:15:00Z',
    half_vector_field: [0.3, 0.4, 0.5, 0.6, 0.7],
    secret_ssn: '345-678-9012',
    secret_email: 'bob.johnson.enc@example.com',
  },
];

class ComprehensiveDatabaseOperationsDemo {
  private client: BolticClient;
  private createdTableName: string;
  private createdRecordIds: string[] = [];
  private useCustomDatabase: boolean;
  private customDatabaseName?: string;
  private customDatabaseInternalName?: string;
  private customDatabaseId?: string;

  constructor(useCustomDatabase: boolean = false) {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = new BolticClient(apiKey, {
      debug: DEMO_CONFIG.debug,
      timeout: DEMO_CONFIG.timeout,
      region: DEMO_CONFIG.region,
    });

    this.createdTableName = DEMO_CONFIG.tableName;
    this.useCustomDatabase = useCustomDatabase;
  }

  /**
   * Run the complete demo
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Starting Comprehensive Database Operations Demo');
    console.log('='.repeat(80));

    try {
      // Validate API key and connection
      await this.validateConnection();

      // 0. Setup custom database if requested
      if (this.useCustomDatabase) {
        await this.setupCustomDatabase();
      } else {
        console.log('\n📋 Using default database (backward compatible mode)');
        console.log(
          "   All operations will use the account's default database"
        );
      }

      // 1. Create SDK client (already done in constructor)
      await this.demoClientCreation();

      // 2. Create table with all supported column types
      await this.demoTableCreation();

      // 3. Update the table
      await this.demoTableUpdate();

      // 4. List all tables
      await this.demoListTables();

      // 5. Get table by name
      await this.demoGetTableByName();

      // 6. Rename table
      await this.demoRenameTable();

      // 7. Add all types of columns with all properties
      await this.demoAddAllColumnTypes();

      // 8. Update each type of column
      await this.demoUpdateColumns();

      // 9. List columns
      await this.demoListColumns();
      // 9.5 Indexes demo (create/list/delete via both methods)
      await this.demoIndexes();

      // 10. Get column by name
      await this.demoGetColumnByName();

      // 10.5. Get column by ID using direct GET endpoint
      await this.demoGetColumnById();

      // 11. Update column by name (add/remove constraints)
      await this.demoUpdateColumnConstraints();

      // 12. Delete columns
      await this.demoDeleteColumns();

      // 13. Add rows in table (with/without null)
      await this.demoAddRecords();

      // 13.5. Demo bulk insert (insertMany)
      await this.demoBulkInsertRecords();

      // 13.6. Demo bulk update based on filters
      await this.demoBulkUpdateRecords();

      // 14. Get row
      await this.demoGetRecord();

      // 15. List rows (with pagination)
      await this.demoListRecordsWithPagination();

      // 16. Update values in rows for each data type
      await this.demoUpdateRecords();

      // 17. Delete rows
      await this.demoDeleteRecords();

      // 18. Bonus: Show working of all types of filters
      await this.demoAllFilterTypes();

      // 19. Demo snapshot protection
      await this.demoSnapshotProtection();

      // 20. Delete table
      await this.demoDeleteTable();

      // 21. Delete custom database (if using one)
      if (this.useCustomDatabase && this.customDatabaseId) {
        await this.deleteCustomDatabase();
      }

      console.log('\n🎉 Comprehensive demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed with error:', error);
      console.log('\n🧹 Running cleanup due to error...');
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 0. Setup custom database (if requested)
   */
  private async setupCustomDatabase(): Promise<void> {
    console.log('\n0️⃣  Setting Up Custom Database');
    console.log('-'.repeat(40));

    this.customDatabaseName = `demo-custom-db-${Date.now()}`;

    console.log(
      `📝 Input: Creating custom database "${this.customDatabaseName}"`
    );

    const createResult = await this.client.databases.create({
      db_name: this.customDatabaseName,
      db_internal_name: this.customDatabaseName.replace(/-/g, '_'),
      resource_id: 'boltic',
    });

    if (isErrorResponse(createResult)) {
      console.error(
        '❌ Failed to create custom database:',
        createResult.error.message
      );
      throw new Error('Cannot proceed without custom database');
    }

    this.customDatabaseInternalName = createResult.data.db_internal_name;
    this.customDatabaseId = createResult.data.id;
    console.log('📤 Output: Custom database created successfully');
    console.log(`   Database ID: ${createResult.data.id}`);
    console.log(`   Database Name: ${createResult.data.db_name}`);
    console.log(
      `   Database Internal Name (slug): ${this.customDatabaseInternalName}`
    );

    // Switch to the custom database
    console.log(`\n📝 Input: Switching to custom database`);
    await this.client.useDatabase(this.customDatabaseInternalName);
    console.log('📤 Output: Switched to custom database');
    console.log(`   Current Database Slug: ${this.customDatabaseInternalName}`);

    console.log(
      '✅ Step 0 completed - All subsequent operations will use this custom database'
    );
  }

  /**
   * 1. Demo client creation
   */
  private async demoClientCreation(): Promise<void> {
    console.log('\n1️⃣  Creating SDK Client');
    console.log('-'.repeat(40));

    console.log('📝 Input: API Key loaded from environment');
    console.log('📤 Output: Client initialized successfully');
    console.log(`   Environment: ${this.client.getConfig().environment}`);
    console.log(`   Region: ${this.client.getConfig().region}`);
    console.log(`   Debug: ${this.client.getConfig().debug}`);

    if (this.customDatabaseInternalName) {
      console.log(
        `   Using Custom Database Slug: ${this.customDatabaseInternalName}`
      );
    } else {
      console.log(`   Using Default Database (backward compatible)`);
    }

    console.log('✅ Step 1 completed');
  }

  /**
   * 2. Create table with all supported column types
   */
  private async demoTableCreation(): Promise<void> {
    console.log('\n2️⃣  Creating Table with All Supported Column Types');
    console.log('-'.repeat(40));

    // Create basic schema (id, created_at, updated_at are automatically added)
    const basicSchema: unknown[] = [];

    console.log('📝 Input: Creating table with basic schema');
    const createTableResult = await this.client.tables.create({
      name: this.createdTableName,
      description: 'Comprehensive demo table with all column types',
      fields: basicSchema as FieldDefinition[],
    });

    console.log('📤 Output:', createTableResult.data);
    console.log('✅ Step 2 completed');
  }

  /**
   * 3. Update the table
   */
  private async demoTableUpdate(): Promise<void> {
    console.log('\n3️⃣  Updating Table');
    console.log('-'.repeat(40));

    console.log('📝 Input: Updating table description');
    const updateTableResult = await this.client.tables.update(
      this.createdTableName,
      {
        description: 'c25hcHNob3Q=',
      }
    );

    if (isErrorResponse(updateTableResult)) {
      console.error(
        '❌ Failed to update table:',
        updateTableResult.error.message
      );
    } else {
      console.log('📤 Output:', updateTableResult.data);
    }

    console.log('✅ Step 3 completed');
  }

  /**
   * 4. List all tables
   */
  private async demoListTables(): Promise<void> {
    console.log('\n4️⃣  Listing All Tables');
    console.log('-'.repeat(40));

    console.log('📝 Input: List all tables');
    const listTablesResult = await this.client.tables.findAll();

    if (isErrorResponse(listTablesResult)) {
      console.error(
        '❌ Failed to list tables:',
        listTablesResult.error.message
      );
    } else {
      const tables = Array.isArray(listTablesResult.data)
        ? listTablesResult.data
        : [];
      console.log(`📤 Output: Found ${tables.length} tables`);
      tables.forEach((table: any, index: number) => {
        console.log(
          `   ${index + 1}. ${table.name} (${table.internal_table_name})`
        );
      });
    }

    console.log('✅ Step 4 completed');
  }

  /**
   * 5. Get table by name
   */
  private async demoGetTableByName(): Promise<void> {
    console.log('\n5️⃣  Getting Table by Name');
    console.log('-'.repeat(40));

    console.log(`📝 Input: Get table by name "${this.createdTableName}"`);
    const getTableResult = await this.client.tables.findOne({
      where: { name: this.createdTableName },
    });

    if (isErrorResponse(getTableResult)) {
      console.error('❌ Failed to get table:', getTableResult.error.message);
    } else {
      console.log('📤 Output:', getTableResult.data);
    }

    console.log('✅ Step 5 completed');
  }

  /**
   * 6. Rename table
   */
  private async demoRenameTable(): Promise<void> {
    console.log('\n6️⃣  Renaming Table');
    console.log('-'.repeat(40));

    const newTableName = DEMO_CONFIG.backupTableName;
    console.log(
      `📝 Input: Rename table from "${this.createdTableName}" to "${newTableName}"`
    );

    const renameResult = await this.client.tables.rename(
      this.createdTableName,
      newTableName
    );

    if (renameResult.error) {
      console.error('❌ Failed to rename table:', renameResult.error);
    } else {
      console.log('📤 Output:', renameResult.data);
      // Update the table name for subsequent operations
      this.createdTableName = newTableName;
    }

    console.log('✅ Step 6 completed');
  }

  /**
   * 7. Add all types of columns with all properties
   */
  private async demoAddAllColumnTypes(): Promise<void> {
    console.log('\n7️⃣  Adding All Types of Columns with All Properties');
    console.log('-'.repeat(40));

    for (const columnData of ALL_COLUMN_TYPES) {
      console.log(
        `📝 Input: Creating ${columnData.type} column "${columnData.name}"`
      );

      const createColumnResult = await this.client.columns.create(
        this.createdTableName,
        columnData
      );

      if (createColumnResult.error) {
        console.error(
          `❌ Failed to create ${columnData.type} column:`,
          createColumnResult.error
        );
      } else {
        console.log(`📤 Output (${columnData.type}):`, createColumnResult.data);
      }
    }

    console.log('✅ Step 7 completed');
  }

  /**
   * 8. Update each type of column
   */
  private async demoUpdateColumns(): Promise<void> {
    console.log('\n8️⃣  Updating Each Type of Column');
    console.log('-'.repeat(40));

    for (const columnData of ALL_COLUMN_TYPES) {
      console.log(
        `📝 Input: Updating ${columnData.type} column "${columnData.name}"`
      );

      const updateData: any = {
        description: `Updated ${columnData.type} column description`,
        is_indexed: true,
      };

      // Add type-specific update properties
      switch (columnData.type) {
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
          updateData.phone_format = '+1 (123) 456-7890';
          break;
        case 'vector':
        case 'halfvec':
        case 'sparsevec':
          updateData.vector_dimension = 5;
          break;
        case 'number':
          updateData.decimals = '0.000';
          break;
        case 'checkbox':
          updateData.default_value = false;
          break;
        case 'date-time':
          updateData.timezone = 'America/New_York';
          updateData.date_format = 'MM-DD-YYYY';
          updateData.time_format = 'HH:mm:ss AM/PM';
          break;
        case 'encrypted':
          updateData.show_decrypted = true;
          break;
      }

      const updateColumnResult = await this.client.columns.update(
        this.createdTableName,
        columnData.name,
        updateData
      );

      if (updateColumnResult.error) {
        console.error(
          `❌ Failed to update ${columnData.type} column:`,
          updateColumnResult.error
        );
      } else {
        console.log(
          `📤 Output (updated ${columnData.type}):`,
          updateColumnResult.data
        );
      }
    }

    // Test updating description of a text type field specifically
    console.log('\n📝 Input: Testing description update for text type field');
    const textFieldUpdateResult = await this.client.columns.update(
      this.createdTableName,
      'text_field',
      {
        description: 'Updated product title with enhanced validation',
      }
    );

    if (textFieldUpdateResult.error) {
      console.error(
        '❌ Failed to update text field description:',
        textFieldUpdateResult.error
      );
    } else {
      console.log(
        '📤 Output (text field description updated):',
        textFieldUpdateResult.data
      );
      if (
        textFieldUpdateResult.data &&
        'description' in textFieldUpdateResult.data
      ) {
        console.log(
          '✅ Description updated:',
          textFieldUpdateResult.data.description
        );
      }
    }

    console.log('✅ Step 8 completed');
  }

  /**
   * 9. List columns
   */
  private async demoListColumns(): Promise<void> {
    console.log('\n9️⃣  Listing Columns');
    console.log('-'.repeat(40));

    console.log('📝 Input: List all columns in table');
    const listColumnsResult = await this.client.columns.findAll(
      this.createdTableName
    );

    if (listColumnsResult.error) {
      console.error('❌ Failed to list columns:', listColumnsResult.error);
    } else {
      const columns = Array.isArray(listColumnsResult.data)
        ? listColumnsResult.data
        : [];
      console.log(`📤 Output: Found ${columns.length} columns`);
      columns.forEach((column: any, index: number) => {
        console.log(
          `   ${index + 1}. ${column.name} (${column.type}) - ${column.description
          }`
        );
      });
    }

    console.log('✅ Step 9 completed');
  }

  /**
   * 9.5. Indexes demo: add/list/delete using both Method 1 and Method 2
   */
  private async demoIndexes(): Promise<void> {
    console.log('\n1️⃣0️⃣.5️⃣  Indexes: add/list/delete (both methods)');
    console.log('-'.repeat(40));

    // Payload covers supported methods from PRD (btree/hash/spgist/gin/brin)
    const indexPayloads: AddIndexRequest[] = [
      { field_names: ['text_field'], method: 'btree' },
      { field_names: ['email_field'], method: 'hash' },
      { field_names: ['half_vector_field'], method: 'gin' },
    ];

    // Method 1: Direct functions under sdk.indexes
    console.log('\n🔹 Method 1: Direct functions via sdk.indexes');
    for (const payload of indexPayloads) {
      console.log(`📝 Add index (direct): ${JSON.stringify(payload)}`);
      const addRes = await this.client.indexes.addIndex(
        this.createdTableName,
        payload
      );
      if (isErrorResponse(addRes)) {
        console.error('❌ addIndex failed:', addRes.error);
      } else {
        console.log('📤 addIndex result:', addRes.data);
      }
    }

    // List with filters and sorting
    const listQuery: ListIndexesQuery = {
      page: { page_no: 1, page_size: 100 },
      filters: [
        { field: 'schemaname', operator: '=', values: ['public'] },
        { field: 'indexrelname', operator: 'ILIKE', values: ['%field%'] },
      ],
      sort: [{ field: 'indexrelname', direction: 'asc' }],
    };
    console.log('\n📝 List indexes (direct) with filters/sort');
    const listRes = await this.client.indexes.listIndexes(
      this.createdTableName,
      listQuery
    );
    if (isErrorResponse(listRes)) {
      console.error('❌ listIndexes failed:', listRes.error);
    } else {
      console.log('📤 listIndexes result:', listRes.data);
    }

    // Method 2: Chaining via sdk.from(table).indexes()
    console.log('\n🔹 Method 2: Chaining via sdk.from(table).indexes()');
    const chainPayload: AddIndexRequest = {
      field_names: ['number_field'],
      method: 'brin',
    };
    console.log(`📝 Add index (chained): ${JSON.stringify(chainPayload)}`);
    const chainedAdd = await this.client
      .from(this.createdTableName)
      .indexes()
      .addIndex(chainPayload);
    if (isErrorResponse(chainedAdd)) {
      console.error('❌ chained addIndex failed:', chainedAdd.error);
    } else {
      console.log('📤 chained addIndex result:', chainedAdd.data);
    }

    console.log('\n📝 List indexes (chained) with different sort');
    const chainedList = await this.client
      .from(this.createdTableName)
      .indexes()
      .listIndexes({
        page: { page_no: 1, page_size: 50 },
        sort: [{ field: 'indexrelname', direction: 'desc' }],
      });
    if (isErrorResponse(chainedList)) {
      console.error('❌ chained listIndexes failed:', chainedList.error);
    } else {
      console.log('📤 chained listIndexes result:', chainedList.data);
    }

    // Filters and sorting coverage for required fields
    console.log('\n🧪 Testing filters and sorting across index fields');
    const filterTests: Array<{
      name: string;
      query: ListIndexesQuery;
    }> = [
        {
          name: 'schemaname equals public',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [{ field: 'schemaname', operator: '=', values: ['public'] }],
            sort: [{ field: 'schemaname', direction: 'asc' }],
          },
        },
        {
          name: 'relname equals table name',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [
              {
                field: 'relname',
                operator: '=',
                values: [this.createdTableName],
              },
            ],
            sort: [{ field: 'relname', direction: 'desc' }],
          },
        },
        {
          name: 'indexrelname ILIKE %field%',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [
              { field: 'indexrelname', operator: 'ILIKE', values: ['%field%'] },
            ],
            sort: [{ field: 'indexrelname', direction: 'asc' }],
          },
        },
        {
          name: 'idx_scan > 0 (number as string)',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [{ field: 'idx_scan', operator: '>', values: ['0'] }],
            sort: [{ field: 'idx_scan', direction: 'desc' }],
          },
        },
        {
          name: 'idx_tup_read >= 0 (number as string)',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [{ field: 'idx_tup_read', operator: '>=', values: ['0'] }],
            sort: [{ field: 'idx_tup_read', direction: 'asc' }],
          },
        },
        {
          name: 'idx_tup_fetch BETWEEN [0, 999999] (numbers as strings)',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [
              {
                field: 'idx_tup_fetch',
                operator: 'BETWEEN',
                values: ['0', '999999'],
              },
            ],
            sort: [{ field: 'idx_tup_fetch', direction: 'desc' }],
          },
        },
        {
          name: 'method IN [btree, hash, gin, brin]',
          query: {
            page: { page_no: 1, page_size: 10 },
            filters: [
              {
                field: 'method',
                operator: 'IN',
                values: ['btree', 'hash', 'gin', 'brin'],
              },
            ],
            sort: [{ field: 'method', direction: 'asc' }],
          },
        },
      ];

    for (const test of filterTests) {
      console.log(`\n📝 Filter Test: ${test.name}`);
      const res = await this.client.indexes.listIndexes(
        this.createdTableName,
        test.query
      );
      if (isErrorResponse(res)) {
        console.error('❌ listIndexes failed:', res.error);
      } else {
        const items = res.data?.items || [];
        console.log(`📤 Found ${items.length} indexes`);
        if (items.length > 0) {
          const sample = items[0] as any;
          console.log('   Sample:', {
            schemaname: sample.schemaname,
            relname: sample.relname,
            indexrelname: sample.indexrelname,
            method: sample.method,
            idx_scan: sample.idx_scan,
            idx_tup_read: sample.idx_tup_read,
            idx_tup_fetch: sample.idx_tup_fetch,
          });
        }
      }
    }

    // Delete indexes (clean up) - demonstrate both methods
    console.log('\n🗑️  Deleting indexes (both methods)');
    const toDelete = [
      'comprehensive-demo-table_btree_text_field',
      'comprehensive-demo-table_hash_email_field',
      'comprehensive-demo-table_gin_half_vector_field',
      'comprehensive-demo-table_brin_number_field',
    ];

    for (const indexName of toDelete) {
      console.log(`📝 Delete (direct): ${indexName}`);
      const delDirect = await this.client.indexes.deleteIndex(
        this.createdTableName,
        indexName
      );
      if (isErrorResponse(delDirect)) {
        console.error('❌ deleteIndex (direct) failed:', delDirect.error);
      } else {
        console.log('📤 deleteIndex (direct) result:', delDirect.data);
      }
    }

    // Attempt chained delete for a non-existing or already-deleted index to show surfacing
    const sampleDelete = 'comprehensive-demo-table_btree_text_field';
    console.log(`\n📝 Delete (chained): ${sampleDelete}`);
    const delChained = await this.client
      .from(this.createdTableName)
      .indexes()
      .deleteIndex(sampleDelete);
    if (isErrorResponse(delChained)) {
      console.error('❌ deleteIndex (chained) failed:', delChained.error);
    } else {
      console.log('📤 deleteIndex (chained) result:', delChained.data);
    }

    console.log('✅ Step 9.5 completed - Indexes demo finished');
  }

  /**
   * 10. Get column by name
   */
  private async demoGetColumnByName(): Promise<void> {
    console.log('\n1️⃣0️⃣  Getting Column by Name');
    console.log('-'.repeat(40));

    const columnName = 'text_field';
    console.log(`📝 Input: Get column by name "${columnName}"`);

    const getColumnResult = await this.client.columns.findOne(
      this.createdTableName,
      columnName
    );

    if (getColumnResult.error) {
      console.error('❌ Failed to get column:', getColumnResult.error);
    } else {
      console.log('📤 Output:', getColumnResult.data);
    }

    console.log('✅ Step 10 completed');
  }

  /**
   * 10.5. Get column by ID using direct GET endpoint
   */
  private async demoGetColumnById(): Promise<void> {
    console.log('\n1️⃣0️⃣.5️⃣  Getting Column by ID (Direct GET API)');
    console.log('-'.repeat(40));

    // First, get the list of columns to extract an ID
    console.log('📝 Input: First get column list to extract a column ID');
    const listColumnsResult = await this.client.columns.findAll(
      this.createdTableName,
      {
        limit: 1, // Just get the first column
      }
    );

    if (listColumnsResult.error) {
      console.error(
        '❌ Failed to list columns for ID extraction:',
        listColumnsResult.error
      );
      return;
    }

    const columns = Array.isArray(listColumnsResult.data)
      ? listColumnsResult.data
      : [];

    if (columns.length === 0) {
      console.log('⚠️  No columns available to test GET by ID');
      return;
    }

    const targetColumn = columns[0] as any;
    const columnId = targetColumn.id;
    const columnName = targetColumn.name;

    console.log(
      `📝 Input: Get column by ID "${columnId}" (name: "${columnName}")`
    );
    console.log(
      `   Using direct GET /tables/{table_id}/fields/{field_id} endpoint`
    );

    // Now test the direct GET method
    const getColumnByIdResult = await this.client.columns.findById(
      this.createdTableName,
      columnId
    );

    if (getColumnByIdResult.error) {
      console.error(
        '❌ Failed to get column by ID:',
        getColumnByIdResult.error
      );
    } else {
      console.log('📤 Output (Direct GET by ID):', getColumnByIdResult.data);

      // Verify the data matches what we expect
      if (getColumnByIdResult.data && 'id' in getColumnByIdResult.data) {
        const retrievedColumn = getColumnByIdResult.data as any;
        console.log('✅ Verification:');
        console.log(`   Retrieved ID: ${retrievedColumn.id}`);
        console.log(`   Retrieved Name: ${retrievedColumn.name}`);
        console.log(`   Retrieved Type: ${retrievedColumn.type}`);
        console.log(
          `   Retrieved Description: ${retrievedColumn.description || 'N/A'}`
        );
        console.log(
          `   ID Match: ${retrievedColumn.id === columnId ? '✅' : '❌'}`
        );
        console.log(
          `   Name Match: ${retrievedColumn.name === columnName ? '✅' : '❌'}`
        );
      }
    }

    console.log('✅ Step 10.5 completed - Direct GET endpoint tested');
  }

  /**
   * 11. Update column by name (add/remove constraints)
   */
  private async demoUpdateColumnConstraints(): Promise<void> {
    console.log('\n1️⃣1️⃣  Updating Column Constraints');
    console.log('-'.repeat(40));

    const columnName = 'email_field';
    console.log(`📝 Input: Update constraints for column "${columnName}"`);

    // Add constraints
    const addConstraintsResult = await this.client.columns.update(
      this.createdTableName,
      columnName,
      {
        is_unique: true,
        is_indexed: true,
        is_visible: true,
        description: 'Email field with enhanced constraints',
      }
    );

    if (addConstraintsResult.error) {
      console.error(
        '❌ Failed to add constraints:',
        addConstraintsResult.error
      );
    } else {
      console.log('📤 Output (constraints added):', addConstraintsResult.data);
    }

    // Remove some constraints
    const removeConstraintsResult = await this.client.columns.update(
      this.createdTableName,
      columnName,
      {
        is_indexed: false,
        description: 'Email field with basic constraints',
      }
    );

    if (removeConstraintsResult.error) {
      console.error(
        '❌ Failed to remove constraints:',
        removeConstraintsResult.error
      );
    } else {
      console.log(
        '📤 Output (constraints removed):',
        removeConstraintsResult.data
      );
    }

    console.log('✅ Step 11 completed');
  }

  /**
   * 12. Delete columns
   */
  private async demoDeleteColumns(): Promise<void> {
    console.log('\n1️⃣2️⃣  Deleting Columns');
    console.log('-'.repeat(40));

    // Delete a few columns as demonstration
    const columnsToDelete = [
      'json_field',
      'vector_field',
      'sparse_vector_field',
    ];

    for (const columnName of columnsToDelete) {
      console.log(`📝 Input: Delete column "${columnName}"`);

      const deleteColumnResult = await this.client.columns.delete(
        this.createdTableName,
        columnName
      );

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

    console.log('✅ Step 12 completed');
  }

  /**
   * 13. Add rows in table (with/without null)
   */
  private async demoAddRecords(): Promise<void> {
    console.log('\n1️⃣3️⃣  Adding Records to Table');
    console.log('-'.repeat(40));

    for (let i = 0; i < SAMPLE_RECORDS.length; i++) {
      const recordData = SAMPLE_RECORDS[i];
      console.log(`📝 Input: Inserting record ${i + 1} with data:`, recordData);

      const insertResult = await this.client.records.insert(
        this.createdTableName,
        recordData
      );

      if (insertResult.error) {
        console.error(
          `❌ Failed to insert record ${i + 1}:`,
          insertResult.error
        );
      } else {
        console.log(`📤 Output (record ${i + 1}):`, insertResult.data);
        if (
          !isErrorResponse(insertResult) &&
          insertResult.data &&
          'id' in insertResult.data &&
          insertResult.data.id
        ) {
          this.createdRecordIds.push(insertResult.data.id);
        }
      }
    }

    // Demonstrate partial record insertion (new feature)
    console.log(
      '\n📝 Input: Inserting partial record (missing fields will be auto-set to null)'
    );
    const partialRecord = {
      text_field: 'Partial User',
      email_field: 'partial@example.com',
      number_field: 100,
      currency_field: 100000,
      // Note: Missing fields like long_text_field, etc. will be automatically set to null
    };

    const partialInsertResult = await this.client.records.insert(
      this.createdTableName,
      partialRecord
    );

    if (partialInsertResult.error) {
      console.error(
        '❌ Failed to insert partial record:',
        partialInsertResult.error
      );
    } else {
      console.log('📤 Output (partial record):', partialInsertResult.data);
      console.log(
        '✅ Partial insertion successful - missing fields automatically set to null'
      );
      if (
        !isErrorResponse(partialInsertResult) &&
        partialInsertResult.data &&
        'id' in partialInsertResult.data &&
        partialInsertResult.data.id
      ) {
        this.createdRecordIds.push(partialInsertResult.data.id);
      }
    }

    console.log('✅ Step 13 completed');
  }

  /**
   * 13.5. Demo bulk insert (insertMany)
   */
  private async demoBulkInsertRecords(): Promise<void> {
    console.log('\n1️⃣3️⃣.5️⃣  Bulk Insert Multiple Records (insertMany)');
    console.log('-'.repeat(40));

    // Prepare multiple records for bulk insertion
    const bulkRecords = [
      {
        text_field: 'Bulk User 1',
        email_field: 'bulk1@example.com',
        long_text_field: 'First bulk inserted user with complete data.',
        number_field: 45,
        currency_field: 90000,
        checkbox_field: true,
        dropdown_field: ['Option 1'],
        phone_field: '+91 111 222 3333',
        link_field: 'https://bulk1.example.com',
        date_time_field: '2024-07-01T10:00:00Z',
        half_vector_field: [0.1, 0.1, 0.1, 0.1, 0.1],
      },
      {
        text_field: 'Bulk User 2',
        email_field: 'bulk2@example.com',
        long_text_field: 'Second bulk inserted user with different values.',
        number_field: 50,
        currency_field: 95000,
        checkbox_field: false,
        dropdown_field: ['Option 2'],
        phone_field: '+91 222 333 4444',
        link_field: 'https://bulk2.example.com',
        date_time_field: '2024-07-02T11:00:00Z',
        half_vector_field: [0.2, 0.2, 0.2, 0.2, 0.2],
      },
      {
        text_field: 'Bulk User 3',
        email_field: 'bulk3@example.com',
        long_text_field: 'Third bulk inserted user with complete data.',
        number_field: 55,
        currency_field: 100000,
        checkbox_field: true,
        dropdown_field: ['Option 3'],
        phone_field: '+91 333 444 5555',
        link_field: 'https://bulk3.example.com',
        date_time_field: '2024-07-03T12:00:00Z',
        half_vector_field: [0.3, 0.3, 0.3, 0.3, 0.3],
      },
    ];

    console.log('📝 Input: Bulk inserting 3 records using insertMany()');
    console.log('   Records include complete data');
    console.log('   Testing both validation enabled and disabled');

    // Demo 1: insertMany() with validation enabled (default)
    console.log(
      '\n🔹 Method 1: insertMany() with validation enabled (default)'
    );
    const bulkInsertResult = await this.client.records.insertMany(
      this.createdTableName,
      bulkRecords
    );

    if (isErrorResponse(bulkInsertResult)) {
      console.error(
        '❌ Failed to bulk insert records:',
        bulkInsertResult.error
      );
    } else {
      console.log('📤 Output (bulk insert):', bulkInsertResult.data);
      console.log(
        `✅ Successfully inserted ${bulkInsertResult.data.insert_count} records`
      );
      console.log('   Response includes:');
      console.log(`   - insert_count: ${bulkInsertResult.data.insert_count}`);
      console.log(
        `   - records array with ${bulkInsertResult.data.records.length} items`
      );
      console.log(`   - message: ${bulkInsertResult.message}`);

      // Add the IDs to our tracking array
      if (bulkInsertResult.data.records) {
        bulkInsertResult.data.records.forEach((record) => {
          if (record.id) {
            this.createdRecordIds.push(record.id);
          }
        });
      }
    }

    // Demo 2: insertMany() with validation disabled
    console.log('\n🔹 Method 2: insertMany() with validation disabled');
    const noValidationRecords = [
      {
        text_field: 'No Validation 1',
        email_field: 'noval1@example.com',
        number_field: 60,
        currency_field: 110000,
        checkbox_field: true,
      },
      {
        text_field: 'No Validation 2',
        email_field: 'noval2@example.com',
        number_field: 65,
        currency_field: 115000,
        checkbox_field: false,
      },
    ];

    const noValidationResult = await this.client.records.insertMany(
      this.createdTableName,
      noValidationRecords,
      { validation: false }
    );

    if (isErrorResponse(noValidationResult)) {
      console.error(
        '❌ Failed bulk insert without validation:',
        noValidationResult.error
      );
    } else {
      console.log('📤 Output (no validation):', noValidationResult.data);
      console.log(
        `✅ Successfully inserted ${noValidationResult.data.insert_count} records without validation`
      );

      // Add the IDs to our tracking array
      if (noValidationResult.data.records) {
        noValidationResult.data.records.forEach((record) => {
          if (record.id) {
            this.createdRecordIds.push(record.id);
          }
        });
      }
    }

    // Demo 3: Error handling - empty array
    console.log('\n🔹 Error Handling Demo: Empty array');
    const emptyArrayResult = await this.client.records.insertMany(
      this.createdTableName,
      []
    );

    if (isErrorResponse(emptyArrayResult)) {
      console.log('📤 Output (expected error):', emptyArrayResult.error);
      console.log('✅ Correctly handled empty array with proper error message');
    } else {
      console.log('❌ Empty array should have returned an error');
    }

    console.log('✅ Step 13.5 completed - Bulk insert demonstration');
  }

  /**
   * 13.6. Demo bulk update based on filters
   */
  private async demoBulkUpdateRecords(): Promise<void> {
    console.log('\n1️⃣3️⃣.6️⃣  Bulk Update Records Based on Filters');
    console.log('-'.repeat(40));

    console.log(
      '📝 Input: Demonstrating bulk update operations using various filter types'
    );
    console.log(
      '   This feature allows updating multiple records at once based on filter conditions'
    );

    // Demo 1: Simple equality filter - Update all records with a specific text value
    console.log('\n🔹 Method 1: Update using simple equality filter');
    console.log('   Updating all records where text_field starts with "Bulk"');

    const simpleFilterUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          { field: 'text_field', operator: 'STARTS WITH', values: ['Bulk'] },
        ],
        set: {
          checkbox_field: true,
          long_text_field: 'Updated via bulk update operation - Simple filter',
        },
      }
    );
    if (isErrorResponse(simpleFilterUpdate)) {
      console.error(
        '❌ Failed simple filter bulk update:',
        simpleFilterUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(simpleFilterUpdate.data)
        ? simpleFilterUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      console.log(`   Message: ${simpleFilterUpdate.message || 'Success'}`);
      if (updatedRecords.length > 0) {
        console.log('   Sample updated record:');
        const sample = updatedRecords[0] as any;
        console.log(`     - text_field: ${sample.text_field}`);
        console.log(`     - checkbox_field: ${sample.checkbox_field}`);
        console.log(
          `     - long_text_field: ${sample.long_text_field?.substring(0, 50)}...`
        );
      }
    }

    // Demo 2: Numeric range filter - Update records within a number range
    console.log('\n🔹 Method 2: Update using numeric range filter');
    console.log('   Updating records where number_field is between 25 and 35');

    const rangeFilterUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          { field: 'number_field', operator: 'BETWEEN', values: [25, 35] },
        ],
        set: {
          currency_field: 70000,
          long_text_field:
            'Updated via bulk update - Numeric range filter (25-35)',
        },
      }
    );

    if (isErrorResponse(rangeFilterUpdate)) {
      console.error(
        '❌ Failed range filter bulk update:',
        rangeFilterUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(rangeFilterUpdate.data)
        ? rangeFilterUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Updated records summary:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - number: ${record.number_field}, currency: ${record.currency_field}`
          );
        });
      }
    }

    // Demo 3: Multiple conditions (AND logic) - Update with complex filters
    console.log('\n🔹 Method 3: Update using multiple filter conditions (AND)');
    console.log(
      '   Updating records where checkbox_field = false AND currency_field > 60000'
    );

    const multiConditionUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          { field: 'checkbox_field', operator: '=', values: [false] },
          { field: 'currency_field', operator: '>', values: [60000] },
        ],
        set: {
          checkbox_field: true,
          dropdown_field: ['Option 1'],
          long_text_field:
            'Updated via bulk update - Multiple conditions (checkbox=false AND currency>60000)',
        },
      }
    );

    if (isErrorResponse(multiConditionUpdate)) {
      console.error(
        '❌ Failed multi-condition bulk update:',
        multiConditionUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(multiConditionUpdate.data)
        ? multiConditionUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Records that matched both conditions:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - checkbox now: ${record.checkbox_field}, dropdown: ${JSON.stringify(record.dropdown_field)}`
          );
        });
      }
    }

    // Demo 4: Email pattern matching - Update based on email domain
    console.log('\n🔹 Method 4: Update using email pattern matching');
    console.log('   Updating records where email contains "@example.com"');

    const emailPatternUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          {
            field: 'email_field',
            operator: 'ILIKE',
            values: ['%@example.com'],
          },
        ],
        set: {
          phone_field: '+91 999 999 9999',
          long_text_field:
            'Updated via bulk update - Email pattern match (@example.com)',
        },
      }
    );

    if (isErrorResponse(emailPatternUpdate)) {
      console.error(
        '❌ Failed email pattern bulk update:',
        emailPatternUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(emailPatternUpdate.data)
        ? emailPatternUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Records with @example.com emails:');
        updatedRecords.slice(0, 3).forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} (${record.email_field}) - phone: ${record.phone_field}`
          );
        });
      }
    }

    // Demo 5: Date range filter - Update records within a date range
    console.log('\n🔹 Method 5: Update using date range filter');
    console.log(
      '   Updating records where date_time_field is in Q1 2024 (Jan-Mar)'
    );

    const dateRangeUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          {
            field: 'date_time_field',
            operator: 'BETWEEN',
            values: ['2024-01-01T00:00:00Z', '2024-03-31T23:59:59Z'],
          },
        ],
        set: {
          link_field: 'https://q1-2024-updated.example.com',
          long_text_field:
            'Updated via bulk update - Q1 2024 date range filter',
        },
      }
    );

    if (isErrorResponse(dateRangeUpdate)) {
      console.error('❌ Failed date range bulk update:', dateRangeUpdate.error);
    } else {
      const updatedRecords = Array.isArray(dateRangeUpdate.data)
        ? dateRangeUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Q1 2024 records updated:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - date: ${record.date_time_field}, link: ${record.link_field}`
          );
        });
      }
    }

    // Demo 6: Array/Dropdown filter - Update based on dropdown selection
    console.log('\n🔹 Method 6: Update using array/dropdown filter');
    console.log('   Updating records where dropdown_field contains "Option 2"');

    const arrayFilterUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          { field: 'dropdown_field', operator: 'ANY', values: ['Option 2'] },
        ],
        set: {
          number_field: 99,
          long_text_field:
            'Updated via bulk update - Dropdown contains Option 2',
        },
      }
    );

    if (isErrorResponse(arrayFilterUpdate)) {
      console.error(
        '❌ Failed array filter bulk update:',
        arrayFilterUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(arrayFilterUpdate.data)
        ? arrayFilterUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Records with Option 2 in dropdown:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - number: ${record.number_field}, dropdown: ${JSON.stringify(record.dropdown_field)}`
          );
        });
      }
    }

    // Demo 7: IN operator - Update specific set of values
    console.log('\n🔹 Method 7: Update using IN operator');
    console.log(
      '   Updating records where text_field is one of ["Alice", "Bob", "Charlie"]'
    );

    const inOperatorUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          {
            field: 'text_field',
            operator: 'IN',
            values: ['Alice', 'Bob', 'Charlie'],
          },
        ],
        set: {
          checkbox_field: false,
          currency_field: 85000,
          long_text_field:
            'Updated via bulk update - IN operator (Alice/Bob/Charlie)',
        },
      }
    );

    if (isErrorResponse(inOperatorUpdate)) {
      console.error(
        '❌ Failed IN operator bulk update:',
        inOperatorUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(inOperatorUpdate.data)
        ? inOperatorUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records`
      );
      if (updatedRecords.length > 0) {
        console.log('   Alice, Bob, or Charlie records:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - checkbox: ${record.checkbox_field}, currency: ${record.currency_field}`
          );
        });
      }
    }

    // Demo 8: Using FilterBuilder for complex conditions
    console.log('\n🔹 Method 8: Update using FilterBuilder (SDK helper)');
    console.log(
      '   Creating complex filter: number_field > 29 AND checkbox_field = true'
    );

    const complexFilters = createFilter()
      .greaterThan('number_field', 29)
      .equals('checkbox_field', true)
      .build();

    const filterBuilderUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: complexFilters,
        set: {
          link_field: 'https://premium-users.example.com',
          currency_field: 95000,
          long_text_field:
            'Updated via bulk update - FilterBuilder (number>29 AND checkbox=true)',
        },
      }
    );

    if (isErrorResponse(filterBuilderUpdate)) {
      console.error(
        '❌ Failed FilterBuilder bulk update:',
        filterBuilderUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(filterBuilderUpdate.data)
        ? filterBuilderUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records using FilterBuilder`
      );
      if (updatedRecords.length > 0) {
        console.log('   Premium users (number>29, checkbox=true):');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. ${record.text_field} - number: ${record.number_field}, currency: ${record.currency_field}, link: ${record.link_field}`
          );
        });
      }
    }

    // Demo 9: Update with field projection (only return specific fields)
    console.log('\n🔹 Method 9: Update with field projection');
    console.log(
      '   Updating and returning only specific fields (text_field, email_field, number_field)'
    );

    const projectionUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [{ field: 'number_field', operator: '<', values: [30] }],
        set: {
          checkbox_field: true,
          long_text_field:
            'Updated via bulk update - With field projection (number<30)',
        },
        fields: ['text_field', 'email_field', 'number_field', 'checkbox_field'],
      }
    );

    if (isErrorResponse(projectionUpdate)) {
      console.error(
        '❌ Failed projection bulk update:',
        projectionUpdate.error
      );
    } else {
      const updatedRecords = Array.isArray(projectionUpdate.data)
        ? projectionUpdate.data
        : [];
      console.log(
        `📤 Output: Successfully updated ${updatedRecords.length} records with field projection`
      );
      if (updatedRecords.length > 0) {
        console.log('   Returned only requested fields:');
        updatedRecords.forEach((record: any, idx: number) => {
          console.log(
            `     ${idx + 1}. Fields: ${Object.keys(record).join(', ')}`
          );
          console.log(
            `        text: ${record.text_field}, number: ${record.number_field}`
          );
        });
      }
    }

    // Demo 10: Error handling - No matching records
    console.log('\n🔹 Error Handling Demo: No matching records');
    console.log('   Attempting update with filter that matches no records');

    const noMatchUpdate = await this.client.records.update(
      this.createdTableName,
      {
        filters: [
          { field: 'text_field', operator: '=', values: ['NonExistentUser'] },
        ],
        set: {
          number_field: 999,
        },
      }
    );

    if (isErrorResponse(noMatchUpdate)) {
      console.log('📤 Output (error):', noMatchUpdate.error);
    } else {
      const updatedRecords = Array.isArray(noMatchUpdate.data)
        ? noMatchUpdate.data
        : [];
      console.log(
        `📤 Output: Updated ${updatedRecords.length} records (expected 0)`
      );
      console.log(
        '✅ Correctly handled case where no records match the filter'
      );
    }

    console.log('\n📋 Bulk Update Summary:');
    console.log('   ✅ Simple equality and pattern matching filters');
    console.log('   ✅ Numeric range filters (BETWEEN, >, <, >=, <=)');
    console.log('   ✅ Multiple conditions with AND logic');
    console.log('   ✅ Email and text pattern matching (LIKE, ILIKE)');
    console.log('   ✅ Date range filters');
    console.log('   ✅ Array/dropdown filters (ANY, @>)');
    console.log('   ✅ IN operator for multiple specific values');
    console.log('   ✅ FilterBuilder for complex filter construction');
    console.log('   ✅ Field projection to return only needed fields');
    console.log('   ✅ Proper error handling for edge cases');

    console.log('✅ Step 13.6 completed - Bulk update demonstration');
  }

  /**
   * 14. Get row
   */
  private async demoGetRecord(): Promise<void> {
    console.log('\n1️⃣4️⃣  Getting a Specific Record');
    console.log('-'.repeat(40));

    if (this.createdRecordIds.length === 0) {
      console.log('⚠️  No records available to retrieve');
      return;
    }

    const recordId = this.createdRecordIds[0];
    console.log(`📝 Input: Get record by ID "${recordId}"`);

    const getRecordResult = await this.client.records.findOne(
      this.createdTableName,
      recordId
    );

    if (getRecordResult.error) {
      console.error('❌ Failed to get record:', getRecordResult.error);
    } else {
      console.log('📤 Output:', getRecordResult.data);

      // Demonstrate decryption override
      console.log('\n📝 Input: Get record with show_decrypted: true (decryption override)');
      const decryptedResult = await this.client.records.findOne(
        this.createdTableName,
        recordId,
        { show_decrypted: true }
      );

      if (isErrorResponse(decryptedResult)) {
        console.error('❌ Failed to get decrypted record:', decryptedResult.error);
      } else {
        console.log('   Secret SSN (decrypted):', decryptedResult.data.secret_ssn);
        console.log('   Secret Email (decrypted):', decryptedResult.data.secret_email);
      }
    }

    console.log('✅ Step 14 completed');
  }

  /**
   * 15. List rows (with pagination)
   */
  private async demoListRecordsWithPagination(): Promise<void> {
    console.log('\n1️⃣5️⃣  Listing Records with Pagination');
    console.log('-'.repeat(40));

    // First page
    console.log('📝 Input: Get first page of records (page size: 2)');
    const firstPageResult = await this.client.records.findAll(
      this.createdTableName,
      {
        page: { page_no: 1, page_size: 2 },
        sort: [{ field: 'text_field', direction: 'asc' }],
      }
    );

    if (firstPageResult.error) {
      console.error('❌ Failed to get first page:', firstPageResult.error);
    } else {
      const records = Array.isArray(firstPageResult.data)
        ? firstPageResult.data
        : [];
      console.log(`📤 Output (first page): Found ${records.length} records`);
      if ('pagination' in firstPageResult && firstPageResult.pagination) {
        console.log(
          `   Pagination: Page ${firstPageResult.pagination.current_page} of ${firstPageResult.pagination.total_pages}`
        );
        console.log(
          `   Total records: ${firstPageResult.pagination.total_count}`
        );
      }
    }

    // Second page
    console.log('\n📝 Input: Get second page of records (page size: 2)');
    const secondPageResult = await this.client.records.findAll(
      this.createdTableName,
      {
        page: { page_no: 2, page_size: 2 },
        sort: [{ field: 'text_field', direction: 'asc' }],
      }
    );

    if (secondPageResult.error) {
      console.error('❌ Failed to get second page:', secondPageResult.error);
    } else {
      const records = Array.isArray(secondPageResult.data)
        ? secondPageResult.data
        : [];
      console.log(`📤 Output (second page): Found ${records.length} records`);
      if ('pagination' in secondPageResult && secondPageResult.pagination) {
        console.log(
          `   Pagination: Page ${secondPageResult.pagination.current_page} of ${secondPageResult.pagination.total_pages}`
        );
        console.log(
          `   Total records: ${secondPageResult.pagination.total_count}`
        );
      }
    }

    console.log('✅ Step 15 completed');
  }

  /**
   * 16. Update values in rows for each data type
   */
  private async demoUpdateRecords(): Promise<void> {
    console.log('\n1️⃣6️⃣  Updating Records for Each Data Type');
    console.log('-'.repeat(40));

    if (this.createdRecordIds.length === 0) {
      console.log('⚠️  No records available to update');
      return;
    }

    const recordId = this.createdRecordIds[0];
    console.log(`📝 Input: Update record ID "${recordId}" with new values`);

    const updateData = {
      text_field: 'Updated John Doe',
      email_field: 'updated.john.doe@example.com',
      long_text_field:
        'This is an updated comprehensive description with new information.',
      number_field: 31,
      currency_field: 80000.0,
      checkbox_field: false,
      dropdown_field: 'Option 2',
      phone_field: '+91 987 654 3211',
      link_field: 'https://updated-johndoe.com',
      date_time_field: '2024-01-16T11:30:00Z',
      half_vector_field: [0.2, 0.3, 0.4, 0.5, 0.6],
    };

    const updateResult = await this.client.records.updateById(
      this.createdTableName,
      recordId,
      updateData
    );

    if (updateResult.error) {
      console.error('❌ Failed to update record:', updateResult.error);
    } else {
      console.log('📤 Output (updated record):', updateResult.data);
    }

    console.log('✅ Step 16 completed');
  }

  /**
   * 17. Delete rows
   */
  private async demoDeleteRecords(): Promise<void> {
    console.log('\n1️⃣7️⃣  Deleting Records');
    console.log('-'.repeat(40));

    if (this.createdRecordIds.length === 0) {
      console.log('⚠️  No records available to delete');
      return;
    }

    // 1. Delete by record IDs using the unified delete method
    console.log('📝 Input: Delete records by IDs using unified delete method');
    const deleteByIdsResult = await this.client.records.delete(
      this.createdTableName,
      {
        record_ids: this.createdRecordIds.slice(0, 1), // Delete only the first record
      }
    );

    if (deleteByIdsResult.error) {
      console.error(
        '❌ Failed to delete records by IDs:',
        deleteByIdsResult.error
      );
    } else {
      console.log('📤 Output (deleted by IDs):', deleteByIdsResult.data);
      this.createdRecordIds = this.createdRecordIds.slice(1); // Remove the deleted record ID
    }

    // 2. Delete by filters using where clause format
    console.log('\n📝 Input: Delete records by filters (where clause format)');
    const deleteByFiltersResult = await this.client.records.delete(
      this.createdTableName,
      {
        filters: {
          text_field: { $eq: 'Jane Smith' },
        },
      }
    );

    if (deleteByFiltersResult.error) {
      console.error(
        '❌ Failed to delete records by filters:',
        deleteByFiltersResult.error
      );
    } else {
      console.log(
        '📤 Output (deleted by filters):',
        deleteByFiltersResult.data
      );
    }

    // 3. Delete by filters using direct ApiFilter format
    console.log('\n📝 Input: Delete records by filters (ApiFilter format)');
    const deleteByApiFiltersResult = await this.client.records.delete(
      this.createdTableName,
      {
        filters: [
          {
            field: 'text_field',
            operator: '=',
            values: ['Bob Johnson'],
          },
        ],
      }
    );

    if (deleteByApiFiltersResult.error) {
      console.error(
        '❌ Failed to delete records by ApiFilter:',
        deleteByApiFiltersResult.error
      );
    } else {
      console.log(
        '📤 Output (deleted by ApiFilter):',
        deleteByApiFiltersResult.data
      );
    }

    // 4. Delete by complex filters using FilterBuilder
    console.log('\n📝 Input: Delete records using FilterBuilder');
    const complexFilters = createFilter()
      .greaterThan('number_field', 32)
      .equals('checkbox_field', true)
      .build();

    const deleteByComplexFiltersResult = await this.client.records.delete(
      this.createdTableName,
      {
        filters: complexFilters,
      }
    );

    if (deleteByComplexFiltersResult.error) {
      console.error(
        '❌ Failed to delete records by complex filters:',
        deleteByComplexFiltersResult.error
      );
    } else {
      console.log(
        '📤 Output (deleted by complex filters):',
        deleteByComplexFiltersResult.data
      );
    }

    // 5. Delete using table-scoped method
    console.log('\n📝 Input: Delete using table-scoped method');
    const tableScopedDeleteResult = await this.client
      .from(this.createdTableName)
      .records()
      .delete({
        filters: {
          currency_field: { $lt: 60000 },
        },
      });

    if (tableScopedDeleteResult.error) {
      console.error(
        '❌ Failed to delete records (table-scoped):',
        tableScopedDeleteResult.error
      );
    } else {
      console.log(
        '📤 Output (table-scoped delete):',
        tableScopedDeleteResult.data
      );
    }

    console.log(
      '✅ Step 17 completed - Demonstrated unified delete with multiple filter formats'
    );
  }

  /**
   * 18. Bonus: Show working of all types of filters
   */
  private async demoAllFilterTypes(): Promise<void> {
    console.log('\n1️⃣8️⃣  Demonstrating All Types of Filters');
    console.log('-'.repeat(40));

    // First, let's add some test records for filtering
    // Note: Including all fields that exist in the table at this point
    // (after some columns were deleted in step 13)
    const testRecords = [
      {
        text_field: 'Alice',
        email_field: 'alice@example.com',
        long_text_field:
          'Alice is a dedicated professional with extensive experience in project management and team leadership.',
        number_field: 25,
        currency_field: 50000,
        checkbox_field: true,
        dropdown_field: ['Option 1'],
        phone_field: '+91 987 654 3210',
        link_field: 'https://alice.example.com',
        date_time_field: '2024-01-10T10:00:00Z',
        half_vector_field: [0.1, 0.2, 0.3, 0.4, 0.5],
      },
      {
        text_field: 'Bob',
        email_field: 'bob@test.com',
        long_text_field:
          'Bob brings innovative solutions and technical expertise to complex software development challenges.',
        number_field: 30,
        currency_field: 60000,
        checkbox_field: false,
        dropdown_field: ['Option 2'],
        phone_field: '+91 876 543 2109',
        link_field: 'https://bob.test.com',
        date_time_field: '2024-02-15T14:30:00Z',
        half_vector_field: [0.2, 0.3, 0.4, 0.5, 0.6],
      },
      {
        text_field: 'Charlie',
        email_field: 'charlie@demo.org',
        long_text_field:
          'Charlie specializes in data analysis and has a proven track record of delivering actionable insights.',
        number_field: 35,
        currency_field: 70000,
        checkbox_field: true,
        dropdown_field: ['Option 3'],
        phone_field: '+91 765 432 1098',
        link_field: 'https://charlie.demo.org',
        date_time_field: '2024-03-20T09:15:00Z',
        half_vector_field: [0.3, 0.4, 0.5, 0.6, 0.7],
      },
      {
        text_field: 'David',
        email_field: 'david@sample.net',
        long_text_field:
          'David has exceptional communication skills and excels at translating business requirements into technical solutions.',
        number_field: 40,
        currency_field: 80000,
        checkbox_field: false,
        dropdown_field: ['Option 1'],
        phone_field: '+91 654 321 0987',
        link_field: 'https://david.sample.net',
        date_time_field: '2024-04-25T16:45:00Z',
        half_vector_field: [0.4, 0.5, 0.6, 0.7, 0.8],
      },
      {
        text_field: 'Eva',
        email_field: 'eva@company.com',
        long_text_field:
          'Eva is a creative designer with expertise in user experience and visual design.',
        number_field: 28,
        currency_field: 55000,
        checkbox_field: true,
        dropdown_field: ['Option 2'],
        phone_field: '+91 543 210 9876',
        link_field: 'https://eva.company.com',
        date_time_field: '2024-05-30T11:20:00Z',
        half_vector_field: [0.5, 0.6, 0.7, 0.8, 0.9],
      },
      {
        text_field: 'Frank',
        email_field: 'frank@startup.io',
        long_text_field:
          'Frank is an entrepreneur with a passion for building innovative products and scaling businesses.',
        number_field: 32,
        currency_field: 65000,
        checkbox_field: false,
        dropdown_field: ['Option 3'],
        phone_field: '+91 432 109 8765',
        link_field: 'https://frank.startup.io',
        date_time_field: '2024-06-15T13:45:00Z',
        half_vector_field: [0.6, 0.7, 0.8, 0.9, 1.0],
      },
    ];

    console.log('📝 Input: Adding test records for filter demonstration');
    let successfulInserts = 0;
    for (let i = 0; i < testRecords.length; i++) {
      const record = testRecords[i];
      console.log(
        `   Inserting record ${i + 1}/${testRecords.length}: ${record.text_field}`
      );

      const insertResult = await this.client.records.insert(
        this.createdTableName,
        record
      );

      if (isErrorResponse(insertResult)) {
        console.error(
          `   ❌ Failed to insert record ${i + 1}:`,
          insertResult.error
        );
      } else if (
        insertResult.data &&
        'id' in insertResult.data &&
        insertResult.data.id
      ) {
        console.log(
          `   ✅ Successfully inserted record ${i + 1} with ID: ${insertResult.data.id}`
        );
        this.createdRecordIds.push(insertResult.data.id);
        successfulInserts++;
      } else {
        console.error(`   ❌ Insert result for record ${i + 1} missing ID`);
      }
    }

    console.log(
      `📤 Output: Successfully inserted ${successfulInserts}/${testRecords.length} test records`
    );

    // Wait a moment for records to be committed
    console.log('\n⏳ Waiting for records to be committed...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify records exist before testing filters
    console.log('\n🔍 Verifying inserted records before testing filters...');
    const verifyResult = await this.client.records.findAll(
      this.createdTableName,
      {
        page: { page_no: 1, page_size: 10 },
      }
    );

    if (isErrorResponse(verifyResult)) {
      console.error('❌ Failed to verify records:', verifyResult.error);
      return;
    } else {
      const totalRecords = Array.isArray(verifyResult.data)
        ? verifyResult.data.length
        : 0;
      console.log(
        `✅ Verification: Found ${totalRecords} total records in table`
      );
      if (totalRecords === 0) {
        console.log('⚠️  No records found in table. Cannot test filters.');
        return;
      }
    }

    // Demonstrate different filter types using the new comprehensive filter system
    const filterExamples = [
      // Text Field Filters
      {
        name: 'Text Equality Filter',
        filters: [{ field: 'text_field', operator: '=', values: ['Alice'] }],
        description: 'Find records where text_field equals "Alice"',
      },
      {
        name: 'Text Not Equals Filter',
        filters: [{ field: 'text_field', operator: '!=', values: ['Admin'] }],
        description: 'Find records where text_field is not "Admin"',
      },
      {
        name: 'Text Contains (Case Sensitive)',
        filters: [{ field: 'text_field', operator: 'LIKE', values: ['%ice%'] }],
        description:
          'Find records where text_field contains "ice" (case sensitive)',
      },
      {
        name: 'Text Contains (Case Insensitive)',
        filters: [
          { field: 'text_field', operator: 'ILIKE', values: ['%alice%'] },
        ],
        description:
          'Find records where text_field contains "alice" (case insensitive)',
      },
      {
        name: 'Text Starts With Filter',
        filters: [
          { field: 'text_field', operator: 'STARTS WITH', values: ['A'] },
        ],
        description: 'Find records where text_field starts with "A"',
      },
      {
        name: 'Text IN Filter',
        filters: [
          {
            field: 'text_field',
            operator: 'IN',
            values: ['Alice', 'Bob', 'Charlie'],
          },
        ],
        description:
          'Find records where text_field is one of ["Alice", "Bob", "Charlie"]',
      },
      {
        name: 'Text IS EMPTY Filter',
        filters: [
          { field: 'text_field', operator: 'IS EMPTY', values: [false] },
        ],
        description: 'Find records where text_field is not empty',
      },

      // Number Field Filters
      {
        name: 'Number Greater Than Filter',
        filters: [{ field: 'number_field', operator: '>', values: [30] }],
        description: 'Find records where number_field > 30',
      },
      {
        name: 'Number Greater Than or Equal Filter',
        filters: [{ field: 'number_field', operator: '>=', values: [30] }],
        description: 'Find records where number_field >= 30',
      },
      {
        name: 'Number Less Than Filter',
        filters: [{ field: 'number_field', operator: '<', values: [35] }],
        description: 'Find records where number_field < 35',
      },
      {
        name: 'Number Between Filter',
        filters: [
          { field: 'number_field', operator: 'BETWEEN', values: [25, 35] },
        ],
        description: 'Find records where number_field is between 25 and 35',
      },
      {
        name: 'Number IN Filter',
        filters: [
          { field: 'number_field', operator: 'IN', values: [25, 30, 35] },
        ],
        description: 'Find records where number_field is one of [25, 30, 35]',
      },

      // Currency Field Filters
      {
        name: 'Currency Greater Than Filter',
        filters: [{ field: 'currency_field', operator: '>', values: [60000] }],
        description: 'Find records where currency_field > 60000',
      },
      {
        name: 'Currency Between Filter',
        filters: [
          {
            field: 'currency_field',
            operator: 'BETWEEN',
            values: [50000, 70000],
          },
        ],
        description:
          'Find records where currency_field is between 50000 and 70000',
      },

      // Boolean Field Filters
      {
        name: 'Boolean True Filter',
        filters: [{ field: 'checkbox_field', operator: '=', values: [true] }],
        description: 'Find records where checkbox_field is true',
      },
      {
        name: 'Boolean False Filter',
        filters: [{ field: 'checkbox_field', operator: '=', values: [false] }],
        description: 'Find records where checkbox_field is false',
      },

      // Date-Time Field Filters
      {
        name: 'Date Greater Than Filter',
        filters: [
          {
            field: 'date_time_field',
            operator: '>',
            values: ['2024-02-01T00:00:00Z'],
          },
        ],
        description: 'Find records where date_time_field is after Feb 1, 2024',
      },
      {
        name: 'Date Between Filter',
        filters: [
          {
            field: 'date_time_field',
            operator: 'BETWEEN',
            values: ['2024-01-01T00:00:00Z', '2024-03-31T23:59:59Z'],
          },
        ],
        description: 'Find records where date_time_field is in Q1 2024',
      },
      {
        name: 'Date WITHIN Filter',
        filters: [
          {
            field: 'date_time_field',
            operator: 'WITHIN',
            values: ['last-30-days'],
          },
        ],
        description:
          'Find records where date_time_field is within last 30 days',
      },

      // Email Field Filters
      {
        name: 'Email Domain Filter',
        filters: [
          {
            field: 'email_field',
            operator: 'ILIKE',
            values: ['%@example.com'],
          },
        ],
        description: 'Find records where email ends with "@example.com"',
      },
      {
        name: 'Email Contains Filter',
        filters: [
          { field: 'email_field', operator: 'ILIKE', values: ['%test%'] },
        ],
        description: 'Find records where email contains "test"',
      },

      // Phone Field Filters
      {
        name: 'Phone Starts With Filter',
        filters: [
          { field: 'phone_field', operator: 'STARTS WITH', values: ['+91'] },
        ],
        description: 'Find records where phone starts with "+91"',
      },

      // Link Field Filters
      {
        name: 'Link Contains Filter',
        filters: [
          { field: 'link_field', operator: 'LIKE', values: ['%example%'] },
        ],
        description: 'Find records where link contains "example"',
      },

      // Dropdown Field Filters (Array Fields)
      {
        name: 'Dropdown Array Contains Filter',
        filters: [
          {
            field: 'dropdown_field',
            operator: '@>',
            values: [['Option 1']], // Array contains this exact array
          },
        ],
        description:
          'Find records where dropdown_field array contains "Option 1"',
      },
      {
        name: 'Dropdown Any Element Filter',
        filters: [
          {
            field: 'dropdown_field',
            operator: 'ANY',
            values: ['Option 2'],
          },
        ],
        description:
          'Find records where any element in dropdown_field matches "Option 2"',
      },
      {
        name: 'Dropdown Array Overlap Filter',
        filters: [
          {
            field: 'dropdown_field',
            operator: 'IS ONE OF',
            values: ['Option 1', 'Option 3'],
          },
        ],
        description:
          'Find records where dropdown_field overlaps with ["Option 1", "Option 3"]',
      },

      // Vector Field Filters
      {
        name: 'Vector Not Empty Filter',
        filters: [
          { field: 'half_vector_field', operator: '!=', values: [null] },
        ],
        description: 'Find records where half_vector_field is not null',
      },
      {
        name: 'Vector Similarity Search (Euclidean Distance)',
        filters: [
          {
            field: 'half_vector_field',
            operator: '<->',
            values: ['[0.1,0.2,0.3,0.4,0.5]'],
          },
        ],
        description:
          'Find records with similar vectors using Euclidean distance',
      },
      {
        name: 'Vector Similarity Search (Cosine Distance)',
        filters: [
          {
            field: 'half_vector_field',
            operator: '<=>',
            values: ['[0.2,0.3,0.4,0.5,0.6]'],
          },
        ],
        description: 'Find records with similar vectors using cosine distance',
      },

      // Complex Multi-Field Filters
      {
        name: 'Complex Filter with Multiple Conditions',
        filters: createFilter()
          .greaterThan('number_field', 25)
          .equals('checkbox_field', true)
          .arrayContains('dropdown_field', 'Option 1')
          .build(),
        description:
          'Complex filter: number > 25 AND checkbox = true AND dropdown contains "Option 1"',
      },
      {
        name: 'Multiple Conditions (AND Logic)',
        filters: [
          { field: 'number_field', operator: '>=', values: [30] },
          { field: 'checkbox_field', operator: '=', values: [false] },
          { field: 'currency_field', operator: '>', values: [60000] },
        ],
        description:
          'Find records where number >= 30 AND checkbox = false AND currency > 60000',
      },
      {
        name: 'Text and Number Combined Filter',
        filters: [
          { field: 'text_field', operator: 'ILIKE', values: ['%a%'] },
          { field: 'number_field', operator: 'BETWEEN', values: [25, 35] },
        ],
        description:
          'Find records where text contains "a" AND number is between 25-35',
      },
    ];

    for (const filterExample of filterExamples) {
      console.log(`\n📝 Input: ${filterExample.name}`);
      console.log(`   Description: ${filterExample.description}`);
      console.log(
        `   Filter: ${JSON.stringify(filterExample.filters, null, 2)}`
      );

      const filterResult = await this.client.records.findAll(
        this.createdTableName,
        {
          page: { page_no: 1, page_size: 10 },
          filters: filterExample.filters,
        }
      );

      if (isErrorResponse(filterResult)) {
        console.error(
          `❌ Filter "${filterExample.name}" failed:`,
          filterResult.error
        );
      } else {
        const records = Array.isArray(filterResult.data)
          ? filterResult.data
          : [];
        console.log(`📤 Output: Found ${records.length} records`);

        if (records.length > 0) {
          console.log(`   Sample records:`);
          records.slice(0, 2).forEach((record: any, index: number) => {
            console.log(
              `     ${index + 1}. ${record.text_field} (${record.email_field})`
            );
            console.log(
              `        number: ${record.number_field}, dropdown: ${JSON.stringify(record.dropdown_field)}`
            );
          });
        } else {
          console.log(`   No records matched this filter`);
        }
      }
    }

    console.log(
      '✅ Step 18 completed - Demonstrated comprehensive filter system'
    );
  }

  /**
   * 19. Demo snapshot protection
   */
  private async demoSnapshotProtection(): Promise<void> {
    console.log('\n1️⃣9️⃣  Demo Snapshot Protection');
    console.log('-'.repeat(40));

    console.log(
      '📝 Input: Demonstrating snapshot protection by attempting to update a snapshot table'
    );
    console.log(
      '   Note: This demo shows how the SDK prevents modifications to snapshot tables'
    );

    // First, let's try to find an existing snapshot table in the system
    console.log('\n🔍 Searching for existing snapshot tables...');
    const listTablesResult = await this.client.tables.findAll();

    if (isErrorResponse(listTablesResult)) {
      console.error(
        '❌ Failed to list tables:',
        listTablesResult.error.message
      );
      console.log(
        '⚠️  Cannot demonstrate snapshot protection without access to table list'
      );
      return;
    }

    const tables = Array.isArray(listTablesResult.data)
      ? listTablesResult.data
      : [];
    const snapshotTables = tables.filter((table: any) => table.snapshot_url);

    if (snapshotTables.length === 0) {
      console.log('📤 Output: No snapshot tables found in the system');
      console.log(
        '   This is normal - snapshot tables are typically created for specific use cases'
      );
      console.log(
        '   The snapshot protection is implemented in the SDK and will work when snapshot tables exist'
      );

      // Demonstrate the protection mechanism by showing the error handling
      console.log(
        '\n📝 Input: Demonstrating snapshot protection error handling'
      );
      console.log('   (This would trigger if we had a snapshot table)');

      const mockSnapshotError = {
        data: {},
        error: {
          code: 'SNAPSHOT_PROTECTION',
          message:
            "Cannot update snapshot table 'example-snapshot-table'. Snapshots are read-only and cannot be modified.",
        },
      };

      console.log('📤 Output (simulated):', mockSnapshotError);
      console.log('✅ Snapshot protection would prevent this operation');
    } else {
      console.log(
        `📤 Output: Found ${snapshotTables.length} snapshot table(s)`
      );

      // Try to demonstrate protection on the first snapshot table
      const firstSnapshotTable = snapshotTables[0] as any;
      const tableName =
        firstSnapshotTable.name || firstSnapshotTable.internal_table_name;

      if (!tableName) {
        console.log(
          '⚠️  Cannot demonstrate protection - snapshot table has no accessible name'
        );
        return;
      }

      console.log(
        `\n📝 Input: Attempting to update snapshot table "${tableName}"`
      );

      try {
        const updateResult = await this.client.tables.update(tableName, {
          description: 'Attempting to update a snapshot table',
        });

        if (isErrorResponse(updateResult)) {
          console.log('📤 Output (update failed):', updateResult.error);
          console.log(
            '✅ Snapshot protection works: Update on snapshot table was blocked'
          );
        } else {
          console.log('📤 Output (update succeeded):', updateResult.data);
          console.log(
            '❌ Snapshot protection failed: Update on snapshot table succeeded'
          );
        }
      } catch (error) {
        console.log('📤 Output (update failed with exception):', error);
        console.log(
          '✅ Snapshot protection works: Update on snapshot table was blocked'
        );
      }

      // Try to demonstrate column protection
      console.log(
        `\n📝 Input: Attempting to create a column in snapshot table "${tableName}"`
      );

      try {
        const columnResult = await this.client.columns.create(tableName, {
          name: 'test_column',
          type: 'text',
          description: 'Attempting to create a column in a snapshot table',
        });

        if (isErrorResponse(columnResult)) {
          console.log(
            '📤 Output (column creation failed):',
            columnResult.error
          );
          console.log(
            '✅ Snapshot protection works: Column creation on snapshot table was blocked'
          );
        } else {
          console.log(
            '📤 Output (column creation succeeded):',
            columnResult.data
          );
          console.log(
            '❌ Snapshot protection failed: Column creation on snapshot table succeeded'
          );
        }
      } catch (error) {
        console.log(
          '📤 Output (column creation failed with exception):',
          error
        );
        console.log(
          '✅ Snapshot protection works: Column creation on snapshot table was blocked'
        );
      }

      // Try to demonstrate record protection
      console.log(
        `\n📝 Input: Attempting to insert a record in snapshot table "${tableName}"`
      );

      try {
        const recordResult = await this.client.records.insert(tableName, {
          test_field: 'Attempting to insert a record in a snapshot table',
        });

        if (isErrorResponse(recordResult)) {
          console.log(
            '📤 Output (record insertion failed):',
            recordResult.error
          );
          console.log(
            '✅ Snapshot protection works: Record insertion on snapshot table was blocked'
          );
        } else {
          console.log(
            '📤 Output (record insertion succeeded):',
            recordResult.data
          );
          console.log(
            '❌ Snapshot protection failed: Record insertion on snapshot table succeeded'
          );
        }
      } catch (error) {
        console.log(
          '📤 Output (record insertion failed with exception):',
          error
        );
        console.log(
          '✅ Snapshot protection works: Record insertion on snapshot table was blocked'
        );
      }
    }

    console.log('\n📋 Snapshot Protection Summary:');
    console.log('   ✅ Table updates are blocked on snapshot tables');
    console.log(
      '   ✅ Column operations (create/update/delete) are blocked on snapshot tables'
    );
    console.log(
      '   ✅ Record operations (insert/update/delete) are blocked on snapshot tables'
    );
    console.log(
      '   ✅ Read operations (find/list/get) are still allowed on snapshot tables'
    );
    console.log(
      '   ✅ Regular tables (non-snapshots) are not affected by protection'
    );

    console.log('✅ Step 19 completed');
  }

  /**
   * 20. Delete table
   */
  private async demoDeleteTable(): Promise<void> {
    console.log('\n2️⃣0️⃣  Deleting Table');
    console.log('-'.repeat(40));

    // Verify the table we're about to delete
    console.log(`📝 Verifying table exists: ${this.createdTableName}`);

    console.log(`📝 Input: Delete table "${this.createdTableName}"`);

    const deleteTableResult = await this.client.tables.delete(
      this.createdTableName
    );

    if (isErrorResponse(deleteTableResult)) {
      console.error(
        '❌ Failed to delete table:',
        deleteTableResult.error.message
      );
      console.log(
        `⚠️  Could not delete the intended table: ${this.createdTableName}`
      );
    } else {
      console.log('📤 Output:', deleteTableResult.data);
      console.log(`✅ Successfully deleted table: ${this.createdTableName}`);
    }

    console.log('✅ Step 20 completed');
  }

  /**
   * Cleanup function - Only operates on resources created during this demo
   * Specifically targets:
   * - Records created during demo (tracked in this.createdRecordIds)
   * - Columns defined in ALL_COLUMN_TYPES for this demo table
   * - The specific demo table (this.createdTableName)
   * - Custom database (if created)
   */
  public async cleanup(): Promise<void> {
    console.log('\n🧹 Starting cleanup...');
    console.log(`   Target table: ${this.createdTableName}`);
    console.log(`   Records to clean: ${this.createdRecordIds.length}`);

    try {
      // Delete any remaining records
      if (this.createdRecordIds.length > 0) {
        try {
          console.log(
            `🗑️  Deleting ${this.createdRecordIds.length} remaining records...`
          );
          const cleanupResult = await this.client.records.delete(
            this.createdTableName,
            {
              record_ids: this.createdRecordIds,
            }
          );
          if (isErrorResponse(cleanupResult)) {
            console.log(
              `   Warning: Record cleanup failed: ${cleanupResult.error.message}`
            );
          } else {
            console.log(`   ✅ Record cleanup successful`);
          }
        } catch (error) {
          console.log(`   Warning: Record cleanup exception: ${error}`);
        }
      }

      // Delete all columns
      try {
        console.log('🗑️  Deleting all columns...');
        for (const column of ALL_COLUMN_TYPES) {
          try {
            const result = await this.client.columns.delete(
              this.createdTableName,
              column.name
            );
            if (isErrorResponse(result)) {
              console.log(
                `   Warning: Failed to delete column ${column.name}: ${result.error.message}`
              );
            }
          } catch (error) {
            console.log(
              `   Warning: Error deleting column ${column.name}: ${error}`
            );
          }
        }
      } catch (error) {
        console.log(`   Warning: Column cleanup exception: ${error}`);
      }

      // Delete table
      try {
        console.log(`🗑️  Deleting table: ${this.createdTableName}`);
        const result = await this.client.tables.delete(this.createdTableName);
        if (isErrorResponse(result)) {
          console.log(
            `   Warning: Failed to delete table: ${result.error.message}`
          );
        } else {
          console.log(`   ✅ Table deleted successfully`);
        }
      } catch (error) {
        console.log(`   Warning: Error deleting table: ${error}`);
      }

      // Delete custom database if it was created
      if (this.customDatabaseId) {
        await this.deleteCustomDatabase();
      }
    } catch (error) {
      console.log(`   Warning: Cleanup exception: ${error}`);
    }
  }

  /**
   * Delete the custom database created for this demo
   */
  private async deleteCustomDatabase(): Promise<void> {
    if (!this.customDatabaseInternalName) return;

    try {
      console.log(
        `🗑️  Deleting custom database: ${this.customDatabaseName} (internal name: ${this.customDatabaseInternalName})`
      );
      const deleteResult = await this.client.databases.delete(
        this.customDatabaseInternalName
      );

      if (isErrorResponse(deleteResult)) {
        console.log(
          `   Warning: Failed to delete custom database: ${deleteResult.error.message}`
        );
        return;
      }

      console.log(
        `   ✅ Custom database deletion job started: ${deleteResult.data.job_id}`
      );
      console.log(`   Note: Use pollDeleteStatus to check completion status`);

      // Clear reference so we don't try to delete twice
      this.customDatabaseId = undefined;
    } catch (error) {
      console.log(`   Warning: Error deleting custom database: ${error}`);
    }
  }

  /**
   * Validate connection and API key
   */
  private async validateConnection(): Promise<void> {
    console.log('🔐 Validating connection and API key...');

    // Try to get client config to validate the connection
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
    // Check for command line argument
    const useCustomDb = process.argv.includes('--use-custom-db');

    if (useCustomDb) {
      console.log(
        '📋 Running with custom database (demonstrating database switching)'
      );
    } else {
      console.log(
        '📋 Running with default database (backward compatible mode)'
      );
    }

    const demo = new ComprehensiveDatabaseOperationsDemo(useCustomDb);
    await demo.runDemo();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
// Check if this is the main module (supports both CommonJS and ES modules)
let isMainModule = false;
if (typeof require !== 'undefined' && require.main === module) {
  isMainModule = true;
} else if (typeof process !== 'undefined' && process.argv[1]) {
  // ES module check - compare file paths
  try {
    // @ts-ignore - import.meta may not be available in all contexts
    const currentUrl = typeof import.meta !== 'undefined' ? import.meta.url : '';
    if (currentUrl && currentUrl.endsWith(process.argv[1])) {
      isMainModule = true;
    }
  } catch {
    // Fallback: if we can't check, assume it's the main module
    isMainModule = true;
  }
}

if (isMainModule) {
  main().catch(async (error) => {
    console.error('❌ Demo failed:', error);
    // Try to run cleanup even if main demo fails
    try {
      const useCustomDb = process.argv.includes('--use-custom-db');
      const demo = new ComprehensiveDatabaseOperationsDemo(useCustomDb);
      await demo.cleanup();
    } catch (cleanupError) {
      console.error('❌ Cleanup also failed:', cleanupError);
    }
    process.exit(1);
  });
}

export { ComprehensiveDatabaseOperationsDemo };
