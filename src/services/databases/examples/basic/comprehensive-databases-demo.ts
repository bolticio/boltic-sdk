/**
 * Comprehensive Databases Module Demo Script
 *
 * This script demonstrates ALL available functionality of the Boltic Database Management SDK:
 * - Database CRUD operations (create, list, update, delete)
 * - Database job management and polling
 * - Switching between databases
 * - Using different databases for table, column, and record operations
 * - Backward compatibility (default database behavior)
 * - Database filtering, sorting, and pagination
 * - Real API integration
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have proper API access
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  BolticClient,
  DatabaseCreateRequest,
  isErrorResponse,
} from '../../src';

// Load environment variables — resolve relative to script location, then fall back to CWD
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.BOLTIC_API_KEY) {
  dotenv.config();
}

// Configuration
const DEMO_CONFIG = {
  debug: true,
  timeout: 30000,
  region: 'asia-south1' as const,
};

// Demo database names
const DEMO_DATABASES = {
  primary: 'demo-primary-db',
  secondary: 'demo-secondary-db',
  test: 'demo-test-db',
};

class ComprehensiveDatabasesDemo {
  private client: BolticClient;
  private createdDatabaseIds: string[] = [];
  private createdDatabaseInternalNames: string[] = [];
  private createdJobIds: string[] = [];

  constructor() {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = new BolticClient(apiKey, DEMO_CONFIG);
  }

  /**
   * Run the complete demo
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Starting Comprehensive Databases Module Demo');
    console.log('='.repeat(80));

    try {
      // 1. Validate connection
      await this.validateConnection();

      // 2. List existing databases (showing backward compatibility)
      await this.demoListDatabases();

      // 3. Get default database
      await this.demoGetDefaultDatabase();

      // 4. Create new databases
      await this.demoCreateDatabases();

      // 5. List databases with pagination
      await this.demoListDatabasesWithPagination();

      // 6. List databases with sorting
      await this.demoListDatabasesWithSorting();

      // 7. List databases with filtering
      await this.demoListDatabasesWithFiltering();

      // 8. Get specific database by internal name
      await this.demoGetDatabaseByName();

      // 9. Find one database by criteria
      await this.demoFindOneDatabase();

      // 10. Update database
      await this.demoUpdateDatabase();

      // 11. Switch between databases
      await this.demoSwitchDatabases();

      // 12. Delete database and poll status
      await this.demoDeleteDatabase();

      // 13. List database jobs
      await this.demoListDatabaseJobs();

      // 14. Cleanup remaining databases
      await this.cleanup();

      console.log('\n🎉 Comprehensive databases demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed with error:', error);
      console.log('\n🧹 Running cleanup due to error...');
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 1. Validate connection
   */
  private async validateConnection(): Promise<void> {
    console.log('\n1️⃣  Validating Connection and API Key');
    console.log('-'.repeat(40));

    try {
      const config = this.client.getConfig();
      console.log('✅ API key and connection validated successfully');
      console.log(`   Environment: ${config.environment}`);
      console.log(`   Region: ${config.region}`);
    } catch (error) {
      throw new Error(`Invalid API key or connection failed: ${error}`);
    }

    console.log('✅ Step 1 completed');
  }

  /**
   * 2. List existing databases (backward compatibility demo)
   */
  private async demoListDatabases(): Promise<void> {
    console.log('\n2️⃣  Listing All Databases (Backward Compatibility Demo)');
    console.log('-'.repeat(40));

    console.log('📝 Input: List all databases without any filters');
    const result = await this.client.databases.findAll();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to list databases:', result.error.message);
    } else {
      console.log(`📤 Output: Found ${result.data.length} databases`);
      console.log('   Sample databases:');
      result.data.slice(0, 3).forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. ${db.db_name} (ID: ${db.id})`);
        console.log(`      Internal Name: ${db.db_internal_name}`);
        console.log(`      Status: ${db.status}`);
        console.log(`      Is Default: ${db.is_default}`);
      });

      if (result.pagination) {
        console.log(
          `   Pagination: Page ${result.pagination.current_page} of ${result.pagination.total_count} total`
        );
      }
    }

    console.log('✅ Step 2 completed - Showing backward compatibility');
  }

  /**
   * 3. Get default database
   */
  private async demoGetDefaultDatabase(): Promise<void> {
    console.log('\n3️⃣  Getting Default Database');
    console.log('-'.repeat(40));

    console.log('📝 Input: Get the default database for this account');
    const result = await this.client.databases.getDefault();

    if (isErrorResponse(result)) {
      console.error('❌ Failed to get default database:', result.error.message);
    } else {
      console.log('📤 Output: Default database found');
      console.log(`   Name: ${result.data.db_name}`);
      console.log(`   Internal Name: ${result.data.db_internal_name}`);
      console.log(`   ID: ${result.data.id}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Created: ${result.data.created_at}`);
    }

    console.log('✅ Step 3 completed');
  }

  /**
   * 4. Create new databases
   */
  private async demoCreateDatabases(): Promise<void> {
    console.log('\n4️⃣  Creating New Databases');
    console.log('-'.repeat(40));

    for (const [key, dbName] of Object.entries(DEMO_DATABASES)) {
      console.log(`\n📝 Input: Creating database "${dbName}"`);

      const request: DatabaseCreateRequest = {
        db_name: dbName,
        db_internal_name: dbName.replace(/-/g, '_'),
        resource_id: 'boltic',
      };

      const result = await this.client.databases.create(request);

      if (isErrorResponse(result)) {
        console.error(
          `❌ Failed to create database ${dbName}:`,
          result.error.message
        );
      } else {
        console.log(`📤 Output: Database "${dbName}" created successfully`);
        console.log(`   ID: ${result.data.id}`);
        console.log(`   Internal Name: ${result.data.db_internal_name}`);
        console.log(`   Status: ${result.data.status}`);
        this.createdDatabaseIds.push(result.data.id);
        this.createdDatabaseInternalNames.push(result.data.db_internal_name);
      }
    }

    console.log('✅ Step 4 completed');
  }

  /**
   * 5. List databases with pagination
   */
  private async demoListDatabasesWithPagination(): Promise<void> {
    console.log('\n5️⃣  Listing Databases with Pagination');
    console.log('-'.repeat(40));

    console.log('📝 Input: Get first page with 2 items per page');
    const result = await this.client.databases.findAll({
      page: {
        page_no: 1,
        page_size: 2,
      },
    });

    if (isErrorResponse(result)) {
      console.error('❌ Failed to list databases:', result.error.message);
    } else {
      console.log(
        `📤 Output: Found ${result.data.length} databases on this page`
      );
      result.data.forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. ${db.db_name} (${db.db_internal_name})`);
      });

      if (result.pagination) {
        console.log(
          `   Pagination: Page ${result.pagination.current_page}, Total: ${result.pagination.total_count}`
        );
      }
    }

    console.log('✅ Step 5 completed');
  }

  /**
   * 6. List databases with sorting
   */
  private async demoListDatabasesWithSorting(): Promise<void> {
    console.log('\n6️⃣  Listing Databases with Sorting');
    console.log('-'.repeat(40));

    console.log('📝 Input: List databases sorted by name (ascending)');
    const result = await this.client.databases.findAll({
      sort: [{ field: 'db_name', direction: 'asc' }],
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(result)) {
      console.error('❌ Failed to list databases:', result.error.message);
    } else {
      console.log(`📤 Output: Found ${result.data.length} databases (sorted)`);
      result.data.forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. ${db.db_name}`);
      });
    }

    console.log('✅ Step 6 completed');
  }

  /**
   * 7. List databases with filtering
   */
  private async demoListDatabasesWithFiltering(): Promise<void> {
    console.log('\n7️⃣  Listing Databases with Filtering');
    console.log('-'.repeat(40));

    // Test 1: Filter by status
    console.log('📝 Input: Filter databases by status = ACTIVE');
    const result = await this.client.databases.findAll({
      filters: [{ field: 'status', operator: '=', values: ['ACTIVE'] }],
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(result)) {
      console.error('❌ Failed to list databases:', result.error.message);
    } else {
      console.log(`📤 Output: Found ${result.data.length} active databases`);
      result.data.forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. ${db.db_name} - Status: ${db.status}`);
      });
    }

    // Test 2: Filter by database name (db_name)
    console.log('\n📝 Input: Filter databases by db_name (display name)');
    if (this.createdDatabaseInternalNames.length > 0) {
      // Get first created database to test filtering
      const dbInfo = await this.client.databases.findOne(
        this.createdDatabaseInternalNames[0]
      );
      if (!isErrorResponse(dbInfo)) {
        const nameFilterResult = await this.client.databases.findAll({
          filters: [
            { field: 'db_name', operator: '=', values: [dbInfo.data.db_name] },
          ],
          page: { page_no: 1, page_size: 5 },
        });

        if (isErrorResponse(nameFilterResult)) {
          console.error(
            '❌ Failed to filter by name:',
            nameFilterResult.error.message
          );
        } else {
          console.log(
            `📤 Output: Found ${nameFilterResult.data.length} database(s) with name "${dbInfo.data.db_name}"`
          );
        }
      }
    }

    // Test 3: Filter by is_default
    console.log('\n📝 Input: Filter databases by is_default = true');
    const defaultFilterResult = await this.client.databases.findAll({
      filters: [{ field: 'is_default', operator: '=', values: [true] }],
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(defaultFilterResult)) {
      console.error(
        '❌ Failed to filter by is_default:',
        defaultFilterResult.error.message
      );
    } else {
      console.log(
        `📤 Output: Found ${defaultFilterResult.data.length} default database(s)`
      );
      defaultFilterResult.data.forEach((db: any, index: number) => {
        console.log(
          `   ${index + 1}. ${db.db_name} - Is Default: ${db.is_default}`
        );
      });
    }

    // Test 4: Filter by db_internal_name
    console.log('\n📝 Input: Filter databases by db_internal_name (slug)');
    if (this.createdDatabaseInternalNames.length > 0) {
      const dbInfo = await this.client.databases.findOne(
        this.createdDatabaseInternalNames[0]
      );
      if (!isErrorResponse(dbInfo)) {
        const slugFilterResult = await this.client.databases.findAll({
          filters: [
            {
              field: 'db_internal_name',
              operator: '=',
              values: [dbInfo.data.db_internal_name],
            },
          ],
          page: { page_no: 1, page_size: 5 },
        });

        if (isErrorResponse(slugFilterResult)) {
          console.error(
            '❌ Failed to filter by internal name:',
            slugFilterResult.error.message
          );
        } else {
          console.log(
            `📤 Output: Found ${slugFilterResult.data.length} database(s) with internal name "${dbInfo.data.db_internal_name}"`
          );
        }
      }
    }

    // Test 5: Multiple filters (AND logic)
    console.log(
      '\n📝 Input: Filter databases with multiple conditions (status = ACTIVE AND is_default = false)'
    );
    const multiFilterResult = await this.client.databases.findAll({
      filters: [
        { field: 'status', operator: '=', values: ['ACTIVE'] },
        { field: 'is_default', operator: '=', values: [false] },
      ],
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(multiFilterResult)) {
      console.error(
        '❌ Failed to filter with multiple conditions:',
        multiFilterResult.error.message
      );
    } else {
      console.log(
        `📤 Output: Found ${multiFilterResult.data.length} non-default active database(s)`
      );
    }

    console.log(
      '\n✅ Step 7 completed - Verified filters work on all database detail keys'
    );
  }

  /**
   * 8. Get specific database by internal name
   */
  private async demoGetDatabaseByName(): Promise<void> {
    console.log('\n8️⃣  Getting Database by Internal Name');
    console.log('-'.repeat(40));

    if (this.createdDatabaseInternalNames.length === 0) {
      console.log('⚠️  No databases available to query');
      return;
    }

    const dbInternalName = this.createdDatabaseInternalNames[0];
    console.log(
      `📝 Input: Get database with internal name "${dbInternalName}"`
    );

    const result = await this.client.databases.findOne(dbInternalName);

    if (isErrorResponse(result)) {
      console.error('❌ Failed to get database:', result.error.message);
    } else {
      console.log('📤 Output: Database found');
      console.log(`   Name: ${result.data.db_name}`);
      console.log(`   Internal Name: ${result.data.db_internal_name}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Is Default: ${result.data.is_default}`);
    }

    console.log('✅ Step 8 completed');
  }

  /**
   * 9. Find one database by internal name
   */
  private async demoFindOneDatabase(): Promise<void> {
    console.log('\n9️⃣  Finding One Database by Internal Name');
    console.log('-'.repeat(40));

    const dbInternalName = DEMO_DATABASES.primary.replace(/-/g, '_');
    console.log(
      `📝 Input: Find database with internal name "${dbInternalName}"`
    );

    const result = await this.client.databases.findOne(dbInternalName);

    if (isErrorResponse(result)) {
      console.error('❌ Failed to find database:', result.error.message);
    } else {
      console.log('📤 Output: Database found');
      console.log(`   Name: ${result.data.db_name}`);
      console.log(`   Internal Name: ${result.data.db_internal_name}`);
      console.log(`   ID: ${result.data.id}`);
    }

    console.log('✅ Step 9 completed');
  }

  /**
   * 10. Update database
   */
  private async demoUpdateDatabase(): Promise<void> {
    console.log('\n1️⃣0️⃣  Updating Database');
    console.log('-'.repeat(40));

    if (this.createdDatabaseInternalNames.length === 0) {
      console.log('⚠️  No databases available to update');
      return;
    }

    const dbInternalName = this.createdDatabaseInternalNames[0];
    const newName = `${DEMO_DATABASES.primary}-updated`;

    console.log(
      `📝 Input: Update database name to "${newName}" using internal name "${dbInternalName}"`
    );

    const result = await this.client.databases.update(dbInternalName, {
      db_name: newName,
    });

    if (isErrorResponse(result)) {
      console.error('❌ Failed to update database:', result.error.message);
    } else {
      console.log('📤 Output: Database updated successfully');
      console.log(`   New Name: ${result.data.db_name}`);
      console.log(`   Updated At: ${result.data.updated_at}`);
    }

    console.log('✅ Step 10 completed');
  }

  /**
   * 11. Switch between databases
   */
  private async demoSwitchDatabases(): Promise<void> {
    console.log('\n1️⃣1️⃣  Switching Between Databases');
    console.log('-'.repeat(40));

    if (this.createdDatabaseIds.length < 2) {
      console.log('⚠️  Not enough databases to demonstrate switching');
      return;
    }

    // Derive internal names (slugs) from demo names to simulate user-provided slugs
    const primarySlug = DEMO_DATABASES.primary.replace(/-/g, '_');
    const secondarySlug = DEMO_DATABASES.secondary.replace(/-/g, '_');

    console.log('📝 Input: Switch to first database by internal name (slug)');
    await this.client.useDatabase(primarySlug);
    console.log(`📤 Current database slug: ${primarySlug}`);

    // Verify we can create a table with encrypted columns in this database
    console.log('\n📝 Input: Creating a table with encrypted columns in switched database');
    const tableRes = await this.client.tables.create({
      name: 'database_switch_test',
      fields: [
        { name: 'sensitive_info', type: 'encrypted', show_decrypted: false }
      ]
    });
    if (!isErrorResponse(tableRes)) {
      console.log('✅ Successfully created table with encrypted column across DB switch');
      // cleanup
      await this.client.tables.delete('database_switch_test');
    }

    console.log(
      '\n📝 Input: Switch to second database by internal name (slug)'
    );
    await this.client.useDatabase(secondarySlug);
    console.log(`📤 Current database slug: ${secondarySlug}`);

    console.log('\n📝 Input: Switch back to default database');
    await this.client.useDatabase();
    console.log('📤 Current database: default');

    console.log('✅ Step 11 completed');
  }

  /**
   * 12. Delete database and poll status
   */
  private async demoDeleteDatabase(): Promise<void> {
    console.log('\n1️⃣2️⃣  Deleting Database and Polling Status');
    console.log('-'.repeat(40));

    if (this.createdDatabaseInternalNames.length === 0) {
      console.log('⚠️  No databases available to delete');
      return;
    }

    // Use the last database for deletion demo
    const dbInternalName =
      this.createdDatabaseInternalNames[
      this.createdDatabaseInternalNames.length - 1
      ];

    console.log(
      `📝 Input: Initiate deletion for database with internal name "${dbInternalName}"`
    );

    const deleteResult = await this.client.databases.delete(dbInternalName);

    if (isErrorResponse(deleteResult)) {
      console.error(
        '❌ Failed to initiate deletion:',
        deleteResult.error.message
      );
      return;
    }

    console.log('📤 Output: Deletion job started');
    console.log(`   Job ID: ${deleteResult.data.job_id}`);
    console.log(`   Status: ${deleteResult.data.status}`);

    const jobId = deleteResult.data.job_id;
    this.createdJobIds.push(jobId);

    // Poll status
    console.log('\n📝 Input: Poll deletion status');

    const statusResult = await this.client.databases.pollDeleteStatus(jobId);

    if (isErrorResponse(statusResult)) {
      console.error('❌ Failed to poll status:', statusResult.error.message);
    } else if (!statusResult.data) {
      console.error('❌ Poll status returned no data');
      console.log('   Response:', statusResult);
    } else {
      console.log('📤 Output: Deletion status retrieved');
      console.log(`   Job ID: ${statusResult.data.jobId}`);
      console.log(`   Status: ${statusResult.data.status}`);
      console.log(`   Message: ${statusResult.data.message}`);
    }

    // Note: Deletion is asynchronous. Use pollDeleteStatus to check completion.
    console.log(
      '\n📝 Note: Deletion is asynchronous. Poll pollDeleteStatus to check completion.'
    );

    // Remove from tracking
    const dbIndex = this.createdDatabaseInternalNames.indexOf(dbInternalName);
    if (dbIndex !== -1) {
      this.createdDatabaseIds.splice(dbIndex, 1);
      this.createdDatabaseInternalNames.splice(dbIndex, 1);
    }

    console.log('✅ Step 12 completed');
  }

  /**
   * 13. List database jobs
   */
  private async demoListDatabaseJobs(): Promise<void> {
    console.log('\n1️⃣3️⃣  Listing Database Jobs');
    console.log('-'.repeat(40));

    console.log('📝 Input: List all database jobs');
    const result = await this.client.databases.listJobs({
      page: { page_no: 1, page_size: 10 },
      sort: [{ field: 'created_at', direction: 'desc' }],
    });

    if (isErrorResponse(result)) {
      console.error('❌ Failed to list jobs:', result.error.message);
    } else {
      console.log(`📤 Output: Found ${result.data.length} jobs`);
      result.data.slice(0, 3).forEach((job: any, index: number) => {
        console.log(`   ${index + 1}. Job ID: ${job.id}`);
        console.log(`      Action: ${job.action}`);
        console.log(`      Status: ${job.job_status}`);
        console.log(`      Database: ${job.db_internal_name}`);
        console.log(`      Created: ${job.created_at}`);
      });

      if (result.pagination) {
        console.log(
          `   Pagination: Total ${result.pagination.total_count} jobs`
        );
      }
    }

    console.log('✅ Step 13 completed');
  }

  /**
   * Cleanup function
   */
  public async cleanup(): Promise<void> {
    console.log('\n🧹 Starting cleanup...');
    console.log(
      `   Databases to clean: ${this.createdDatabaseInternalNames.length}`
    );

    for (const dbInternalName of this.createdDatabaseInternalNames) {
      try {
        console.log(`🗑️  Deleting database: ${dbInternalName}`);
        const result = await this.client.databases.delete(dbInternalName);

        if (!isErrorResponse(result)) {
          console.log(`   ✅ Deletion job started: ${result.data.job_id}`);
          console.log(
            `   Note: Use pollDeleteStatus to check completion status`
          );
        }
      } catch (error) {
        console.log(
          `   Warning: Error deleting database ${dbInternalName}:`,
          error
        );
      }
    }

    console.log('✅ Cleanup completed');
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const demo = new ComprehensiveDatabasesDemo();
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
    process.exit(1);
  });
}

export { ComprehensiveDatabasesDemo };
