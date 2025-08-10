import { ValidationError } from '../../errors';
import {
  DateFormatEnum,
  DecimalType,
  PhoneFormatType,
  TimeFormatEnum,
} from '../../types/api/column';
import { FieldDefinition, FieldType } from '../../types/api/table';

// Date format transformation map
const DateFormatMap = Object.freeze({
  '%m/%d/%y': 'MM/dd/yy',
  '%m/%d/%Y': 'MM/dd/yyyy',
  '%m-%d-%Y': 'MM-dd-yyyy',
  '%d-%m-%Y': 'dd-MM-yyyy',
  '%d/%m/%Y': 'dd/MM/yyyy',
  '%d/%m/%y': 'dd/MM/yy',
  '%Y-%m-%d': 'yyyy-MM-dd',
  '%B %d %Y': 'MMMM dd yyyy',
  '%b %d %Y': 'MMM dd yyyy',
  '%a %b %d %Y': 'ccc MMM dd yyyy',
});

// Time format transformation map
const TimeFormatMap = Object.freeze({
  '%H:%M:%S': 'HH:mm:ss',
  '%H:%M:%SZ': 'HH:mm:ssXXX',
  '%H:%M:%S.%f': 'HH:mm:ss.SSS',
  '%H:%M:%S %Z': 'HH:mm:ss z',
  '%I:%M:%S %p': 'hh:mm:ss a',
  '%H:%M': 'HH:mm',
  '%I:%M %p': 'hh:mm a',
});

export class ColumnValidator {
  /**
   * Validate column creation request
   */
  static validateCreateRequest(data: { columns: FieldDefinition[] }): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (
      !data.columns ||
      !Array.isArray(data.columns) ||
      data.columns.length === 0
    ) {
      errors.push({
        field: 'columns',
        message: 'At least one column definition is required',
      });
    } else {
      this.validateColumnsArray(data.columns, errors);
    }

