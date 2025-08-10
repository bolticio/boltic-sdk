import {
  ColumnDetails,
  ColumnUpdateRequest,
  DateFormatEnum,
  DecimalType,
  PhoneFormatType,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';
import { ColumnValidator } from '../validation/column-validator';

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
   * Validate column properties for a specific field type
   */
  static validateColumnForType(
    column: Partial<ColumnDetails>,
    type: FieldType
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    switch (type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!column.vector_dimension || column.vector_dimension <= 0) {
          errors.push('Vector fields require a positive vector_dimension');
        }
        break;

      case 'currency':
        if (
          column.currency_format &&
          !/^[A-Z]{3}$/.test(column.currency_format)
        ) {
          errors.push('Currency format must be a 3-letter ISO code');
        }
        break;

      case 'dropdown':
        if (!column.selectable_items || column.selectable_items.length === 0) {
          errors.push('Dropdown fields require selectable_items');
        }
        break;

      case 'phone-number':
        if (
          column.phone_format &&
          !this.isValidPhoneFormat(column.phone_format)
        ) {
          errors.push('Invalid phone format');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate phone format using the defined types
   */
  private static isValidPhoneFormat(format: string): format is PhoneFormatType {
    const validFormats: PhoneFormatType[] = [
      '+91 123 456 7890',
      '(123) 456-7890',
      '+1 (123) 456-7890',
      '+91 12 3456 7890',
    ];
    return validFormats.includes(format as PhoneFormatType);
  }

  /**
   * Get default values for column properties
   */
  static getDefaultValues(): {
    is_nullable: boolean;
    is_unique: boolean;
    is_indexed: boolean;
    is_primary_key: boolean;
    is_visible: boolean;
    is_readonly: boolean;
  } {
    return {
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_visible: true,
      is_readonly: false,
    };
  }

  /**
   * Apply default values to a column definition
   */
  static applyDefaultValues(column: Partial<FieldDefinition>): FieldDefinition {
    const defaults = this.getDefaultValues();

    return {
      name: column.name || '',
      type: column.type || 'text',
      is_nullable: column.is_nullable ?? defaults.is_nullable,
      is_unique: column.is_unique ?? defaults.is_unique,
      is_indexed: column.is_indexed ?? defaults.is_indexed,
      is_primary_key: column.is_primary_key ?? defaults.is_primary_key,
      is_visible: defaults.is_visible, // Always true
      is_readonly: defaults.is_readonly, // Always false
      field_order: column.field_order,
      description: column.description,
      default_value: column.default_value,
      alignment: column.alignment,
      timezone: column.timezone,
      date_format: column.date_format,
      time_format: column.time_format,
      decimals: column.decimals as DecimalType,
      currency_format: column.currency_format,
      selection_source: column.selection_source,
      selectable_items: column.selectable_items,
      multiple_selections: column.multiple_selections,
      phone_format: column.phone_format as PhoneFormatType,
      vector_dimension: column.vector_dimension,
    };
  }

  /**
   * Validate and transform column data for API calls
   */
  static processColumnForAPI(column: FieldDefinition): FieldDefinition {
    const processedColumn = this.applyDefaultValues(column);

    // Transform date and time formats if they are user-friendly keys
    if (
      processedColumn.date_format &&
      typeof processedColumn.date_format === 'string'
    ) {
      // Check if it's a user-friendly format key
      const dateFormatKey =
        processedColumn.date_format as keyof typeof DateFormatEnum;
      if (dateFormatKey && typeof dateFormatKey === 'string') {
        try {
          processedColumn.date_format =
            ColumnValidator.transformDateFormat(dateFormatKey);
        } catch (error) {
          // If transformation fails, keep the original value
          console.warn(`Invalid date format: ${dateFormatKey}`);
        }
      }
    }

    if (
      processedColumn.time_format &&
      typeof processedColumn.time_format === 'string'
    ) {
      // Check if it's a user-friendly format key
      const timeFormatKey =
        processedColumn.time_format as keyof typeof TimeFormatEnum;
      if (timeFormatKey && typeof timeFormatKey === 'string') {
        try {
          processedColumn.time_format =
            ColumnValidator.transformTimeFormat(timeFormatKey);
        } catch (error) {
          // If transformation fails, keep the original value
          console.warn(`Invalid time format: ${timeFormatKey}`);
        }
      }
    }

    return processedColumn;
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
   * Validate column name format
   */
  static isValidColumnName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
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
