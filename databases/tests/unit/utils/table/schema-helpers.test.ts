import { describe, expect, it } from 'vitest';
import { SchemaHelpers } from '../../../../src/utils/table/schema-helpers';

describe('SchemaHelpers', () => {
  describe('field creation helpers', () => {
    it('should create text field with defaults', () => {
      const field = SchemaHelpers.textField('title');

      expect(field).toEqual({
        name: 'title',
        type: 'text',
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        is_visible: true,
        is_readonly: false,
        is_indexed: false,
        field_order: 1,
      });
    });

    it('should create text field with custom options', () => {
      const field = SchemaHelpers.textField('title', {
        is_nullable: false,
        is_unique: true,
        field_order: 5,
      });

      expect(field.is_nullable).toBe(false);
      expect(field.is_unique).toBe(true);
      expect(field.field_order).toBe(5);
    });

    it('should create currency field with currency format', () => {
      const field = SchemaHelpers.currencyField('price', 'EUR');

      expect(field.type).toBe('currency');
      expect(field.currency_format).toBe('EUR');
      expect(field.decimals).toBe(2);
    });

    it('should create currency field with default USD', () => {
      const field = SchemaHelpers.currencyField('price');

      expect(field.currency_format).toBe('USD');
    });

    it('should create vector field with dimension', () => {
      const field = SchemaHelpers.vectorField('embedding', 1536);

      expect(field.type).toBe('vector');
      expect(field.vector_dimension).toBe(1536);
    });

    it('should create dropdown field with items', () => {
      const items = ['option1', 'option2', 'option3'];
      const field = SchemaHelpers.dropdownField('category', items);

      expect(field.type).toBe('dropdown');
      expect(field.selectable_items).toEqual(items);
      expect(field.multiple_selections).toBe(false);
    });

    it('should create number field with decimals', () => {
      const field = SchemaHelpers.numberField('quantity');

      expect(field.type).toBe('number');
      expect(field.decimals).toBe(2);
    });

    it('should create json field', () => {
      const field = SchemaHelpers.jsonField('metadata');

      expect(field.type).toBe('json');
      expect(field.name).toBe('metadata');
    });

    it('should create date-time field with format', () => {
      const field = SchemaHelpers.dateTimeField('created_at');

      expect(field.type).toBe('date-time');
      expect(field.date_format).toBe('YYYY-MM-DD');
      expect(field.time_format).toBe('HH:mm:ss');
    });

    it('should create email field', () => {
      const field = SchemaHelpers.emailField('contact_email');

      expect(field.type).toBe('email');
      expect(field.name).toBe('contact_email');
    });

    it('should create long-text field', () => {
      const field = SchemaHelpers.longTextField('description');

      expect(field.type).toBe('long-text');
      expect(field.name).toBe('description');
    });

    it('should create link field', () => {
      const field = SchemaHelpers.linkField('website');

      expect(field.type).toBe('link');
      expect(field.name).toBe('website');
    });

    it('should create phone number field with format', () => {
      const field = SchemaHelpers.phoneNumberField('contact', 'e164');

      expect(field.type).toBe('phone-number');
      expect(field.phone_format).toBe('e164');
    });

    it('should create phone number field with default format', () => {
      const field = SchemaHelpers.phoneNumberField('contact');

      expect(field.type).toBe('phone-number');
      expect(field.phone_format).toBe('international');
    });

    it('should create checkbox field', () => {
      const field = SchemaHelpers.checkboxField('is_active');

      expect(field.type).toBe('checkbox');
      expect(field.default_value).toBe(false);
    });

    it('should create half-vector field with dimension', () => {
      const field = SchemaHelpers.halfVectorField('half_embedding', 512);

      expect(field.type).toBe('halfvec');
      expect(field.vector_dimension).toBe(512);
    });

    it('should create sparse vector field with dimension', () => {
      const field = SchemaHelpers.sparseVectorField('sparse_embedding', 1024);

      expect(field.type).toBe('sparsevec');
      expect(field.vector_dimension).toBe(1024);
    });
  });

  describe('schema validation', () => {
    it('should validate correct schema', () => {
      const schema = [
        SchemaHelpers.textField('title'),
        SchemaHelpers.numberField('price'),
        SchemaHelpers.emailField('email'),
      ];

      const result = SchemaHelpers.validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty schema', () => {
      const result = SchemaHelpers.validateSchema([]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema must be a non-empty array');
    });

    it('should detect duplicate field names', () => {
      const schema = [
        SchemaHelpers.textField('title'),
        SchemaHelpers.textField('title'), // Duplicate
      ];

      const result = SchemaHelpers.validateSchema(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate field name at index 1: title');
    });

    it('should validate field name format', () => {
      const schema = [
        {
          name: '123invalid',
          type: 'text' as const,
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid field name'))).toBe(
        true
      );
    });

    it('should validate vector field requirements', () => {
      const schema = [
        {
          name: 'embedding',
          type: 'vector' as const,
          // Missing vector_dimension
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('vector_dimension'))).toBe(
        true
      );
    });

    it('should validate dropdown field requirements', () => {
      const schema = [
        {
          name: 'category',
          type: 'dropdown' as const,
          // Missing selectable_items
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('selectable_items'))).toBe(
        true
      );
    });

    it('should validate halfvec field requirements', () => {
      const schema = [
        {
          name: 'half_embedding',
          type: 'halfvec' as const,
          // Missing vector_dimension
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('vector_dimension'))).toBe(
        true
      );
    });

    it('should validate sparsevec field requirements', () => {
      const schema = [
        {
          name: 'sparse_embedding',
          type: 'sparsevec' as const,
          // Missing vector_dimension
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('vector_dimension'))).toBe(
        true
      );
    });

    it('should validate phone number field format', () => {
      const schema = [
        {
          name: 'phone',
          type: 'phone-number' as const,
          phone_format: 'invalid_format',
        },
      ];

      const result = SchemaHelpers.validateSchema(schema as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid format'))).toBe(
        true
      );
    });

    it('should validate schema with all field types', () => {
      const schema = [
        SchemaHelpers.textField('title'),
        SchemaHelpers.longTextField('description'),
        SchemaHelpers.numberField('price'),
        SchemaHelpers.currencyField('cost', 'EUR'),
        SchemaHelpers.checkboxField('is_active'),
        SchemaHelpers.dropdownField('category', ['a', 'b']),
        SchemaHelpers.emailField('email'),
        SchemaHelpers.phoneNumberField('phone', 'e164'),
        SchemaHelpers.linkField('website'),
        SchemaHelpers.jsonField('metadata'),
        SchemaHelpers.dateTimeField('created_at'),
        SchemaHelpers.vectorField('embedding', 1536),
        SchemaHelpers.halfVectorField('half_embedding', 512),
        SchemaHelpers.sparseVectorField('sparse_embedding', 1024),
      ];

      const result = SchemaHelpers.validateSchema(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createBasicSchema', () => {
    it('should create basic schema from field definitions', () => {
      const fields = [
        { name: 'title', type: 'text' as const },
        { name: 'price', type: 'number' as const },
        { name: 'email', type: 'email' as const },
      ];

      const schema = SchemaHelpers.createBasicSchema(fields);

      expect(schema).toHaveLength(3);
      expect(schema[0].name).toBe('title');
      expect(schema[0].type).toBe('text');
      expect(schema[0].field_order).toBe(1);
      expect(schema[1].field_order).toBe(2);
      expect(schema[2].field_order).toBe(3);
    });
  });
});