    if (errors.length > 0) {
      throw new ValidationError('Column creation validation failed', errors);
    }
  }

  /**
   * Validate column update request
   */
  static validateUpdateRequest(data: {
    name?: string;
    description?: string;
    [key: string]: unknown;
  }): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Column name cannot be empty' });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name)) {
        errors.push({
          field: 'name',
          message:
            'Column name must start with a letter and contain only letters, numbers, and underscores',
        });
      }
    }

    if (data.description !== undefined && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters',
      });
    }

    // Validate type-specific properties
    this.validateTypeSpecificProperties(data, errors);

    if (errors.length > 0) {
      throw new ValidationError('Column update validation failed', errors);
    }
  }

  /**
   * Validate columns array
   */
  private static validateColumnsArray(
    columns: FieldDefinition[],
    errors: Array<{ field: string; message: string }>
  ): void {
    const columnNames = new Set<string>();

    columns.forEach((column, index) => {
      const fieldPrefix = `columns[${index}]`;

      // Validate column name (required)
      if (!column.name || column.name.trim().length === 0) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: 'Column name is required',
        });
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message:
            'Column name must start with a letter and contain only letters, numbers, and underscores',
        });
      } else if (columnNames.has(column.name.toLowerCase())) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: `Duplicate column name: ${column.name}`,
        });
      } else {
        columnNames.add(column.name.toLowerCase());
      }

      // Validate column type (required)
      if (!column.type) {
        errors.push({
          field: `${fieldPrefix}.type`,
          message: 'Column type is required',
        });
      } else {
        this.validateFieldType(column, fieldPrefix, errors);
      }

      // Validate field order (optional)
      if (
        column.field_order !== undefined &&
        (column.field_order < 1 || !Number.isInteger(column.field_order))
      ) {
        errors.push({
          field: `${fieldPrefix}.field_order`,
          message: 'Field order must be a positive integer',
        });
      }
    });
  }

  /**
   * Validate field type and type-specific properties
   */
  private static validateFieldType(
    field: FieldDefinition,
    fieldPrefix: string,
    errors: Array<{ field: string; message: string }>
  ): void {
    // Validate field type
    const validTypes: FieldType[] = [
      'text',
      'long-text',
      'number',
      'currency',
      'checkbox',
      'dropdown',
      'email',
      'phone-number',
      'link',
      'json',
      'date-time',
      'vector',
      'halfvec',
      'sparsevec',
    ];

    if (!validTypes.includes(field.type)) {
      errors.push({
        field: `${fieldPrefix}.type`,
        message: `Invalid field type: ${field.type}`,
      });
      return;
    }

    // Type-specific validations using FIELD_SPECIFIC_KEYS_MAP
    // Validate required properties for specific field types
    switch (field.type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!field.vector_dimension || field.vector_dimension <= 0) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: 'Vector fields require a positive vector_dimension',
          });
        }
        if (field.vector_dimension && field.vector_dimension > 10000) {
          errors.push({
            field: `${fieldPrefix}.vector_dimension`,
            message: 'Vector dimension cannot exceed 10,000',
          });
        }
        break;

      case 'currency':
        if (
          field.currency_format &&
          !this.isValidCurrencyFormat(field.currency_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.currency_format`,
            message: 'Currency format must be a 3-letter ISO code (e.g., USD)',
          });
        }
        if (field.decimals !== undefined) {
          if (!this.isValidDecimalType(field.decimals)) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message:
                'Decimals must be one of: 00, 0.0, 0.00, 0.000, 0.0000, 0.00000, 0.000000',
            });
          }
        }
        break;

      case 'number':
        if (field.decimals !== undefined) {
          if (!this.isValidDecimalType(field.decimals)) {
            errors.push({
              field: `${fieldPrefix}.decimals`,
              message:
                'Decimals must be one of: 00, 0.0, 0.00, 0.000, 0.0000, 0.00000, 0.000000',
            });
          }
        }
        break;

      case 'dropdown':
        if (
          !field.selectable_items ||
          !Array.isArray(field.selectable_items) ||
          field.selectable_items.length === 0
        ) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: 'Dropdown fields require selectable_items array',
          });
        }
        if (field.selectable_items && field.selectable_items.length > 100) {
          errors.push({
            field: `${fieldPrefix}.selectable_items`,
            message: 'Dropdown cannot have more than 100 options',
          });
        }
        break;

      case 'phone-number':
        if (
          field.phone_format &&
          !this.isValidPhoneFormat(field.phone_format)
        ) {
          errors.push({
            field: `${fieldPrefix}.phone_format`,
            message:
              'Phone format must be one of: +91 123 456 7890, (123) 456-7890, +1 (123) 456-7890, +91 12 3456 7890',
          });
        }
        break;

      case 'date-time':
        if (field.date_format && !this.isValidDateFormat(field.date_format)) {
          errors.push({
            field: `${fieldPrefix}.date_format`,
            message: 'Invalid date format pattern',
          });
        }
        if (field.time_format && !this.isValidTimeFormat(field.time_format)) {
          errors.push({
            field: `${fieldPrefix}.time_format`,
            message: 'Invalid time format pattern',
          });
        }
        break;
    }
  }

  /**
   * Validate type-specific properties for updates
   */
  private static validateTypeSpecificProperties(
    data: Record<string, unknown>,
    errors: Array<{ field: string; message: string }>
  ): void {
    if (data.decimals !== undefined) {
      if (!this.isValidDecimalType(data.decimals)) {
        errors.push({
          field: 'decimals',
          message:
            'Decimals must be one of: 00, 0.0, 0.00, 0.000, 0.0000, 0.00000, 0.000000',
        });
      }
    }

    if (
      data.currency_format &&
      !this.isValidCurrencyFormat(data.currency_format as string)
    ) {
      errors.push({
        field: 'currency_format',
        message: 'Currency format must be a 3-letter ISO code (e.g., USD)',
      });
    }

    if (data.selectable_items) {
      if (
        !Array.isArray(data.selectable_items) ||
        data.selectable_items.length === 0
      ) {
        errors.push({
          field: 'selectable_items',
          message: 'Selectable items must be a non-empty array',
        });
      } else if (data.selectable_items.length > 100) {
        errors.push({
          field: 'selectable_items',
          message: 'Cannot have more than 100 selectable items',
        });
      }
    }

    if (
      data.phone_format &&
      !this.isValidPhoneFormat(data.phone_format as string)
    ) {
      errors.push({
        field: 'phone_format',
        message:
          'Phone format must be one of: +91 123 456 7890, (123) 456-7890, +1 (123) 456-7890, +91 12 3456 7890',
      });
    }

    if (data.alignment && !this.isValidAlignment(data.alignment as string)) {
      errors.push({
        field: 'alignment',
        message: 'Alignment must be one of: left, center, right',
      });
    }

    if (data.date_format) {
      const dateFormat = data.date_format as string;
      if (!this.isValidDateFormat(dateFormat)) {
        errors.push({
          field: 'date_format',
          message: 'Invalid date format',
        });
      } else {
        // Transform the format to API format
        const transformedFormat = this.transformUserDateFormat(dateFormat);
        if (transformedFormat) {
          data.date_format = transformedFormat;
        }
      }
    }

    if (data.time_format) {
      const timeFormat = data.time_format as string;
      if (!this.isValidTimeFormat(timeFormat)) {
        errors.push({
          field: 'time_format',
          message: 'Invalid time format',
        });
      } else {
        // Transform the format to API format
        const transformedFormat = this.transformUserTimeFormat(timeFormat);
        if (transformedFormat) {
          data.time_format = transformedFormat;
        }
      }
    }
  }

  /**
   * Validate currency format
   */
  private static isValidCurrencyFormat(format: string): boolean {
    return /^[A-Z]{3}$/.test(format);
  }

  /**
   * Validate decimal type
   */
  private static isValidDecimalType(
    decimals: unknown
  ): decimals is DecimalType {
    const validDecimals: DecimalType[] = [
      '00',
      '0.0',
      '0.00',
      '0.000',
      '0.0000',
      '0.00000',
      '0.000000',
    ];
    return validDecimals.includes(decimals as DecimalType);
  }

  /**
   * Validate phone format
   */
  private static isValidPhoneFormat(format: string): format is PhoneFormatType {
    // Phone format is just for storing the format pattern, not validating actual numbers
    // Accept any of the predefined format patterns
    const validFormats: PhoneFormatType[] = [
      '+91 123 456 7890',
      '(123) 456-7890',
      '+1 (123) 456-7890',
      '+91 12 3456 7890',
    ];
    return validFormats.includes(format as PhoneFormatType);
  }

  /**
   * Validate alignment
   */
  private static isValidAlignment(alignment: string): boolean {
    return ['left', 'center', 'right'].includes(alignment);
  }

  /**
   * Validate date format
   */
  private static isValidDateFormat(format: string): boolean {
    // Check if it's a valid enum key
    if (Object.keys(DateFormatEnum).includes(format)) {
      return true;
    }

    // Check if it's a user-friendly format that can be transformed
    const transformedFormat = this.transformUserDateFormat(format);
    return transformedFormat !== null;
  }

  /**
   * Validate time format
   */
  private static isValidTimeFormat(format: string): boolean {
    // Check if it's a valid enum key
    if (Object.keys(TimeFormatEnum).includes(format)) {
      return true;
    }

    // Check if it's a user-friendly format that can be transformed
    const transformedFormat = this.transformUserTimeFormat(format);
    return transformedFormat !== null;
  }

  /**
   * Transform user-friendly date format to API format
   */
  static transformDateFormat(userFormat: keyof typeof DateFormatEnum): string {
    return DateFormatEnum[userFormat];
  }

  /**
   * Transform user-friendly time format to API format
   */
  static transformTimeFormat(userFormat: keyof typeof TimeFormatEnum): string {
    return TimeFormatEnum[userFormat];
  }

  /**
   * Transform user-friendly date format to API format
   */
  private static transformUserDateFormat(userFormat: string): string | null {
    // Check if it's already a valid enum key
    if (Object.keys(DateFormatEnum).includes(userFormat)) {
      return DateFormatEnum[userFormat as keyof typeof DateFormatEnum];
    }

    // Check if it's a user-friendly format that needs transformation
    const apiFormat = Object.values(DateFormatMap).find(
      (value) => value === userFormat
    );

    if (apiFormat) {
      // Find the corresponding API format
      const apiKey = Object.keys(DateFormatMap).find(
        (key) => DateFormatMap[key as keyof typeof DateFormatMap] === userFormat
      );
      return apiKey || null;
    }

    return null;
  }

  /**
   * Transform user-friendly time format to API format
   */
  private static transformUserTimeFormat(userFormat: string): string | null {
    // Check if it's already a valid enum key
    if (Object.keys(TimeFormatEnum).includes(userFormat)) {
      return TimeFormatEnum[userFormat as keyof typeof TimeFormatEnum];
    }

    // Check if it's a user-friendly format that needs transformation
    const apiFormat = Object.values(TimeFormatMap).find(
      (value) => value === userFormat
    );

    if (apiFormat) {
      // Find the corresponding API format
      const apiKey = Object.keys(TimeFormatMap).find(
        (key) => TimeFormatMap[key as keyof typeof TimeFormatMap] === userFormat
      );
      return apiKey || null;
    }

    return null;
  }
}
