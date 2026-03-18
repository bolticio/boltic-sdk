/**
 * Schema Operations Demo Script
 *
 * This script demonstrates the schema viewing functionality of the Boltic Database SDK:
 * - Get database schema (all tables with their column definitions)
 * - Get schema for a specific table by name
 * - Pagination and filtering options
 *
 * Prerequisites:
 * - Set BOLTIC_API_KEY environment variable
 * - Ensure you have proper API access
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { BolticClient, isErrorResponse } from '../../src';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.BOLTIC_API_KEY) {
  dotenv.config();
}

const DEMO_CONFIG = {
  debug: true,
  timeout: 30000,
  region: 'asia-south1' as const,
  environment: (process.env.BOLTIC_ENVIRONMENT || 'prod') as 'prod' | 'sit',
};

class SchemaDemo {
  private client: BolticClient;

  constructor() {
    const apiKey = process.env.BOLTIC_API_KEY;
    if (!apiKey) {
      throw new Error('BOLTIC_API_KEY environment variable is required');
    }

    this.client = new BolticClient(apiKey, DEMO_CONFIG);
  }

  async runDemo(): Promise<void> {
    console.log('🚀 Starting Schema Operations Demo');
    console.log('='.repeat(80));

    try {
      await this.validateConnection();

      await this.selectDatabase();

      await this.demoGetDatabaseSchema();

      await this.demoGetTableSchema();

      await this.demoGetDatabaseSchemaWithPagination();

      console.log('\n🎉 Schema demo completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed with error:', error);
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
   * 2. Select a database (required for schema operations)
   */
  private async selectDatabase(): Promise<void> {
    console.log('\n2️⃣  Selecting Database');
    console.log('-'.repeat(40));

    const result = await this.client.databases.getDefault();

    if (isErrorResponse(result)) {
      throw new Error(
        `Could not find default database: ${result.error.message}`
      );
    }

    const db = result.data as any;
    console.log(`   Found default database: ${db.db_name || db.db_internal_name}`);
    console.log(`   ID: ${db.id}`);

    await this.client.useDatabase(db.db_internal_name);
    console.log('✅ Database selected — schema operations will use this database');
    console.log('✅ Step 2 completed');
  }

  /**
   * 3. Get database schema — all tables with their columns
   */
  private async demoGetDatabaseSchema(): Promise<void> {
    console.log('\n3️⃣  Get Database Schema (All Tables)');
    console.log('-'.repeat(40));

    try {
      const result = await this.client.tables.getDatabaseSchema();

      console.log(`✅ Retrieved schema for ${result.data.length} table(s)`);

      if (result.pagination) {
        console.log(`   Total count: ${result.pagination.total_count}`);
        console.log(`   Current page: ${result.pagination.current_page}`);
        console.log(`   Total pages: ${result.pagination.total_pages}`);
      }

      for (const table of result.data.slice(0, 5)) {
        console.log(`\n   📋 Table: ${table.name}`);
        console.log(`      ID: ${table.id}`);
        console.log(`      Created: ${table.created_at}`);

        if (table.fields && table.fields.length > 0) {
          console.log(`      Columns (${table.fields.length}):`);
          for (const field of table.fields) {
            const constraints = [
              field.is_primary_key ? 'PK' : null,
              field.is_unique ? 'UNIQUE' : null,
              field.is_indexed ? 'INDEXED' : null,
              field.is_nullable === false ? 'NOT NULL' : null,
            ]
              .filter(Boolean)
              .join(', ');

            console.log(
              `         - ${field.name} (${field.type})${constraints ? ` [${constraints}]` : ''}`
            );
          }
        } else {
          console.log('      Columns: (none returned)');
        }
      }

      if (result.data.length > 5) {
        console.log(`\n   ... and ${result.data.length - 5} more table(s)`);
      }
    } catch (error) {
      console.error('❌ Failed to get database schema:', error);
      throw error;
    }

    console.log('\n✅ Step 3 completed');
  }

  /**
   * 4. Get schema for a specific table by name
   */
  private async demoGetTableSchema(): Promise<void> {
    console.log('\n4️⃣  Get Table Schema (Specific Table)');
    console.log('-'.repeat(40));

    const tableName = process.env.BOLTIC_TABLE_NAME || 'demo_users';
    console.log(`   Looking up schema for table: "${tableName}"`);

    try {
      const result = await this.client.tables.getTableSchema(tableName);

      if (!result.data) {
        console.log(`⚠️  Table "${tableName}" not found in the database`);
        console.log('   Tip: Set BOLTIC_TABLE_NAME env var to an existing table name');
        return;
      }

      const table = result.data;
      console.log(`\n✅ Found schema for table: ${table.name}`);
      console.log(`   ID: ${table.id}`);
      console.log(`   Internal name: ${table.internal_table_name}`);
      console.log(`   Database ID: ${table.db_id || 'default'}`);
      console.log(`   Created by: ${table.created_by}`);
      console.log(`   Created at: ${table.created_at}`);
      console.log(`   Updated at: ${table.updated_at}`);

      if (table.fields && table.fields.length > 0) {
        console.log(`\n   📊 Column Definitions (${table.fields.length}):`);
        console.log(
          '   ' + '-'.repeat(70)
        );
        console.log(
          `   ${'Name'.padEnd(25)} ${'Type'.padEnd(15)} ${'Constraints'.padEnd(30)}`
        );
        console.log(
          '   ' + '-'.repeat(70)
        );

        for (const field of table.fields) {
          const constraints = [
            field.is_primary_key ? 'PK' : null,
            field.is_unique ? 'UNIQUE' : null,
            field.is_indexed ? 'INDEXED' : null,
            field.is_nullable === false ? 'NOT NULL' : null,
            field.is_readonly ? 'READONLY' : null,
          ]
            .filter(Boolean)
            .join(', ');

          console.log(
            `   ${(field.name || '').padEnd(25)} ${(field.type || '').padEnd(15)} ${constraints}`
          );
        }
      } else {
        console.log('   Columns: (none returned in schema)');
      }
    } catch (error) {
      console.error(`❌ Failed to get schema for table "${tableName}":`, error);
      throw error;
    }

    console.log('\n✅ Step 4 completed');
  }

  /**
   * 5. Get database schema with pagination options
   */
  private async demoGetDatabaseSchemaWithPagination(): Promise<void> {
    console.log('\n5️⃣  Get Database Schema with Pagination');
    console.log('-'.repeat(40));

    try {
      const result = await this.client.tables.getDatabaseSchema({
        page: 1,
        pageSize: 3,
      });

      console.log(`✅ Retrieved first page (pageSize=3): ${result.data.length} table(s)`);

      if (result.pagination) {
        console.log(`   Total tables: ${result.pagination.total_count}`);
        console.log(`   Page: ${result.pagination.current_page} of ${result.pagination.total_pages}`);
      }

      for (const table of result.data) {
        const fieldCount = table.fields?.length ?? 0;
        console.log(`   📋 ${table.name} — ${fieldCount} column(s)`);
      }
    } catch (error) {
      console.error('❌ Failed to get paginated schema:', error);
      throw error;
    }

    console.log('\n✅ Step 5 completed');
  }
}

async function main() {
  const demo = new SchemaDemo();
  await demo.runDemo();
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
