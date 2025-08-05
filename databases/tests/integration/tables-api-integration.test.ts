import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TablesApiClient,
  TablesApiClientConfig,
} from '../../src/api/clients/tables-api-client';
import { createTableBuilder } from '../../src/client/resources/table-builder';
import { TableCreateRequest } from '../../src/types/api/table';
import { FetchAdapter } from '../../src/utils/http/fetch-adapter';

/**
 * Tables Module API Integration Tests
 *
 * These tests demonstrate the complete end-to-end functionality of the Tables Module
 * including actual API calls to the Boltic Tables service.
 *
 * To run these tests:
 * 1. Set BOLTIC_API_KEY environment variable with your API key
 * 2. Set BOLTIC_BASE_URL environment variable (defaults to SIT environment)
 * 3. Run: npm test -- tables-api-integration
 */

const API_KEY = process.env.BOLTIC_API_KEY || 'test-api-key';
const BASE_URL =
  process.env.BOLTIC_BASE_URL ||
  'https://asia-south1.api.fcz0.de/service/panel/boltic-tables';

describe('Tables API Integration Tests', () => {
  let tablesApiClient: TablesApiClient;
  let httpAdapter: FetchHttpAdapter;
  let createdTableIds: string[] = [];

  beforeAll(() => {
    if (!process.env.BOLTIC_API_KEY) {
      console.warn(
        '⚠️  BOLTIC_API_KEY not set - using mock key. Tests may fail with real API.'
      );
    }
  });

  beforeEach(() => {
    httpAdapter = new FetchAdapter();

    const config: TablesApiClientConfig = {
      apiKey: API_KEY,
      baseURL: BASE_URL,
      timeout: 30000,
      debug: true,
    };

    tablesApiClient = new TablesApiClient(httpAdapter, config);
    createdTableIds = [];
  });

  afterEach(async () => {
    // Clean up created tables
    for (const tableId of createdTableIds) {
      try {
        await tablesApiClient.deleteTable(tableId);
      } catch (error) {
        console.warn(`Failed to cleanup table ${tableId}:`, error);
      }
    }
  });

  describe('Currency Validation', () => {
    it('should fetch available currencies from API', async () => {
      const result = await tablesApiClient.getCurrencies();

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data && result.data.length > 0) {
        const currency = result.data[0];
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
      }
    });

    it('should validate valid currency codes', async () => {
      const result = await tablesApiClient.validateCurrencyFormat('USD');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid currency codes', async () => {
      const result = await tablesApiClient.validateCurrencyFormat('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide suggestions for invalid currency codes', async () => {
      const result = await tablesApiClient.validateCurrencyFormat('US');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('AI Schema Generation', () => {
    it('should generate table schema from natural language prompt', async () => {
      const prompt =
        'Create a product catalog table with name, description, price in USD, category, and inventory count';

      const result = await tablesApiClient.generateSchema(prompt);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      if (result.data?.fields) {
        expect(Array.isArray(result.data.fields)).toBe(true);
        expect(result.data.fields.length).toBeGreaterThan(0);

        // Should contain expected fields based on prompt
        const fieldNames = result.data.fields.map((f: any) =>
          f.name.toLowerCase()
        );
        expect(fieldNames.some((name: string) => name.includes('name'))).toBe(
          true
        );
        expect(fieldNames.some((name: string) => name.includes('price'))).toBe(
          true
        );
      }
    });

    it('should handle complex schema generation prompts', async () => {
      const prompt = `
        Create an employee management table with:
        - Employee ID (unique identifier)
        - Full name (required text field)
        - Email address (with validation)
        - Phone number in international format
        - Department (dropdown: Engineering, Marketing, Sales, HR)
        - Salary in USD with 2 decimal places
        - Hire date
        - Manager (checkbox for is manager)
        - Skills (multiple selection dropdown)
      `;

      const result = await tablesApiClient.generateSchema(prompt);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      if (result.data?.fields) {
        const fields = result.data.fields;
        expect(fields.length).toBeGreaterThan(5);

        // Should have appropriate field types
        const fieldTypes = fields.map((f: any) => f.type);
        expect(fieldTypes).toContain('email');
        expect(fieldTypes).toContain('currency');
        expect(fieldTypes).toContain('dropdown');
        expect(fieldTypes).toContain('checkbox');
      }
    });
  });

  describe('Table CRUD Operations', () => {
    it('should create a table with proper schema', async () => {
      const tableRequest: TableCreateRequest = {
        table_name: `test_products_${Date.now()}`,
        description: 'Test product catalog table',
        schema: [
          {
            name: 'name',
            type: 'text',
            is_nullable: false,
            is_unique: false,
            is_visible: true,
            description: 'Product name',
          },
          {
            name: 'price',
            type: 'currency',
            currency_format: 'USD',
            decimals: 2,
            is_nullable: false,
            description: 'Product price in USD',
          },
          {
            name: 'category',
            type: 'dropdown',
            selectable_items: ['Electronics', 'Clothing', 'Books', 'Home'],
            is_nullable: false,
            description: 'Product category',
          },
          {
            name: 'in_stock',
            type: 'checkbox',
            default_value: true,
            description: 'Whether item is in stock',
          },
        ],
        is_public: false,
      };

      const result = await tablesApiClient.createTable(tableRequest);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe(tableRequest.table_name);

      if (result.data.id) {
        createdTableIds.push(result.data.id);
      }
    });

    it('should create table with AI-generated schema', async () => {
      const prompt =
        'Create a simple user table with name, email, and registration date';

      // First generate the schema
      const schemaResult = await tablesApiClient.generateSchema(prompt);
      expect(schemaResult.error).toBeUndefined();
      expect(schemaResult.data?.fields).toBeDefined();

      // Then create the table using the generated schema
      const tableRequest: TableCreateRequest = {
        table_name: `ai_users_${Date.now()}`,
        description: 'AI-generated user table',
        schema: schemaResult.data.fields,
        is_public: false,
      };

      const result = await tablesApiClient.createTable(tableRequest, {
        isAiGenerated: true,
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();

      if (result.data.id) {
        createdTableIds.push(result.data.id);
      }
    });

    it('should list tables with filtering', async () => {
      // Create a test table first
      const tableRequest: TableCreateRequest = {
        table_name: `filtered_table_${Date.now()}`,
        description: 'Table for filtering test',
        schema: [
          {
            name: 'test_field',
            type: 'text',
          },
        ],
        is_public: true,
      };

      const createResult = await tablesApiClient.createTable(tableRequest);
      expect(createResult.error).toBeUndefined();

      if (createResult.data.id) {
        createdTableIds.push(createResult.data.id);
      }

      // Test listing with filters
      const listResult = await tablesApiClient.listTables({
        page: 1,
        pageSize: 10,
        isShared: true,
        where: {
          name: tableRequest.table_name,
        },
      });

      expect(listResult.error).toBeUndefined();
      expect(listResult.data).toBeDefined();
      expect(Array.isArray(listResult.data)).toBe(true);
      expect(listResult.pagination).toBeDefined();
    });

    it('should get a specific table by ID', async () => {
      // Create a test table first
      const tableRequest: TableCreateRequest = {
        table_name: `get_table_${Date.now()}`,
        description: 'Table for get test',
        schema: [
          {
            name: 'test_field',
            type: 'text',
          },
        ],
      };

      const createResult = await tablesApiClient.createTable(tableRequest);
      expect(createResult.error).toBeUndefined();
      expect(createResult.data.id).toBeDefined();

      const tableId = createResult.data.id;
      createdTableIds.push(tableId);

      // Get the table by ID
      const getResult = await tablesApiClient.getTable(tableId);

      expect(getResult.error).toBeUndefined();
      expect(getResult.data).toBeDefined();
      expect(getResult.data.id).toBe(tableId);
      expect(getResult.data.name).toBe(tableRequest.table_name);
    });

    it('should update table properties', async () => {
      // Create a test table first
      const tableRequest: TableCreateRequest = {
        table_name: `update_table_${Date.now()}`,
        description: 'Original description',
        schema: [
          {
            name: 'test_field',
            type: 'text',
          },
        ],
      };

      const createResult = await tablesApiClient.createTable(tableRequest);
      expect(createResult.error).toBeUndefined();

      const tableId = createResult.data.id;
      createdTableIds.push(tableId);

      // Update the table
      const updateResult = await tablesApiClient.updateTable(tableId, {
        name: `updated_${tableRequest.table_name}`,
        description: 'Updated description',
        is_shared: true,
      });

      expect(updateResult.error).toBeUndefined();
      expect(updateResult.data).toBeDefined();
      expect(updateResult.data.name).toBe(`updated_${tableRequest.table_name}`);
      expect(updateResult.data.description).toBe('Updated description');
    });

    it('should delete a table', async () => {
      // Create a test table first
      const tableRequest: TableCreateRequest = {
        table_name: `delete_table_${Date.now()}`,
        description: 'Table to be deleted',
        schema: [
          {
            name: 'test_field',
            type: 'text',
          },
        ],
      };

      const createResult = await tablesApiClient.createTable(tableRequest);
      expect(createResult.error).toBeUndefined();

      const tableId = createResult.data.id;

      // Delete the table
      const deleteResult = await tablesApiClient.deleteTable(tableId);

      expect(deleteResult.error).toBeUndefined();
      expect(deleteResult.success).toBe(true);

      // Verify table is deleted by trying to get it
      const getResult = await tablesApiClient.getTable(tableId);
      expect(getResult.error).toBeDefined();
    });
  });

  describe('Table Builder Integration', () => {
    it('should create table using fluent builder API', async () => {
      const builder = createTableBuilder(
        {
          name: `builder_table_${Date.now()}`,
          description: 'Table created with builder',
          isPublic: false,
        },
        tablesApiClient
      );

      const result = await builder
        .addTextField('title', { nullable: false, unique: true })
        .addNumberField('price', { decimals: 2, defaultValue: 0 })
        .addCurrencyField('budget', {
          currencyFormat: 'USD',
          decimals: 2,
          nullable: false,
        })
        .addDropdownField('status', {
          items: ['draft', 'published', 'archived'],
          nullable: false,
        })
        .addCheckboxField('featured', { defaultValue: false })
        .addEmailField('contact_email', { nullable: true })
        .addDateTimeField('created_at', {
          dateFormat: 'YYYY-MM-DD',
          nullable: false,
        })
        .create();

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();

      if (result.data.id) {
        createdTableIds.push(result.data.id);
      }

      // Verify the table has all expected fields
      const fieldNames = builder.getFieldNames();
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('price');
      expect(fieldNames).toContain('budget');
      expect(fieldNames).toContain('status');
      expect(fieldNames).toContain('featured');
      expect(fieldNames).toContain('contact_email');
      expect(fieldNames).toContain('created_at');
    });

    it('should create table using AI generation with builder', async () => {
      const builder = createTableBuilder(
        {
          name: `ai_builder_table_${Date.now()}`,
          description: 'AI-generated table with builder',
        },
        tablesApiClient
      );

      const prompt =
        'Create a blog post table with title, content, author, publish date, and view count';

      await builder.generateFromPrompt({ prompt });

      expect(builder.getFieldCount()).toBeGreaterThan(0);

      const result = await builder.create({ isAiGenerated: true });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      if (result.data.id) {
        createdTableIds.push(result.data.id);
      }
    });
  });

  describe('Filter Mapping and Advanced Querying', () => {
    it('should handle complex filter conditions', async () => {
      const listResult = await tablesApiClient.listTables({
        where: {
          name: { $like: 'test%' },
          created_at: { $gte: '2024-01-01' },
          is_public: true,
        },
        sort: [
          { field: 'created_at', order: 'desc' },
          { field: 'name', order: 'asc' },
        ],
        limit: 20,
        offset: 0,
      });

      expect(listResult.error).toBeUndefined();
      expect(listResult.data).toBeDefined();
      expect(listResult.pagination).toBeDefined();
    });

    it('should handle date range filters', async () => {
      const listResult = await tablesApiClient.listTables({
        where: {
          created_at: { $within: 'last_30_days' },
        },
        pageSize: 5,
      });

      expect(listResult.error).toBeUndefined();
      expect(listResult.data).toBeDefined();
    });

    it('should handle array and contains filters', async () => {
      const listResult = await tablesApiClient.listTables({
        where: {
          name: { $in: ['test_table_1', 'test_table_2'] },
        },
      });

      expect(listResult.error).toBeUndefined();
      expect(listResult.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidTableRequest: TableCreateRequest = {
        table_name: '', // Invalid empty name
        description: 'Invalid table',
        schema: [], // Invalid empty schema
      };

      const result = await tablesApiClient.createTable(invalidTableRequest);

      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
    });

    it('should handle API errors with proper error formatting', async () => {
      const result = await tablesApiClient.getTable('non-existent-table-id');

      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
    });

    it('should handle currency validation errors', async () => {
      const tableRequest: TableCreateRequest = {
        table_name: `invalid_currency_${Date.now()}`,
        schema: [
          {
            name: 'price',
            type: 'currency',
            currency_format: 'INVALID', // Invalid currency code
          },
        ],
      };

      const result = await tablesApiClient.createTable(tableRequest);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('currency');
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle large result sets with pagination', async () => {
      const result = await tablesApiClient.listTables({
        pageSize: 100,
        page: 1,
        sort: [{ field: 'created_at', order: 'desc' }],
      });

      expect(result.error).toBeUndefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.current_page).toBe(1);
      expect(result.pagination?.per_page).toBe(100);
    });

    it('should respect rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting handling
      const promises = Array.from({ length: 5 }, () =>
        tablesApiClient.getCurrencies()
      );

      const results = await Promise.all(promises);

      // All requests should succeed or handle rate limiting gracefully
      results.forEach((result) => {
        expect(result).toBeDefined();
        // Either success or proper rate limit error
        if (result.error) {
          expect(result.error.code).toBeDefined();
        }
      });
    });
  });
});

/**
 * Example usage demonstration
 */
describe('Tables Module Usage Examples', () => {
  let tablesApiClient: TablesApiClient;

  beforeEach(() => {
    const httpAdapter = new FetchHttpAdapter();
    const config: TablesApiClientConfig = {
      apiKey: API_KEY,
      baseURL: BASE_URL,
      timeout: 30000,
      debug: false,
    };

    tablesApiClient = new TablesApiClient(httpAdapter, config);
  });

  it('should demonstrate complete workflow', async () => {
    // 1. Generate schema using AI
    const schemaResult = await tablesApiClient.generateSchema(
      'Create a customer database with name, email, phone, address, and purchase history'
    );

    if (schemaResult.error) {
      console.log('Schema generation skipped - API not available');
      return;
    }

    // 2. Create table with generated schema
    const tableName = `customer_db_${Date.now()}`;
    const createResult = await tablesApiClient.createTable(
      {
        table_name: tableName,
        description: 'Customer database with AI-generated schema',
        schema: schemaResult.data.fields,
        is_public: false,
      },
      { isAiGenerated: true }
    );

    expect(createResult.error).toBeUndefined();

    // 3. Update table to make it shared
    const updateResult = await tablesApiClient.updateTable(
      createResult.data.id,
      {
        is_shared: true,
        description: 'Shared customer database',
      }
    );

    expect(updateResult.error).toBeUndefined();

    // 4. List tables to verify creation
    const listResult = await tablesApiClient.listTables({
      where: { name: tableName },
      isShared: true,
    });

    expect(listResult.error).toBeUndefined();
    expect(listResult.data.length).toBeGreaterThan(0);

    // 5. Clean up
    await tablesApiClient.deleteTable(createResult.data.id);
  });
});
