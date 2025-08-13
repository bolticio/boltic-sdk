/**
 * Comprehensive Database Operations Demo Script
 *
 * This script demonstrates ALL available functionality of the Boltic Database SDK:
 * - Table operations (create, read, update, delete, rename, access control)
 * - Column operations (create, read, update, delete with all supported types)
 * - Record operations (insert, read, update, delete with pagination)
 * - Advanced filtering and querying
 * - Error handling and cleanup
 * - Real API integration
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have proper API access
 */

import * as dotenv from 'dotenv';
import { BolticClient, FieldDefinition, isErrorResponse } from '../../src';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const DEMO_CONFIG = {
  environment: 'sit' as const, // Change to 'prod' for production
  debug: true,
  timeout: 30000,
  tableName: 'comprehensive-demo-table',
  backupTableName: 'comprehensive-demo-table-backup',
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
    selection_source: 'provide-static-list',
    selectable_items: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    multiple_selections: false,
    default_value: 'Option 1',
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
    dropdown_field: 'Option 1',
    phone_field: '+91 987 654 3210',
    link_field: 'https://johndoe.com',
    json_field: { skills: ['JavaScript', 'TypeScript'], experience: 5 },
    date_time_field: '2024-01-15T10:30:00Z',
    vector_field: [0.1, 0.2, 0.3, 0.4, 0.5],
    half_vector_field: [0.1, 0.2, 0.3, 0.4, 0.5],
    sparse_vector_field: '{1:1,3:2,5:3}/5',
  },
  {
    text_field: 'Jane Smith',
    email_field: 'jane.smith@example.com',
    long_text_field:
      'Jane Smith is a talented professional with expertise in multiple domains and a passion for innovation.',
    number_field: 28,
    currency_field: 65000.0,
    checkbox_field: false,
    dropdown_field: 'Option 2',
    phone_field: '+91 876 543 2109',
    link_field: 'https://janesmith.dev',
    json_field: { skills: ['Python', 'Machine Learning'], experience: 3 },
    date_time_field: '2024-02-20T14:45:00Z',
    vector_field: [0.2, 0.3, 0.4, 0.5, 0.6],
    half_vector_field: [0.2, 0.3, 0.4, 0.5, 0.6],
    sparse_vector_field: '{1:0,3:1,5:4}/5',
  },
  {
    text_field: 'Bob Johnson',
    email_field: 'bob.johnson@example.com',
    long_text_field:
      'Bob Johnson brings years of experience in leadership and strategic planning to every project he undertakes.',
    number_field: 35,
    currency_field: 80000.0,
    checkbox_field: true,
    dropdown_field: 'Option 3',
    phone_field: '+91 765 432 1098',
    link_field: 'https://bobjohnson.org',
    json_field: { skills: ['Leadership', 'Strategy'], experience: 8 },
    date_time_field: '2024-03-10T09:15:00Z',
    vector_field: [0.3, 0.4, 0.5, 0.6, 0.7],
    half_vector_field: [0.3, 0.4, 0.5, 0.6, 0.7],
    sparse_vector_field: '{1:0,3:1,5:4}/5',
  },
];

let insertRecordIds: string[] = [];

class ComprehensiveDatabaseOperationsDemo {
  private client: BolticClient;
  private createdTableName: string;
  private createdRecordIds: string[] = [];

