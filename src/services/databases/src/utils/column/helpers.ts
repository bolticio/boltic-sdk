import {
  ColumnUpdateRequest,
  DateFormatEnum,
  DecimalType,
  PhoneFormatType,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';

export class ColumnHelpers {
  /**
   * Convert FieldDefinition to ColumnUpdateRequest
   */
  static fieldToUpdateRequest(field: FieldDefinition): ColumnUpdateRequest {
    return {
      name: field.name,
      type: field.type,
      description: field.description,
      is_nullable: field.is_nullable,
      is_unique: field.is_unique,
      is_indexed: field.is_indexed,
      is_visible: field.is_visible,
      is_primary_key: field.is_primary_key,
      is_readonly: field.is_readonly,
      field_order: field.field_order,
      default_value: field.default_value,
      alignment: field.alignment,
      decimals: field.decimals as DecimalType,
      currency_format: field.currency_format,
      selectable_items: field.selectable_items,
      multiple_selections: field.multiple_selections,
      phone_format: field.phone_format as PhoneFormatType,
      date_format: field.date_format as keyof typeof DateFormatEnum,
      time_format: field.time_format as keyof typeof TimeFormatEnum,
      timezone: field.timezone,
      vector_dimension: field.vector_dimension,
    };
  }

  /**
   * Apply default values to column definition
   */
  static applyDefaultValues(column: Partial<FieldDefinition>): FieldDefinition {
    if (!column.name || !column.type) {
      throw new Error('Column name and type are required');
    }

    return {
      name: column.name,
      type: column.type,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_visible: true,
      is_readonly: false,
      field_order: 1,
      alignment: 'center',
      multiple_selections: false,
      ...column,
    };
  }

  /**
   * Create a column definition with proper defaults
   */
  static createColumnDefinition(
    name: string,
    type: FieldType,
    options: Partial<FieldDefinition> = {}
  ): FieldDefinition {
    return this.applyDefaultValues({
      name,
      type,
      ...options,
    });
  }

  /**
   * Get column type display name
   */
  static getColumnTypeDisplayName(type: FieldType): string {
    const typeNames: Record<FieldType, string> = {
      text: 'Text',
      'long-text': 'Long Text',
      number: 'Number',
      currency: 'Currency',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
      email: 'Email',
      'phone-number': 'Phone Number',
      link: 'Link',
      json: 'JSON',
      'date-time': 'Date & Time',
      vector: 'Vector',
      halfvec: 'Half Vector',
      sparsevec: 'Sparse Vector',
    };

    return typeNames[type] || type;
  }
}
