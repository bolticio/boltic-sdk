import { FieldDefinition, FieldType } from '../../types/api/table';

export class SchemaHelpers {
  /**
   * Create a text field definition
   */
  static textField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'text',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a number field definition
   */
  static numberField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'number',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      decimals: '0.00',
      ...options,
    };
  }

  /**
   * Create a currency field definition
   */
  static currencyField(
    name: string,
    currency: string = 'USD',
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'currency',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      decimals: '0.00',
      currency_format: currency,
      ...options,
    };
  }

  /**
   * Create a dropdown field definition
   */
  static dropdownField(
    name: string,
    items: string[],
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'dropdown',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      selectable_items: items,
      multiple_selections: false,
      ...options,
    };
  }

  /**
   * Create a vector field definition
   */
  static vectorField(
    name: string,
    dimension: number,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'vector',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      vector_dimension: dimension,
      ...options,
    };
  }

  /**
   * Create a JSON field definition
   */
  static jsonField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'json',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a date-time field definition
   */
  static dateTimeField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'date-time',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      date_format: 'YYYY-MM-DD',
      time_format: 'HH:mm:ss',
      ...options,
    };
  }

  /**
   * Create an email field definition
   */
  static emailField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'email',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a long-text field definition
   */
  static longTextField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'long-text',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a link field definition
   */
  static linkField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'link',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      ...options,
    };
  }

  /**
   * Create a phone number field definition
   */
  static phoneNumberField(
    name: string,
    format: string = 'international',
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'phone-number',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      phone_format: format,
      ...options,
    };
  }

  /**
   * Create a checkbox field definition
   */
  static checkboxField(
    name: string,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'checkbox',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      default_value: false,
      ...options,
    };
  }

  /**
   * Create a half-vector field definition
   */
  static halfVectorField(
    name: string,
    dimension: number,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'halfvec',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      vector_dimension: dimension,
      ...options,
    };
  }

  /**
   * Create a sparse vector field definition
   */
  static sparseVectorField(
    name: string,
    dimension: number,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return {
      name,
      type: 'sparsevec',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: 1,
      vector_dimension: dimension,
      ...options,
    };
  }

  /**
   * Validate a complete schema
   */
  static validateSchema(schema: FieldDefinition[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(schema) || schema.length === 0) {
      errors.push('Schema must be a non-empty array');
      return { isValid: false, errors };
    }

    const fieldNames = new Set<string>();

    schema.forEach((field, index) => {
      // Check for duplicate field names
      if (fieldNames.has(field.name.toLowerCase())) {
        errors.push(`Duplicate field name at index ${index}: ${field.name}`);
      } else {
        fieldNames.add(field.name.toLowerCase());
      }

      // Validate field name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(`Invalid field name at index ${index}: ${field.name}`);
      }

      // Type-specific validations
      if (
        ['vector', 'halfvec', 'sparsevec'].includes(field.type) &&
        (!field.vector_dimension || field.vector_dimension <= 0)
      ) {
        errors.push(
          `${field.type} field at index ${index} requires positive vector_dimension`
        );
      }

      // Half-vector dimension limit check
      if (
        field.type === 'halfvec' &&
        field.vector_dimension &&
        field.vector_dimension > 65535
      ) {
        errors.push(
          `Half-vector field at index ${index} exceeds maximum dimension limit of 65535`
        );
      }

      if (
        field.type === 'dropdown' &&
        (!field.selectable_items || field.selectable_items.length === 0)
      ) {
        errors.push(
          `Dropdown field at index ${index} requires selectable_items`
        );
      }

      // Dropdown item limit check
      if (
        field.type === 'dropdown' &&
        field.selectable_items &&
        field.selectable_items.length > 100
      ) {
        errors.push(
          `Dropdown field at index ${index} exceeds maximum 100 selectable items`
        );
      }

      if (field.type === 'phone-number' && field.phone_format) {
        if (
          !['international', 'national', 'e164'].includes(field.phone_format)
        ) {
          errors.push(
            `Phone number field at index ${index} has invalid format: ${field.phone_format}`
          );
        }
      }

      // Number field decimal validation
      if (
        field.type === 'number' &&
        field.decimals !== undefined &&
        typeof field.decimals === 'number' &&
        field.decimals < 0
      ) {
        errors.push(
          `Number field at index ${index} cannot have negative decimal places`
        );
      }

      // Checkbox default value validation
      if (
        field.type === 'checkbox' &&
        field.default_value !== undefined &&
        typeof field.default_value !== 'boolean'
      ) {
        errors.push(
          `Checkbox field at index ${index} default value must be boolean`
        );
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generate a basic schema from field names and types
   */
  static createBasicSchema(
    fields: Array<{ name: string; type: FieldType }>
  ): FieldDefinition[] {
    return fields.map((field, index) => ({
      name: field.name,
      type: field.type,
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_visible: true,
      is_readonly: false,
      is_indexed: false,
      field_order: index + 1,
    }));
  }
}