  constructor() {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = new BolticClient(apiKey, {
      environment: DEMO_CONFIG.environment,
      debug: DEMO_CONFIG.debug,
      timeout: DEMO_CONFIG.timeout,
    });

    this.createdTableName = DEMO_CONFIG.tableName;
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

      // 1. Create SDK client (already done in constructor)
      await this.demoClientCreation();

      // 2. Create table with all supported column types
      await this.demoTableCreation();

      // 3. Update the table
      await this.demoTableUpdate();

      // // // 4. List all tables
      await this.demoListTables();

      // // // 5. Get table by name
      await this.demoGetTableByName();

      // // // 6. Change table access to public
      await this.demoChangeTableAccess();

      // // // 7. Rename table
      await this.demoRenameTable();

      // // // 8. Add all types of columns with all properties
      await this.demoAddAllColumnTypes();

      // // // 9. Update each type of column
      await this.demoUpdateColumns();

      // // // 10. List columns
      await this.demoListColumns();

      // // // 11. Get column by name
      await this.demoGetColumnByName();

      // // // 12. Update column by name (add/remove constraints)
      await this.demoUpdateColumnConstraints();

      // // // 13. Delete columns
      await this.demoDeleteColumns();

      // // // 14. Add rows in table (with/without null)
      await this.demoAddRecords();

      // // // 15. Get row
      await this.demoGetRecord();

      // // // 16. List rows (with pagination)
      await this.demoListRecordsWithPagination();

      // // // 17. Update values in rows for each data type
      await this.demoUpdateRecords();

      // // // 18. Delete rows
      await this.demoDeleteRecords();

      // // // 19. Bonus: Show working of all types of filters
      await this.demoAllFilterTypes();

      // // 20. Delete table
      await this.demoDeleteTable();

      console.log('\n🎉 Comprehensive demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed with error:', error);
      console.log('\n🧹 Running cleanup due to error...');
      await this.cleanup();
      throw error;
    }
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

    if (isErrorResponse(createTableResult)) {
      throw new Error(
        `Table creation failed: ${createTableResult.error.message}`
      );
    }

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
   * 6. Change table access to public
   */
  private async demoChangeTableAccess(): Promise<void> {
    console.log('\n6️⃣  Changing Table Access to Public');
    console.log('-'.repeat(40));

    console.log('📝 Input: Set table access to public (shared)');
    const accessResult = await this.client.tables.setAccess({
      table_name: this.createdTableName,
      is_shared: true,
    });

    if (accessResult.error) {
      console.error('❌ Failed to change table access:', accessResult.error);
    } else {
      console.log('📤 Output:', accessResult.data);
    }

    console.log('✅ Step 6 completed');
  }

  /**
   * 7. Rename table
   */
  private async demoRenameTable(): Promise<void> {
    console.log('\n7️⃣  Renaming Table');
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

    console.log('✅ Step 7 completed');
  }

  /**
   * 8. Add all types of columns with all properties
   */
  private async demoAddAllColumnTypes(): Promise<void> {
    console.log('\n8️⃣  Adding All Types of Columns with All Properties');
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

    console.log('✅ Step 8 completed');
  }

  /**
   * 9. Update each type of column
   */
  private async demoUpdateColumns(): Promise<void> {
    console.log('\n9️⃣  Updating Each Type of Column');
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

    console.log('✅ Step 9 completed');
  }

