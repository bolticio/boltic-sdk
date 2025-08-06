import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ColumnsApiClient } from '../../src/api/clients/columns-api-client';
import {
  ColumnCreateRequest,
  ColumnUpdateRequest,
} from '../../src/types/api/column';

// Test configuration
const TEST_API_KEY = process.env.BOLTIC_API_KEY || 'test-api-key';
const TEST_ENVIRONMENT = (process.env.BOLTIC_ENVIRONMENT as any) || 'sit';
const TEST_TABLE_ID = process.env.BOLTIC_TEST_TABLE_ID || 'test-table-id';

describe('Columns API Integration Tests', () => {
  let columnsApiClient: ColumnsApiClient;
  let createdColumnId: string;

  beforeAll(() => {
    columnsApiClient = new ColumnsApiClient(TEST_API_KEY, {
      environment: TEST_ENVIRONMENT,
      debug: true,
    });
  });

  afterAll(async () => {
    // Clean up: delete test column if it was created
    if (createdColumnId) {
      try {
        await columnsApiClient.deleteColumn(TEST_TABLE_ID, createdColumnId);
      } catch (error) {
        console.warn('Failed to clean up test column:', error);
      }
    }
  });

  describe('Column Creation', () => {
    it('should create a new text column successfully', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'test_text_column',
            type: 'text',
            description: 'Test text column for integration testing',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);

      const column = result.data[0];
      expect(column.name).toBe('test_text_column');
      expect(column.type).toBe('text');
      expect(column.description).toBe(
        'Test text column for integration testing'
      );
      expect(column.is_nullable).toBe(true);
      expect(column.is_unique).toBe(false);
      expect(column.is_indexed).toBe(false);
      expect(column.is_primary_key).toBe(false);

      // Store the column ID for cleanup
      createdColumnId = column.id;
    });

    it('should create a number column with decimals', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'test_number_column',
            type: 'number',
            description: 'Test number column with decimals',
            is_nullable: false,
            is_unique: false,
            is_indexed: true,
            is_primary_key: false,
            decimals: '0.00',
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);

      const column = result.data[0];
      expect(column.name).toBe('test_number_column');
      expect(column.type).toBe('number');
      expect(column.decimals).toBe('0.00');
      expect(column.is_indexed).toBe(true);
    });

    it('should create a currency column', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'test_currency_column',
            type: 'currency',
            description: 'Test currency column',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
            currency_format: 'USD',
            decimals: '0.00',
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);

      const column = result.data[0];
      expect(column.name).toBe('test_currency_column');
      expect(column.type).toBe('currency');
      expect(column.currency_format).toBe('USD');
    });

    it('should create a date-time column with format', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'test_datetime_column',
            type: 'date-time',
            description: 'Test date-time column',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
            date_format: 'YYYY_MM_DD',
            time_format: 'HH_mm_ss',
            timezone: 'UTC',
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);

      const column = result.data[0];
      expect(column.name).toBe('test_datetime_column');
      expect(column.type).toBe('date-time');
      expect(column.date_format).toBeDefined();
      expect(column.time_format).toBeDefined();
      expect(column.timezone).toBe('UTC');
    });

    it('should create a dropdown column', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'test_dropdown_column',
            type: 'dropdown',
            description: 'Test dropdown column',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
            selection_source: 'provide-static-list',
            selectable_items: ['Option 1', 'Option 2', 'Option 3'],
            multiple_selections: false,
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);

      const column = result.data[0];
      expect(column.name).toBe('test_dropdown_column');
      expect(column.type).toBe('dropdown');
      expect(column.selection_source).toBe('provide-static-list');
      expect(column.selectable_items).toEqual([
        'Option 1',
        'Option 2',
        'Option 3',
      ]);
      expect(column.multiple_selections).toBe(false);
    });

    it('should handle creation error for invalid column', async () => {
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: '', // Invalid empty name
            type: 'text',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
          },
        ],
      };

      const result = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );

      expect(result.error).toBeDefined();
      expect(result.data).toEqual([]);
    });
  });

  describe('Column Listing', () => {
    it('should list all columns in a table', async () => {
      const result = await columnsApiClient.listColumns(TEST_TABLE_ID);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.total).toBeGreaterThanOrEqual(0);
    });

    it('should list columns with pagination', async () => {
      const result = await columnsApiClient.listColumns(TEST_TABLE_ID, {
        page: 1,
        pageSize: 5,
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(5);
    });

    it('should list columns with filtering', async () => {
      const result = await columnsApiClient.listColumns(TEST_TABLE_ID, {
        where: { type: 'text' },
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      // All returned columns should be of type 'text'
      result.data.forEach((column) => {
        expect(column.type).toBe('text');
      });
    });

    it('should list columns with sorting', async () => {
      const result = await columnsApiClient.listColumns(TEST_TABLE_ID, {
        sort: [{ field: 'name', order: 'asc' }],
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      // Verify sorting (if there are multiple columns)
      if (result.data.length > 1) {
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i].name >= result.data[i - 1].name).toBe(true);
        }
      }
    });
  });

  describe('Column Retrieval', () => {
    it('should get a specific column by ID', async () => {
      if (!createdColumnId) {
        console.warn('Skipping test: No column ID available');
        return;
      }

      const result = await columnsApiClient.getColumn(
        TEST_TABLE_ID,
        createdColumnId
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(createdColumnId);
      expect(result.data.name).toBe('test_text_column');
    });

    it('should find column by name', async () => {
      const result = await columnsApiClient.findColumnByName(
        TEST_TABLE_ID,
        'test_text_column'
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('test_text_column');
    });

    it('should return null for non-existent column', async () => {
      const result = await columnsApiClient.findColumnByName(
        TEST_TABLE_ID,
        'non_existent_column'
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeNull();
    });
  });

  describe('Column Updates', () => {
    it('should update column properties', async () => {
      if (!createdColumnId) {
        console.warn('Skipping test: No column ID available');
        return;
      }

      const updateRequest: ColumnUpdateRequest = {
        description: 'Updated description for test column',
        is_unique: true,
        is_indexed: true,
      };

      const result = await columnsApiClient.updateColumn(
        TEST_TABLE_ID,
        createdColumnId,
        updateRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.description).toBe(
        'Updated description for test column'
      );
      expect(result.data.is_unique).toBe(true);
      expect(result.data.is_indexed).toBe(true);
    });

    it('should update column by name', async () => {
      const updateRequest: ColumnUpdateRequest = {
        description: 'Updated via name lookup',
        is_visible: false,
      };

      const result = await columnsApiClient.updateColumnByName(
        TEST_TABLE_ID,
        'test_text_column',
        updateRequest
      );

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data.description).toBe('Updated via name lookup');
      expect(result.data.is_visible).toBe(false);
    });

    it('should handle update error for non-existent column', async () => {
      const updateRequest: ColumnUpdateRequest = {
        description: 'This should fail',
      };

      const result = await columnsApiClient.updateColumn(
        TEST_TABLE_ID,
        'non_existent_id',
        updateRequest
      );

      expect(result.error).toBeDefined();
      expect(result.data).toEqual({});
    });
  });

  describe('Column Deletion', () => {
    it('should delete column by ID', async () => {
      if (!createdColumnId) {
        console.warn('Skipping test: No column ID available');
        return;
      }

      const result = await columnsApiClient.deleteColumn(
        TEST_TABLE_ID,
        createdColumnId
      );

      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it('should delete column by name', async () => {
      // First create a column to delete
      const createRequest: ColumnCreateRequest = {
        columns: [
          {
            name: 'column_to_delete',
            type: 'text',
            is_nullable: true,
            is_unique: false,
            is_indexed: false,
            is_primary_key: false,
          },
        ],
      };

      const createResult = await columnsApiClient.createColumns(
        TEST_TABLE_ID,
        createRequest
      );
      expect(createResult.error).toBeUndefined();

      // Now delete it by name
      const result = await columnsApiClient.deleteColumnByName(
        TEST_TABLE_ID,
        'column_to_delete'
      );

      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it('should handle deletion error for non-existent column', async () => {
      const result = await columnsApiClient.deleteColumn(
        TEST_TABLE_ID,
        'non_existent_id'
      );

      expect(result.error).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Create a client with invalid base URL to simulate network error
      const invalidClient = new ColumnsApiClient(TEST_API_KEY, {
        environment: 'local',
        timeout: 1000,
      });

      const result = await invalidClient.listColumns(TEST_TABLE_ID);

      expect(result.error).toBeDefined();
      expect(result.data).toEqual([]);
    });

    it('should handle authentication errors', async () => {
      const invalidClient = new ColumnsApiClient('invalid-api-key', {
        environment: TEST_ENVIRONMENT,
      });

      const result = await invalidClient.listColumns(TEST_TABLE_ID);

      expect(result.error).toBeDefined();
      expect(result.data).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large column lists efficiently', async () => {
      const startTime = Date.now();

      const result = await columnsApiClient.listColumns(TEST_TABLE_ID, {
        pageSize: 100,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.error).toBeUndefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        columnsApiClient.listColumns(TEST_TABLE_ID, { pageSize: 10 })
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.error).toBeUndefined();
        expect(result.data).toBeDefined();
      });
    });
  });
});
