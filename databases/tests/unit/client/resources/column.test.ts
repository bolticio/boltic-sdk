import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseClient } from '../../../../src/client/core/base-client';
import { ColumnResource } from '../../../../src/client/resources/column';
import { ValidationError } from '../../../../src/errors';
import { FieldDefinition } from '../../../../src/types/api/table';

vi.mock('../../../../src/client/core/base-client');

describe('ColumnResource', () => {
  let columnResource: ColumnResource;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      makeRequest: vi.fn(),
      table: {
        findOne: vi.fn().mockResolvedValue({
          data: { id: 'table-123', name: 'products' },
        }),
      },
    };

    columnResource = new ColumnResource(mockClient as BaseClient);
  });

  describe('create', () => {
    it('should create columns successfully', async () => {
      const columns: FieldDefinition[] = [
        {
          name: 'description',
          type: 'long-text',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 3,
        },
        {
          name: 'tags',
          type: 'json',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_visible: true,
          is_readonly: false,
          is_indexed: false,
          field_order: 4,
        },
      ];

      const createData = { columns };

      const expectedResponse = {
        data: [
          {
            id: 'col-1',
            name: 'description',
            type: 'long-text',
            table_id: 'table-123',
            table_name: 'products',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'col-2',
            name: 'tags',
            type: 'json',
            table_id: 'table-123',
            table_name: 'products',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      const result = await columnResource.create('products', createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        'POST',
        '/table-123/fields',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'description',
              type: 'long-text',
              is_visible: true,
              is_readonly: false,
            }),
            expect.objectContaining({
              name: 'tags',
              type: 'json',
              is_visible: true,
              is_readonly: false,
            }),
          ]),
        })
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should validate column definitions', async () => {
      const createData = {
        columns: [
          {
            name: '', // Empty name
            type: 'text' as const,
          },
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate vector field dimensions', async () => {
      const createData = {
        columns: [
          {
            name: 'embedding',
            type: 'vector' as const,
            // Missing vector_dimension
          },
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should detect duplicate column names', async () => {
      const createData = {
        columns: [
          { name: 'field1', type: 'text' as const },
          { name: 'field1', type: 'number' as const }, // Duplicate
        ],
      };

      await expect(
        columnResource.create('products', createData)
      ).rejects.toThrow(ValidationError);
    });

    it('should apply default values', async () => {
      const createData = {
        columns: [
          {
            name: 'price',
            type: 'currency' as const,
            // No explicit values for is_nullable, is_unique, etc.
          },
        ],
      };

      const expectedResponse = {
        data: [
          {
            id: 'col-1',
            name: 'price',
            type: 'currency',
            table_id: 'table-123',
            table_name: 'products',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.makeRequest.mockResolvedValue(expectedResponse);

      await columnResource.create('products', createData);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        'POST',
        '/table-123/fields',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'price',
              type: 'currency',
              is_nullable: true, // Default value
              is_unique: false, // Default value
              is_indexed: false, // Default value
              is_primary_key: false, // Default value
              is_visible: true, // Always true
              is_readonly: false, // Always false
            }),
          ]),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve columns for a table', async () => {
      const mockResponse = {
        data: {
          columns: [
            { id: 'col-1', name: 'title', type: 'text', table_id: 'table-123' },
            {
              id: 'col-2',
              name: 'price',
              type: 'currency',
              table_id: 'table-123',
            },
          ],
          pagination: { total: 2, page: 1, limit: 10, pages: 1 },
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findAll('products', {
        where: { is_visible: true },
        sort: [{ field: 'field_order', order: 'asc' }],
      });

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        'POST',
        '/table-123/fields/list',
        expect.objectContaining({
          'where[is_visible]': true,
          'where[table_id]': 'table-123',
          sort: 'field_order:asc',
        })
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
    });

    it('should handle error responses', async () => {
      const mockResponse = {
        error: 'Table not found',
        details: 'The specified table does not exist',
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findAll('nonexistent');

      expect(result.error).toBe('Table not found');
      expect(result.details).toBe('The specified table does not exist');
    });
  });

  describe('findOne', () => {
    it('should find a single column', async () => {
      const mockResponse = {
        data: {
          columns: [
            {
              id: 'col-1',
              name: 'price',
              type: 'currency',
              table_id: 'table-123',
            },
          ],
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findOne('products', {
        where: { name: 'price' },
      });

      expect(result.data).toEqual({
        id: 'col-1',
        name: 'price',
        type: 'currency',
        table_id: 'table-123',
      });
    });

    it('should return null when column not found', async () => {
      const mockResponse = {
        data: {
          columns: [],
        },
      };

      mockClient.makeRequest.mockResolvedValue(mockResponse);

      const result = await columnResource.findOne('products', {
        where: { name: 'nonexistent' },
      });

      expect(result.data).toBeNull();
    });

    it('should require where clause', async () => {
      await expect(columnResource.findOne('products', {})).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('update', () => {
    it('should update a column by name', async () => {
      const updateData = {
        description: 'Updated description',
        is_indexed: true,
      };
      const expectedResponse = {
        data: {
          id: 'col-1',
          name: 'title',
          description: 'Updated description',
          is_indexed: true,
        },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            columns: [{ id: 'col-1', name: 'title', table_id: 'table-123' }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.update('products', {
        set: updateData,
        where: { name: 'title' },
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should transform date and time formats', async () => {
      const updateData = {
        date_format: 'MMDDYYYY',
        time_format: 'HH_mm_ss',
      };

      const expectedResponse = {
        data: {
          id: 'col-1',
          name: 'created_at',
          date_format: '%m/%d/%Y',
          time_format: '%H:%M:%S',
        },
      };

      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            columns: [
              { id: 'col-1', name: 'created_at', table_id: 'table-123' },
            ],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      await columnResource.update('products', {
        set: updateData,
        where: { name: 'created_at' },
      });

      expect(mockClient.makeRequest).toHaveBeenLastCalledWith(
        'PUT',
        '/table-123/fields/col-1',
        expect.objectContaining({
          date_format: '%m/%d/%Y',
          time_format: '%H:%M:%S',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a column by name', async () => {
      const expectedResponse = {
        data: { success: true, message: 'Column deleted successfully' },
      };

      // Mock findOne to return column data
      mockClient.makeRequest
        .mockResolvedValueOnce({
          data: {
            columns: [{ id: 'col-1', name: 'title', table_id: 'table-123' }],
          },
        })
        .mockResolvedValueOnce(expectedResponse);

      const result = await columnResource.delete('products', {
        where: { name: 'title' },
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should throw error when column not found', async () => {
      mockClient.makeRequest.mockResolvedValueOnce({
        data: {
          columns: [],
        },
      });

      await expect(
        columnResource.delete('products', {
          where: { name: 'nonexistent' },
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