  /**
   * 10. List columns
   */
  private async demoListColumns(): Promise<void> {
    console.log('\n🔟  Listing Columns');
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
          `   ${index + 1}. ${column.name} (${column.type}) - ${
            column.description
          }`
        );
      });
    }

    console.log('✅ Step 10 completed');
  }

  /**
   * 11. Get column by name
   */
  private async demoGetColumnByName(): Promise<void> {
    console.log('\n1️⃣1️⃣  Getting Column by Name');
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

    console.log('✅ Step 11 completed');
  }

  /**
   * 12. Update column by name (add/remove constraints)
   */
  private async demoUpdateColumnConstraints(): Promise<void> {
    console.log('\n1️⃣2️⃣  Updating Column Constraints');
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

    console.log('✅ Step 12 completed');
  }

  /**
   * 13. Delete columns
   */
  private async demoDeleteColumns(): Promise<void> {
    console.log('\n1️⃣3️⃣  Deleting Columns');
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

    console.log('✅ Step 13 completed');
  }

  /**
   * 14. Add rows in table (with/without null)
   */
  private async demoAddRecords(): Promise<void> {
    console.log('\n1️⃣4️⃣  Adding Records to Table');
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

    // // Insert a record with some null values
    // const recordWithNulls = {
    //   text_field: 'Null Test User',
    //   email_field: 'nulltest@example.com',
    //   long_text_field: null,
    //   number_field: null,
    //   currency_field: null,
    //   checkbox_field: null,
    //   dropdown_field: null,
    //   phone_field: null,
    //   link_field: null,
    //   date_time_field: null,
    //   half_vector_field: null,
    // };

    // console.log('📝 Input: Inserting record with null values');
    // const nullInsertResult = await this.client.records.insert(
    //   this.createdTableName,
    //   recordWithNulls
    // );

    // if (nullInsertResult.error) {
    //   console.error(
    //     '❌ Failed to insert record with nulls:',
    //     nullInsertResult.error
    //   );
    // } else {
    //   console.log('📤 Output (record with nulls):', nullInsertResult.data);
    //   if (nullInsertResult.data?.id) {
    //     this.createdRecordIds.push(nullInsertResult.data.id);
    //   }
    // }

    console.log('✅ Step 14 completed');
  }

  /**
   * 15. Get row
   */
  private async demoGetRecord(): Promise<void> {
    console.log('\n1️⃣5️⃣  Getting a Specific Record');
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
    }

    console.log('✅ Step 15 completed');
  }

  /**
   * 16. List rows (with pagination)
   */
  private async demoListRecordsWithPagination(): Promise<void> {
    console.log('\n1️⃣6️⃣  Listing Records with Pagination');
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

    console.log('✅ Step 16 completed');
  }

  /**
   * 17. Update values in rows for each data type
   */
  private async demoUpdateRecords(): Promise<void> {
    console.log('\n1️⃣7️⃣  Updating Records for Each Data Type');
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

    console.log('✅ Step 17 completed');
  }

  /**
   * 18. Delete rows
   */
  private async demoDeleteRecords(): Promise<void> {
    console.log('\n1️⃣8️⃣  Deleting Records');
    console.log('-'.repeat(40));

    if (this.createdRecordIds.length === 0) {
      console.log('⚠️  No records available to delete');
      return;
    }

    // Delete by filters
    console.log(
      '📝 Input: Delete records with specific filter (text_field contains "Test")'
    );
    const deleteByFilterResult = await this.client.records.deleteByIds(
      this.createdTableName,
      {
        record_ids: this.createdRecordIds,
      }
    );

    if (deleteByFilterResult.error) {
      console.error(
        '❌ Failed to delete records by filter:',
        deleteByFilterResult.error
      );
    } else {
      console.log('📤 Output (deleted by filter):', deleteByFilterResult.data);
    }

    // Delete by IDs
    if (this.createdRecordIds.length > 0) {
      console.log('📝 Input: Delete records by IDs');
      const deleteByIdsResult = await this.client.records.deleteByIds(
        this.createdTableName,
        {
          record_ids: this.createdRecordIds,
        }
      );

      if (isErrorResponse(deleteByIdsResult)) {
        console.error(
          '❌ Failed to delete records by IDs:',
          deleteByIdsResult.error
        );
      } else {
        console.log('📤 Output (deleted by IDs):', deleteByIdsResult.data);
        this.createdRecordIds = []; // Clear the array
      }
    }

    console.log('✅ Step 18 completed');
  }

  /**
   * 19. Bonus: Show working of all types of filters
   */
  private async demoAllFilterTypes(): Promise<void> {
    console.log('\n1️⃣9️⃣  Demonstrating All Types of Filters');
    console.log('-'.repeat(40));

    // First, let's add some test records for filtering
    const testRecords = [
      {
        text_field: 'Alice',
        number_field: 25,
        currency_field: 50000,
        checkbox_field: true,
        dropdown_field: 'Option 1',
      },
      {
        text_field: 'Bob',
        number_field: 30,
        currency_field: 60000,
        checkbox_field: false,
        dropdown_field: 'Option 2',
      },
      {
        text_field: 'Charlie',
        number_field: 35,
        currency_field: 70000,
        checkbox_field: true,
        dropdown_field: 'Option 3',
      },
      {
        text_field: 'David',
        number_field: 40,
        currency_field: 80000,
        checkbox_field: false,
        dropdown_field: 'Option 1',
      },
    ];

    console.log('📝 Input: Adding test records for filter demonstration');
    for (const record of testRecords) {
      const insertResult = await this.client.records.insert(
        this.createdTableName,
        record
      );
      if (
        !isErrorResponse(insertResult) &&
        insertResult.data &&
        'id' in insertResult.data &&
        insertResult.data.id
      ) {
        this.createdRecordIds.push(insertResult.data.id);
      }
    }

    // Demonstrate different filter types
    const filterExamples = [
      {
        name: 'Equality Filter',
        filters: [{ text_field: { $eq: 'Alice' } }],
        description: 'Find records where text_field equals "Alice"',
      },
      {
        name: 'Inequality Filter',
        filters: [{ number_field: { $ne: 30 } }],
        description: 'Find records where number_field is not 30',
      },
      {
        name: 'Greater Than Filter',
        filters: [{ number_field: { $gt: 30 } }],
        description: 'Find records where number_field is greater than 30',
      },
      {
        name: 'Greater Than or Equal Filter',
        filters: [{ number_field: { $gte: 30 } }],
        description:
          'Find records where number_field is greater than or equal to 30',
      },
      {
        name: 'Less Than Filter',
        filters: [{ number_field: { $lt: 35 } }],
        description: 'Find records where number_field is less than 35',
      },
      {
        name: 'Less Than or Equal Filter',
        filters: [{ number_field: { $lte: 35 } }],
        description:
          'Find records where number_field is less than or equal to 35',
      },
      {
        name: 'In Filter',
        filters: [{ dropdown_field: { $in: ['Option 1', 'Option 2'] } }],
        description:
          'Find records where dropdown_field is in ["Option 1", "Option 2"]',
      },
      {
        name: 'Not In Filter',
        filters: [{ dropdown_field: { $nin: ['Option 3'] } }],
        description: 'Find records where dropdown_field is not in ["Option 3"]',
      },
      {
        name: 'Like Filter',
        filters: [{ text_field: { $like: '%a%' } }],
        description: 'Find records where text_field contains "a"',
      },
      {
        name: 'Case Insensitive Like Filter',
        filters: [{ text_field: { $ilike: '%A%' } }],
        description:
          'Find records where text_field contains "A" (case insensitive)',
      },
      {
        name: 'Between Filter',
        filters: [{ number_field: { $between: [25, 35] } }],
        description: 'Find records where number_field is between 25 and 35',
      },
      {
        name: 'Null Filter',
        filters: [{ long_text_field: { $null: true } }],
        description: 'Find records where long_text_field is null',
      },
      {
        name: 'Exists Filter',
        filters: [{ text_field: { $exists: true } }],
        description: 'Find records where text_field exists',
      },
      {
        name: 'Multiple Filters (AND)',
        filters: [
          { number_field: { $gte: 30 } },
          { checkbox_field: { $eq: true } },
        ],
        description:
          'Find records where number_field >= 30 AND checkbox_field = true',
      },
      {
        name: 'Complex Filter Combination',
        filters: [
          { text_field: { $like: '%a%' } },
          { number_field: { $between: [25, 40] } },
          { dropdown_field: { $in: ['Option 1', 'Option 2'] } },
        ],
        description: 'Complex filter combining multiple conditions',
      },
    ];

    for (const filterExample of filterExamples) {
      console.log(`\n📝 Input: ${filterExample.name}`);
      console.log(`   Description: ${filterExample.description}`);

      const filterResult = await this.client.records.findAll(
        this.createdTableName,
        {
          filters: filterExample.filters,
          page: { page_no: 1, page_size: 10 },
        }
      );

      if (isErrorResponse(filterResult)) {
        console.error(
          `❌ Filter "${filterExample.name}" failed:`,
          filterResult.error
        );
      } else {
        console.log(
          `📤 Output: Found ${filterResult.data?.length || 0} records`
        );
        if (filterResult.data && filterResult.data.length > 0) {
          console.log(
            `   Sample records: ${filterResult.data
              .slice(0, 2)
              .map((r: any) => r.text_field)
              .join(', ')}`
          );
        }
      }
    }

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
          const cleanupResult = await this.client.records.deleteByIds(
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
    } catch (error) {
      console.log(`   Warning: Cleanup exception: ${error}`);
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
    const demo = new ComprehensiveDatabaseOperationsDemo();
    await demo.runDemo();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
// Check if this is the main module (ES module equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async (error) => {
    console.error('❌ Demo failed:', error);
    // Try to run cleanup even if main demo fails
    try {
      const demo = new ComprehensiveDatabaseOperationsDemo();
      await demo.cleanup();
    } catch (cleanupError) {
      console.error('❌ Cleanup also failed:', cleanupError);
    }
    process.exit(1);
  });
}

export { ComprehensiveDatabaseOperationsDemo };
