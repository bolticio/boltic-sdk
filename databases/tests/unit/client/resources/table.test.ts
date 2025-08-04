import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseClient } from '../../../../src/client/core/base-client';
import { TableResource } from '../../../../src/client/resources/table';
import { ValidationError } from '../../../../src/errors/utils';
import { FieldDefinition } from '../../../../src/types/api/table';

vi.mock('../../../../src/client/core/base-client');

describe('TableResource', () => {
  let tableResource: TableResource;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      makeRequest: vi.fn(),
      getDatabaseContext: vi.fn(() => ({
        databaseId: 'db-123',
        databaseName: 'test-database',
      })),
    };

    tableResource = new TableResource(mockClient as BaseClient);
  });

  describe('create', () => {
    it('should create a table with valid schema', async () => {
      const schema: FieldDefinition[] = [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'price',
          type: 'currency',
          currency_format: 'USD',
        },
      ];

      const createData = {
        table_name: 'products',
        schema,
        description: 'Product catalog table',
      };

      const expectedResponse = {
        data: {
          id: 'table-123',
          name: 'products',
          account_id: 'acc-123',
          internal_table_name: 'products',
          internal_db_name: 'db_123',
          db_id: 'db-123',
          description: 'Product catalog table',
          is_public: false,
          is_deleted: false,
          created_by: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: 'user@example.com',
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await tableResource.create(createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith('POST', '', {
        ...createData,
        database_id: 'db-123',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should validate table name format', async () => {
      const createData = {
        table_name: '123invalid',
        schema: [{ name: 'field1', type: 'text' }] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate schema is not empty', async () => {
      const createData = {
        table_name: 'valid_table',
        schema: [],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should use default database when no context set', async () => {
      mockClient.getDatabaseContext.mockReturnValue(null);

      const createData = {
        table_name: 'valid_table',
        schema: [{ name: 'field1', type: 'text' }] as FieldDefinition[],
      };

      const expectedResponse = {
        data: {
          id: 'table-123',
          name: 'valid_table',
          account_id: 'acc-123',
          internal_table_name: 'valid_table',
          internal_db_name: 'Default',
          db_id: 'Default',
          is_public: false,
          is_deleted: false,
          created_by: 'user@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: 'user@example.com',
        },
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await tableResource.create(createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith('POST', '', {
        ...createData,
        database_id: 'Default',
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('schema validation', () => {
    it('should validate vector field dimensions', async () => {
      const createData = {
        table_name: 'vectors',
        schema: [
          {
            name: 'embedding',
            type: 'vector',
            // Missing vector_dimension
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate dropdown selectable items', async () => {
      const createData = {
        table_name: 'categories',
        schema: [
          {
            name: 'category',
            type: 'dropdown',
            // Missing selectable_items
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should detect duplicate field names', async () => {
      const createData = {
        table_name: 'duplicates',
        schema: [
          { name: 'field1', type: 'text' },
          { name: 'field1', type: 'number' }, // Duplicate
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate halfvec field dimensions', async () => {
      const createData = {
        table_name: 'halfvectors',
        schema: [
          {
            name: 'half_embedding',
            type: 'halfvec',
            vector_dimension: 70000, // Exceeds halfvec limit
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate sparsevec field dimensions', async () => {
      const createData = {
        table_name: 'sparsevectors',
        schema: [
          {
            name: 'sparse_embedding',
            type: 'sparsevec',
            // Missing vector_dimension
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate phone number format', async () => {
      const createData = {
        table_name: 'contacts',
        schema: [
          {
            name: 'phone',
            type: 'phone-number',
            phone_format: 'invalid_format',
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate checkbox default value', async () => {
      const createData = {
        table_name: 'settings',
        schema: [
          {
            name: 'is_enabled',
            type: 'checkbox',
            default_value: 'invalid', // Should be boolean
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate dropdown item limits', async () => {
      const createData = {
        table_name: 'options',
        schema: [
          {
            name: 'choice',
            type: 'dropdown',
            selectable_items: Array.from(
              { length: 150 },
              (_, i) => `option${i}`
            ), // Too many items
          },
        ] as FieldDefinition[],
      };

      await expect(tableResource.create(createData)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('findAll', () => {
    it('should find all tables with database context', async () => {
      const mockResponse = {
        data: {
          tables: [
            {
              id: 'table-1',
              name: 'products',
              account_id: 'acc-123',
              internal_table_name: 'products',
              internal_db_name: 'db_123',
              db_id: 'db-123',
              is_public: false,
              is_deleted: false,
              created_by: 'user@example.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              updated_by: 'user@example.com',
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 50,
            pages: 1,
          },
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await tableResource.findAll();

      expect(result.data).toEqual(mockResponse.data.tables);
      expect(result.pagination).toEqual(mockResponse.data.pagination);
    });
  });

  describe('update', () => {
    it('should update table by name', async () => {
      const findResponse = {
        data: {
          tables: [
            {
              id: 'table-123',
              name: 'old_products',
              account_id: 'acc-123',
              internal_table_name: 'old_products',
              internal_db_name: 'db_123',
              db_id: 'db-123',
              is_public: false,
              is_deleted: false,
              created_by: 'user@example.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              updated_by: 'user@example.com',
            },
          ],
        },
      };

      const updateResponse = {
        data: {
          ...findResponse.data.tables[0],
          name: 'new_products',
          internal_table_name: 'new_products',
        },
      };

      mockClient.makeRequest
        .mockResolvedValueOnce(findResponse) // for findOne
        .mockResolvedValueOnce(updateResponse); // for update

      const result = await tableResource.update('old_products', {
        name: 'new_products',
      });

      expect(result).toEqual(updateResponse);
    });
  });

  describe('rename', () => {
    it('should rename a table', async () => {
      const findResponse = {
        data: {
          tables: [
            {
              id: 'table-123',
              name: 'old_table',
              account_id: 'acc-123',
              internal_table_name: 'old_table',
              internal_db_name: 'db_123',
              db_id: 'db-123',
              is_public: false,
              is_deleted: false,
              created_by: 'user@example.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              updated_by: 'user@example.com',
            },
          ],
        },
      };

      const updateResponse = {
        data: {
          ...findResponse.data.tables[0],
          name: 'new_table',
        },
      };

      mockClient.makeRequest
        .mockResolvedValueOnce(findResponse) // for findOne
        .mockResolvedValueOnce(updateResponse); // for update

      const result = await tableResource.rename('old_table', 'new_table');

      expect(result).toEqual(updateResponse);
    });
  });

  describe('delete', () => {
    it('should delete table by name', async () => {
      const findResponse = {
        data: {
          tables: [
            {
              id: 'table-123',
              name: 'test_table',
              account_id: 'acc-123',
              internal_table_name: 'test_table',
              internal_db_name: 'db_123',
              db_id: 'db-123',
              is_public: false,
              is_deleted: false,
              created_by: 'user@example.com',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              updated_by: 'user@example.com',
            },
          ],
        },
      };

      const deleteResponse = {
        data: {
          success: true,
          message: 'Table deleted successfully',
        },
      };

      mockClient.makeRequest
        .mockResolvedValueOnce(findResponse) // for findOne
        .mockResolvedValueOnce(deleteResponse); // for delete

      const result = await tableResource.delete('test_table');

      expect(result).toEqual(deleteResponse);
    });
  });
});
