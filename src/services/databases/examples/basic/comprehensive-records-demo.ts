#!/usr/bin/env ts-node

/**
 * Comprehensive Records SDK E2E Demo Script
 *
 * This script demonstrates all available functionality of the Boltic Records SDK:
 * - Direct record operations (insert, findAll, findOne, update, delete)
 * - Fluent interface operations with chaining
 * - Advanced filtering and querying
 * - Pagination and sorting
 * - Error handling and validation
 * - Real API integration
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have a test table with appropriate schema
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { BolticClient, isErrorResponse } from '../../src';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const apiKey = process.env.BOLTIC_API_KEY;
const debug = process.env.DEBUG === 'true';

// Demo configuration
const DEMO_CONFIG = {
  tableName: 'comprehensive-records-demo',
  sampleSize: 10,
  maxRetries: 3,
  retryDelay: 1000,
};

// Demo record data
const DEMO_RECORDS = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    age: 28,
    status: ['active'],
    department: 'Engineering',
    salary: 65000,
    join_date: '2023-01-15',
    skills: ['JavaScript', 'React', 'Node.js'],
    is_manager: false,
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    age: 35,
    status: ['active'],
    department: 'Sales',
    salary: 72000,
    join_date: '2022-03-10',
    skills: ['Communication', 'CRM', 'Negotiation'],
    is_manager: true,
  },
  {
    name: 'Carol Davis',
    email: 'carol.davis@example.com',
    age: 31,
    status: ['inactive'],
    department: 'Marketing',
    salary: 58000,
    join_date: '2023-06-20',
    skills: ['Content Creation', 'SEO', 'Analytics'],
    is_manager: false,
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    age: 42,
    status: ['active'],
    department: 'Engineering',
    salary: 85000,
    join_date: '2021-11-05',
    skills: ['Python', 'Django', 'PostgreSQL', 'Leadership'],
    is_manager: true,
  },
  {
    name: 'Eve Brown',
    email: 'eve.brown@example.com',
    age: 26,
    status: ['active'],
    department: 'HR',
    salary: 52000,
    join_date: '2023-09-12',
    skills: ['Recruitment', 'Employee Relations', 'Training'],
    is_manager: false,
  },
];

/**
 * Comprehensive Records Demo Class
 * Demonstrates all record operations with detailed logging and error handling
 */
class ComprehensiveRecordsDemo {
  private client: BolticClient;
  private createdRecordIds: string[] = [];

  constructor() {
    if (!apiKey) {
      throw new Error(
        '❌ BOLTIC_API_KEY is required. Please set it in your .env file.'
      );
    }

    this.client = new BolticClient(apiKey, { debug, environment: 'sit' });
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive Records Demo');
    console.log('=====================================');
    console.log(`📋 Table: ${DEMO_CONFIG.tableName}`);
    console.log(`🔧 Environment: ${this.client.getEnvironment()}`);
    console.log(`🌍 Region: ${this.client.getRegion()}`);
    console.log(`🐛 Debug: ${this.client.isDebugEnabled()}`);
    console.log('');

    try {
      // Run all demos in sequence
      await this.demoDirectOperations();
      await this.demoFluentAPI();
      await this.demoBulkOperations();
      await this.demoFilteringAndSorting();
      await this.demoErrorHandling();

      console.log('🎉 All record demos completed successfully!');
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    } finally {
      // Always cleanup
      await this.cleanup();
    }
  }

