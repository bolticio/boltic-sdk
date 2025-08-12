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

import dotenv from 'dotenv';
import { BolticClient } from '../../src/client';
import { RecordData } from '../../src/types/api/record';
dotenv.config();

// Configuration
const DEMO_CONFIG = {
  environment: 'sit' as const, // Change to 'prod' for production
  debug: true,
  timeout: 30000,
  tableName: 'demo_users', // Change this to your actual table name
};

// Sample data for demonstrations
const SAMPLE_USERS: RecordData[] = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
    status: ['active'],
    department: 'Engineering',
    salary: 75000,
    join_date: '2023-01-15',
    skills: ['JavaScript', 'TypeScript', 'Node.js'],
    is_manager: false,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 28,
    status: ['active'],
    department: 'Design',
    salary: 65000,
    join_date: '2023-03-20',
    skills: ['UI/UX', 'Figma', 'Prototyping'],
    is_manager: true,
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    age: 35,
    status: ['inactive'],
    department: 'Marketing',
    salary: 70000,
    join_date: '2022-11-10',
    skills: ['Digital Marketing', 'SEO', 'Analytics'],
    is_manager: false,
  },
  {
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    age: 32,
    status: ['active'],
    department: 'Engineering',
    salary: 80000,
    join_date: '2022-08-05',
    skills: ['Python', 'Machine Learning', 'Data Science'],
    is_manager: true,
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    age: 29,
    status: ['active'],
    department: 'Sales',
    salary: 60000,
    join_date: '2023-06-12',
    skills: ['Sales', 'CRM', 'Negotiation'],
    is_manager: false,
  },
];

class RecordsSDKDemo {
  private client: BolticClient;
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
  }

  /**
   * Run the complete demo
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Starting Boltic Records SDK E2E Demo\n');

    try {
      // Validate API key and connection
      await this.validateConnection();

      // Demo 1: Direct Record Operations
      await this.demoDirectOperations();

      // Cleanup
      await this.cleanup();

      console.log('\n✅ Demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Demo 1: Direct Record Operations
   * Shows the basic CRUD operations using direct method calls
   */
  private async demoDirectOperations(): Promise<void> {
    console.log('📋 Demo 1: Direct Record Operations');
    console.log('=====================================\n');

    // // 1. Insert a single record
    console.log('1️⃣ Inserting a single record...');
    const insertResult = await this.client.record.insert(
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

    if (insertResult.error) {
      throw new Error(`Insert failed: ${insertResult.error}`);
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

    // 2. Find the inserted record
    console.log('2️⃣ Finding the inserted record...');
    const findResult = await this.client.record.findOne(DEMO_CONFIG.tableName, {
      filters: [{ field: 'id', operator: '=', values: [insertedRecord.id] }],
    });

    if (findResult.error) {
      throw new Error(`Find failed: ${findResult.error}`);
    }

    if (findResult.data) {
      console.log(
        `✅ Record found: ${findResult.data.name} (${findResult.data.email})\n`
      );
    } else {
      console.log('⚠️  Record not found after insertion\n');
    }

    // // 3. Update the record
    console.log('3️⃣ Updating the record...');
    const updateResult = await this.client.record.updateById(
      DEMO_CONFIG.tableName,
      {
        id: insertedRecord.id,
        set: {
          age: 26,
          salary: 52000,
          skills: ['Demo', 'Testing', 'Updated'],
        },
      }
    );

    if (updateResult.error) {
      throw new Error(`Update failed: ${updateResult.error}`);
    }

    if (!updateResult.data) {
      throw new Error('Update succeeded but no data returned');
    }

    console.log(
      `✅ Record updated: Age: ${updateResult.data.age}, Salary: ${updateResult.data.salary}\n`
    );

    // 4. Find all records with pagination
    console.log('4️⃣ Finding all records with pagination...');
    const findAllResult = await this.client.record.findAll(
      DEMO_CONFIG.tableName,
      {
        page: { page_no: 1, page_size: 10 },
        filters: [],
        sort: [{ field: 'name', direction: 'asc' }],
      }
    );

    if (findAllResult.error) {
      throw new Error(`Find all failed: ${findAllResult.error}`);
    }

    if (!findAllResult.data) {
      throw new Error('Find all succeeded but no data returned');
    }

    console.log(`✅ Found ${findAllResult.data.length} active records`);

    if (findAllResult.pagination) {
      console.log(
        `   Pagination: Page ${findAllResult.pagination.current_page} of ${findAllResult.pagination.total_pages}`
      );
      console.log(`   Total records: ${findAllResult.pagination.total_count}`);
    }
    console.log('');
  }

  /**
   * Cleanup created records
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleanup: Removing demo records...');

    if (this.createdRecordIds.length === 0) {
      console.log('   No demo records to clean up');
      return;
    }

    try {
      const cleanupResult = await this.client.record.deleteByIds(
        DEMO_CONFIG.tableName,
        {
          record_ids: this.createdRecordIds,
        }
      );

      if (cleanupResult.error) {
        console.log(`   Warning: Cleanup failed: ${cleanupResult.error}`);
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

  /**
   * Validate connection and API key
   */
  private async validateConnection(): Promise<void> {
    console.log('🔐 Validating connection and API key...');

    const isValid = await this.client.validateApiKey();
    if (!isValid) {
      throw new Error('Invalid API key or connection failed');
    }

    console.log('✅ API key validated successfully');
    console.log(`   Environment: ${this.client.getConfig().environment}`);
    console.log(`   Region: ${this.client.getConfig().region}`);
    console.log('');
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const demo = new RecordsSDKDemo();
    await demo.runDemo();
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { RecordsSDKDemo };
