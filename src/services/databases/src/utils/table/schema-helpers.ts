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
      selection_source: 'provide-static-list',
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
   * Create a basic schema from field definitions
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