  private async demoDirectOperations(): Promise<void> {
    console.log('📋 Demo 1: Direct Record Operations');
    console.log('=====================================\n');

    // 1. Insert a single record
    console.log('1️⃣ Inserting a single record...');
    const insertResult = await this.client.records.insert(
      DEMO_CONFIG.tableName,
      {
        name: 'Demo User',
        email: 'demo@example.com',
        age: 25,
        status: ['active'],
        department: 'Demo',
        salary: 50000,
        join_date: '2024-01-01',
        skills: ['Demo', 'Testing'],
        is_manager: false,
      }
    );

    if (isErrorResponse(insertResult)) {
      throw new Error(`Insert failed: ${insertResult.error.message}`);
    }

    if (!insertResult.data) {
      throw new Error('Insert succeeded but no data returned');
    }

    const insertedRecord = insertResult.data;

    this.createdRecordIds.push(insertedRecord.id);
    console.log(`✅ Record inserted with ID: ${insertedRecord.id}`);
    console.log(
      `   Name: ${insertedRecord.name}, Email: ${insertedRecord.email}\n`
    );

    // 2. Get the inserted record by ID
    console.log('2️⃣ Getting the inserted record by ID...');
    const getResult = await this.client.records.get(
      DEMO_CONFIG.tableName,
      insertedRecord.id
    );

    if (isErrorResponse(getResult)) {
      throw new Error(`Get failed: ${getResult.error.message}`);
    }

    if (getResult.data) {
      console.log(
        `✅ Record found: ${getResult.data.name} (${getResult.data.email})\n`
      );
    } else {
      console.log('⚠️  Record not found after insertion\n');
    }

    // 3. Update the record
    console.log('3️⃣ Updating the record...');
    const updateResult = await this.client.records.updateById(
      DEMO_CONFIG.tableName,
      insertedRecord.id,
      {
        age: 26,
        salary: 52000,
        skills: ['Demo', 'Testing', 'Updated'],
      }
    );

    if (isErrorResponse(updateResult)) {
      throw new Error(`Update failed: ${updateResult.error.message}`);
    }

    if (!updateResult.data) {
      throw new Error('Update succeeded but no data returned');
    }

    console.log(
      `✅ Record updated: Age: ${updateResult.data.age}, Salary: ${updateResult.data.salary}\n`
    );

    // 4. List all records with pagination
    console.log('4️⃣ Listing all records with pagination...');
    const listResult = await this.client.records.list(DEMO_CONFIG.tableName, {
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(listResult)) {
      throw new Error(`List failed: ${listResult.error.message}`);
    }

    console.log(`✅ Found ${listResult.data.length} records\n`);
  }

  private async demoFluentAPI(): Promise<void> {
    console.log('🔧 Demo 2: Fluent API Operations');
    console.log('=================================\n');

    // 1. Query with fluent API
    console.log('1️⃣ Querying with fluent API...');
    const queryResult = await this.client
      .record(DEMO_CONFIG.tableName)
      .where({ department: 'Demo' })
      .limit(3)
      .list();

    if (isErrorResponse(queryResult)) {
      console.log(`Query failed: ${queryResult.error.message}`);
    } else {
      console.log(
        `✅ Found ${queryResult.data.length} records with fluent API\n`
      );
    }

    // 2. Update with fluent API using RecordBuilder
    console.log('2️⃣ Update with fluent API...');
    if (this.createdRecordIds.length > 0) {
      const updateResult = await this.client
        .record(DEMO_CONFIG.tableName)
        .set({ department: 'Updated Demo' })
        .updateById(this.createdRecordIds[0]);

      if (isErrorResponse(updateResult)) {
        console.log(`Fluent update failed: ${updateResult.error.message}`);
      } else {
        console.log('✅ Record updated with fluent API\n');
      }
    }
  }

  private async demoBulkOperations(): Promise<void> {
    console.log('📦 Demo 3: Bulk Operations');
    console.log('===========================\n');

    // 1. Insert multiple records
    console.log('1️⃣ Inserting multiple records...');
    for (const record of DEMO_RECORDS.slice(0, 3)) {
      const insertResult = await this.client.records.insert(
        DEMO_CONFIG.tableName,
        record
      );

      if (isErrorResponse(insertResult)) {
        console.log(
          `Failed to insert ${record.name}: ${insertResult.error.message}`
        );
      } else {
        this.createdRecordIds.push(insertResult.data.id);
        console.log(`   ✅ Inserted: ${record.name}`);
      }
    }
    console.log('');

    // 2. List all records to see the bulk insert results
    console.log('2️⃣ Listing all records...');
    const listResult = await this.client.records.list(DEMO_CONFIG.tableName);

    if (isErrorResponse(listResult)) {
      console.log(`List failed: ${listResult.error.message}`);
    } else {
      console.log(`✅ Total records in table: ${listResult.data.length}\n`);
    }
  }

  private async demoFilteringAndSorting(): Promise<void> {
    console.log('🔍 Demo 4: Filtering and Sorting');
    console.log('=================================\n');

    // 1. Filter by department
    console.log('1️⃣ Filtering by department...');
    const filterResult = await this.client.records.list(DEMO_CONFIG.tableName, {
      filters: [
        { field: 'department', operator: 'equals', value: 'Engineering' },
      ],
    });

    if (isErrorResponse(filterResult)) {
      console.log(`Filter failed: ${filterResult.error.message}`);
    } else {
      console.log(`✅ Found ${filterResult.data.length} engineering records\n`);
    }

    // 2. Sort by age
    console.log('2️⃣ Sorting by age...');
    const sortResult = await this.client.records.list(DEMO_CONFIG.tableName, {
      sort: [{ field: 'age', order: 'desc' }],
      page: { page_no: 1, page_size: 5 },
    });

    if (isErrorResponse(sortResult)) {
      console.log(`Sort failed: ${sortResult.error.message}`);
    } else {
      console.log(`✅ Found ${sortResult.data.length} records sorted by age\n`);
    }
  }

  private async demoErrorHandling(): Promise<void> {
    console.log('⚠️ Demo 5: Error Handling');
    console.log('==========================\n');

    // 1. Try to get non-existent record
    console.log('1️⃣ Getting non-existent record...');
    const getResult = await this.client.records.get(
      DEMO_CONFIG.tableName,
      'non-existent-id'
    );

    if (isErrorResponse(getResult)) {
      console.log(`✅ Expected error: ${getResult.error.message}\n`);
    } else {
      console.log('❓ Unexpected success for non-existent record\n');
    }

    // 2. Try to update non-existent record
    console.log('2️⃣ Updating non-existent record...');
    const updateResult = await this.client.records.updateById(
      DEMO_CONFIG.tableName,
      'non-existent-id',
      { name: 'Updated' }
    );

    if (isErrorResponse(updateResult)) {
      console.log(`✅ Expected error: ${updateResult.error.message}\n`);
    } else {
      console.log('❓ Unexpected success for non-existent record\n');
    }

    // 3. Try to insert invalid data
    console.log('3️⃣ Inserting invalid record...');
    const insertResult = await this.client.records.insert(
      'non-existent-table',
      { invalid: 'data' }
    );

    if (isErrorResponse(insertResult)) {
      console.log(`✅ Expected error: ${insertResult.error.message}\n`);
    } else {
      console.log('❓ Unexpected success for invalid insert\n');
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleanup: Removing demo records...');

    if (this.createdRecordIds.length === 0) {
      console.log('   No demo records to clean up');
      return;
    }

    try {
      const cleanupResult = await this.client.records.deleteByIds(
        DEMO_CONFIG.tableName,
        {
          record_ids: this.createdRecordIds,
        }
      );

      if (isErrorResponse(cleanupResult)) {
        console.log(
          `   Warning: Cleanup failed: ${cleanupResult.error.message}`
        );
      } else if (cleanupResult.data) {
        console.log(`   ✅ Cleanup successful: ${cleanupResult.data.message}`);
        console.log(`   Removed ${this.createdRecordIds.length} demo records`);
      } else {
        console.log(
          `   ✅ Cleanup completed for ${this.createdRecordIds.length} records`
        );
      }
    } catch (error) {
      console.log(`   Warning: Cleanup exception: ${error}`);
    }
    console.log('');
  }
}

// Main execution
async function main() {
  try {
    const demo = new ComprehensiveRecordsDemo();
    await demo.run();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
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

export { ComprehensiveRecordsDemo, main };
