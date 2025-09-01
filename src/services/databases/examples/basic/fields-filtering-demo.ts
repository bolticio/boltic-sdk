import { BolticClient } from '../../src/client';

/**
 * Example demonstrating the usage of fields option to filter response keys
 * This example shows how to use the fields parameter in various API calls
 * to only return specific fields in the response.
 */
export class FieldsFilteringDemo {
  private client: BolticClient;

  constructor(apiKey: string) {
    this.client = new BolticClient(apiKey);
  }

  /**
   * Demo: List tables with only specific fields
   */
  async demoListTablesWithFields(): Promise<void> {
    console.log(
      '🔍 Listing tables with only id, name, and description fields...'
    );

    try {
      const result = await this.client.tables.findAll({
        fields: ['id', 'name', 'description'],
      });

      if (result.error) {
        console.error('❌ Failed to list tables:', result.error);
        return;
      }

      console.log('✅ Tables with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id, name, and description fields are present
      // Other fields like account_id, internal_table_name, etc. are filtered out
    } catch (error) {
      console.error('❌ Error in demoListTablesWithFields:', error);
    }
  }

  /**
   * Demo: Get a specific table with only certain fields
   */
  async demoGetTableWithFields(tableId: string): Promise<void> {
    console.log(
      `🔍 Getting table ${tableId} with only id, name, and created_at fields...`
    );

    try {
      const result = await this.client.tables.findById(tableId);

      if (result.error) {
        console.error('❌ Failed to get table:', result.error);
        return;
      }

      console.log('✅ Table with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id, name, and created_at fields are present
    } catch (error) {
      console.error('❌ Error in demoGetTableWithFields:', error);
    }
  }

  /**
   * Demo: List columns with only specific fields
   */
  async demoListColumnsWithFields(tableId: string): Promise<void> {
    console.log(
      `🔍 Listing columns for table ${tableId} with only id, name, and type fields...`
    );

    try {
      const result = await this.client.columns.findAll(tableId, {
        fields: ['id', 'name', 'type'],
      });

      if (result.error) {
        console.error('❌ Failed to list columns:', result.error);
        return;
      }

      console.log('✅ Columns with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id, name, and type fields are present
      // Other fields like description, is_nullable, etc. are filtered out
    } catch (error) {
      console.error('❌ Error in demoListColumnsWithFields:', error);
    }
  }

  /**
   * Demo: Get a specific column with only certain fields
   */
  async demoGetColumnWithFields(
    tableId: string,
    columnId: string
  ): Promise<void> {
    console.log(
      `🔍 Getting column ${columnId} from table ${tableId} with only id, name, and type fields...`
    );

    try {
      const result = await this.client.columns.findById(tableId, columnId);

      if (result.error) {
        console.error('❌ Failed to get column:', result.error);
        return;
      }

      console.log('✅ Column with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id, name, and type fields are present
    } catch (error) {
      console.error('❌ Error in demoGetColumnWithFields:', error);
    }
  }

  /**
   * Demo: List records with only specific fields
   */
  async demoListRecordsWithFields(tableId: string): Promise<void> {
    console.log(
      `🔍 Listing records from table ${tableId} with only id and name fields...`
    );

    try {
      const result = await this.client.records.findAll(tableId, {
        fields: ['id', 'name'],
      });

      if (result.error) {
        console.error('❌ Failed to list records:', result.error);
        return;
      }

      console.log('✅ Records with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id and name fields are present
      // Other fields in the records are filtered out
    } catch (error) {
      console.error('❌ Error in demoListRecordsWithFields:', error);
    }
  }

  /**
   * Demo: Get a specific record with only certain fields
   */
  async demoGetRecordWithFields(
    tableId: string,
    recordId: string
  ): Promise<void> {
    console.log(
      `🔍 Getting record ${recordId} from table ${tableId} with only id and name fields...`
    );

    try {
      const result = await this.client.records.findOne(tableId, recordId);

      if (result.error) {
        console.error('❌ Failed to get record:', result.error);
        return;
      }

      console.log('✅ Record with filtered fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id and name fields are present
    } catch (error) {
      console.error('❌ Error in demoGetRecordWithFields:', error);
    }
  }

  /**
   * Demo: Insert a record and specify which fields to return
   */
  async demoInsertRecordWithFields(tableId: string): Promise<void> {
    console.log(
      `🔍 Inserting a record into table ${tableId} and requesting only id and name fields in response...`
    );

    try {
      const recordData = {
        name: 'Test Record',
        email: 'test@example.com',
        age: 25,
        fields: ['id', 'name'], // This will filter the response to only include id and name
      };

      const result = await this.client.records.insert(tableId, recordData);

      if (result.error) {
        console.error('❌ Failed to insert record:', result.error);
        return;
      }

      console.log('✅ Record inserted with filtered response fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id and name fields are present in the response
      // Even though we sent email and age, they won't appear in the response
    } catch (error) {
      console.error('❌ Error in demoInsertRecordWithFields:', error);
    }
  }

  /**
   * Demo: Update a record and specify which fields to return
   */
  async demoUpdateRecordWithFields(
    tableId: string,
    recordId: string
  ): Promise<void> {
    console.log(
      `🔍 Updating record ${recordId} in table ${tableId} and requesting only id and name fields in response...`
    );

    try {
      const updateData = {
        set: {
          name: 'Updated Test Record',
          email: 'updated@example.com',
        },
        filters: [{ field: 'id', operator: '$eq', values: [recordId] }],
        fields: ['id', 'name'], // This will filter the response to only include id and name
      };

      const result = await this.client.records.update(tableId, updateData);

      if (result.error) {
        console.error('❌ Failed to update record:', result.error);
        return;
      }

      console.log('✅ Record updated with filtered response fields:');
      console.log(JSON.stringify(result.data, null, 2));

      // Notice that only id and name fields are present in the response
    } catch (error) {
      console.error('❌ Error in demoUpdateRecordWithFields:', error);
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos(): Promise<void> {
    console.log('🚀 Starting Fields Filtering Demo...\n');

    // Note: These demos require existing tables, columns, and records
    // You may need to create them first or use existing ones

    console.log(
      '📋 Note: Some demos require existing resources. Make sure you have:'
    );
    console.log('   - At least one table');
    console.log('   - At least one column in a table');
    console.log('   - At least one record in a table');
    console.log('');

    // You can uncomment and modify these calls based on your existing data
    // await this.demoListTablesWithFields();
    // await this.demoGetTableWithFields('your-table-id');
    // await this.demoListColumnsWithFields('your-table-id');
    // await this.demoGetColumnWithFields('your-table-id', 'your-column-id');
    // await this.demoListRecordsWithFields('your-table-id');
    // await this.demoGetRecordWithFields('your-table-id', 'your-record-id');
    // await this.demoInsertRecordWithFields('your-table-id');
    // await this.demoUpdateRecordWithFields('your-table-id', 'your-record-id');

    console.log('✅ Fields Filtering Demo completed!');
    console.log('');
    console.log('💡 Key points about fields filtering:');
    console.log(
      '   - Use the fields option to specify which keys to include in responses'
    );
    console.log('   - If fields is empty or undefined, all keys are returned');
    console.log("   - Fields that don't exist in the response are ignored");
    console.log(
      '   - This filtering happens client-side after receiving the API response'
    );
    console.log(
      '   - Useful for reducing response size and focusing on specific data'
    );
  }
}

// Example usage:
// const demo = new FieldsFilteringDemo('your-api-key');
// demo.runAllDemos();
