/**
 * Enhanced Validation Utilities for Table Operations
 *
 * Provides advanced validation including field dependencies,
 * cross-field validation rules, and schema complexity limits.
 */

import { FieldDefinition, FieldType } from '../../types/api/table';
import { ValidationError } from '../../errors/utils';

export interface FieldDependency {
  fieldName: string;
  dependsOn: string[];
  condition: (
    dependentField: FieldDefinition,
    dependencyFields: FieldDefinition[]
  ) => boolean;
  errorMessage: string;
}

export interface CrossFieldValidationRule {
  name: string;
  fields: string[];
  validator: (fields: FieldDefinition[]) => boolean;
  errorMessage: string;
}

export interface SchemaComplexityLimits {
  maxFields: number;
  maxVectorFields: number;
  maxDropdownItems: number;
  maxFieldNameLength: number;
  maxDescriptionLength: number;
}

export class EnhancedTableValidator {
  private static readonly DEFAULT_LIMITS: SchemaComplexityLimits = {
    maxFields: 1000,
    maxVectorFields: 10,
    maxDropdownItems: 100,
    maxFieldNameLength: 100,
    maxDescriptionLength: 1000,
  };

  private static readonly FIELD_DEPENDENCIES: FieldDependency[] = [
    {
      fieldName: 'vector_dimension',
      dependsOn: ['type'],
      condition: (field, dependencies) => {
        const typeField = dependencies.find((f) => f.name === 'type');
        return (
          typeField?.type === 'vector' ||
          typeField?.type === 'halfvec' ||
          typeField?.type === 'sparsevec'
        );
      },
      errorMessage: 'Vector dimension is only valid for vector field types',
    },
    {
      fieldName: 'currency_format',
      dependsOn: ['type'],
      condition: (field, dependencies) => {
        const typeField = dependencies.find((f) => f.name === 'type');
        return typeField?.type === 'currency';
      },
      errorMessage: 'Currency format is only valid for currency field types',
    },
    {
      fieldName: 'selectable_items',
      dependsOn: ['type'],
      condition: (field, dependencies) => {
        const typeField = dependencies.find((f) => f.name === 'type');
        return typeField?.type === 'dropdown';
      },
      errorMessage: 'Selectable items are only valid for dropdown field types',
    },
    {
      fieldName: 'phone_format',
      dependsOn: ['type'],
      condition: (field, dependencies) => {
        const typeField = dependencies.find((f) => f.name === 'type');
        return typeField?.type === 'phone-number';
      },
      errorMessage: 'Phone format is only valid for phone number field types',
    },
  ];

  private static readonly CROSS_FIELD_RULES: CrossFieldValidationRule[] = [
    {
      name: 'unique_primary_key',
      fields: ['is_unique', 'is_primary_key'],
      validator: (fields) => {
        const uniqueField = fields.find((f) => f.name === 'is_unique');
        const primaryKeyField = fields.find((f) => f.name === 'is_primary_key');
        return !(uniqueField?.is_unique && primaryKeyField?.is_primary_key);
      },
      errorMessage: 'A field cannot be both unique and primary key',
    },
    {
      name: 'vector_dimension_limits',
      fields: ['type', 'vector_dimension'],
      validator: (fields) => {
        const typeField = fields.find((f) => f.name === 'type');
        const dimensionField = fields.find(
          (f) => f.name === 'vector_dimension'
        );

        if (typeField?.type === 'vector' && dimensionField?.vector_dimension) {
          return (
            dimensionField.vector_dimension >= 1 &&
            dimensionField.vector_dimension <= 16384
          );
        }
        if (typeField?.type === 'halfvec' && dimensionField?.vector_dimension) {
          return (
            dimensionField.vector_dimension >= 1 &&
            dimensionField.vector_dimension <= 8192
          );
        }
        if (
          typeField?.type === 'sparsevec' &&
          dimensionField?.vector_dimension
        ) {
          return (
            dimensionField.vector_dimension >= 1 &&
            dimensionField.vector_dimension <= 32768
          );
        }
        return true;
      },
      errorMessage:
        'Vector dimension must be within valid limits for the field type',
    },
    {
      name: 'dropdown_items_limit',
      fields: ['type', 'selectable_items'],
      validator: (fields) => {
        const typeField = fields.find((f) => f.name === 'type');
        const itemsField = fields.find((f) => f.name === 'selectable_items');

        if (typeField?.type === 'dropdown' && itemsField?.selectable_items) {
          return itemsField.selectable_items.length <= 100;
        }
        return true;
      },
      errorMessage: 'Dropdown field cannot have more than 100 selectable items',
    },
  ];

  /**
   * Validate field dependencies
   */
  static validateFieldDependencies(
    field: FieldDefinition,
    allFields: FieldDefinition[]
  ): void {
    const errors: Array<{ field: string; message: string }> = [];

    for (const dependency of this.FIELD_DEPENDENCIES) {
      if (field.name === dependency.fieldName) {
        const dependencyFields = allFields.filter((f) =>
          dependency.dependsOn.includes(f.name)
        );

        if (!dependency.condition(field, dependencyFields)) {
          errors.push({
            field: field.name,
            message: dependency.errorMessage,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Field dependency validation failed', errors);
    }
  }

  /**
   * Validate cross-field rules
   */
  static validateCrossFieldRules(fields: FieldDefinition[]): void {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of this.CROSS_FIELD_RULES) {
      const ruleFields = fields.filter((f) => rule.fields.includes(f.name));

      if (ruleFields.length === rule.fields.length) {
        if (!rule.validator(ruleFields)) {
          errors.push({
            field: 'schema',
            message: rule.errorMessage,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Cross-field validation failed', errors);
    }
  }

  /**
   * Validate schema complexity limits
   */
  static validateSchemaComplexity(
    fields: FieldDefinition[],
    description?: string,
    limits: Partial<SchemaComplexityLimits> = {}
  ): void {
    const effectiveLimits = { ...this.DEFAULT_LIMITS, ...limits };
    const errors: Array<{ field: string; message: string }> = [];

    // Check field count
    if (fields.length > effectiveLimits.maxFields) {
      errors.push({
        field: 'schema',
        message: `Schema cannot have more than ${effectiveLimits.maxFields} fields`,
      });
    }

    // Check vector field count
    const vectorFields = fields.filter(
      (f) =>
        f.type === 'vector' || f.type === 'halfvec' || f.type === 'sparsevec'
    );
    if (vectorFields.length > effectiveLimits.maxVectorFields) {
      errors.push({
        field: 'schema',
        message: `Schema cannot have more than ${effectiveLimits.maxVectorFields} vector fields`,
      });
    }

    // Check field name lengths
    for (const field of fields) {
      if (field.name.length > effectiveLimits.maxFieldNameLength) {
        errors.push({
          field: field.name,
          message: `Field name cannot exceed ${effectiveLimits.maxFieldNameLength} characters`,
        });
      }
    }

    // Check description length
    if (
      description &&
      description.length > effectiveLimits.maxDescriptionLength
    ) {
      errors.push({
        field: 'description',
        message: `Description cannot exceed ${effectiveLimits.maxDescriptionLength} characters`,
      });
    }

    // Check dropdown items
    for (const field of fields) {
      if (field.type === 'dropdown' && field.selectable_items) {
        if (field.selectable_items.length > effectiveLimits.maxDropdownItems) {
          errors.push({
            field: field.name,
            message: `Dropdown field cannot have more than ${effectiveLimits.maxDropdownItems} items`,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Schema complexity validation failed', errors);
    }
  }

  /**
   * Validate field type specific requirements
   */
  static validateFieldTypeRequirements(field: FieldDefinition): void {
    const errors: Array<{ field: string; message: string }> = [];

    switch (field.type) {
      case 'vector':
      case 'halfvec':
      case 'sparsevec':
        if (!field.vector_dimension) {
          errors.push({
            field: field.name,
            message: `${field.type} field must have vector_dimension specified`,
          });
        } else {
          const limits = this.getVectorDimensionLimits(field.type);
          if (
            field.vector_dimension < limits.min ||
            field.vector_dimension > limits.max
          ) {
            errors.push({
              field: field.name,
              message: `${field.type} dimension must be between ${limits.min} and ${limits.max}`,
            });
          }
        }
        break;

      case 'currency':
        if (!field.currency_format) {
          errors.push({
            field: field.name,
            message: 'Currency field must have currency_format specified',
          });
        }
        break;

      case 'dropdown':
        if (!field.selectable_items || field.selectable_items.length === 0) {
          errors.push({
            field: field.name,
            message: 'Dropdown field must have selectable_items specified',
          });
        }
        break;

      case 'phone-number':
        if (!field.phone_format) {
          errors.push({
            field: field.name,
            message: 'Phone number field must have phone_format specified',
          });
        }
        break;

      case 'date-time':
        if (!field.date_format) {
          errors.push({
            field: field.name,
            message: 'Date-time field must have date_format specified',
          });
        }
        break;
    }

    if (errors.length > 0) {
      throw new ValidationError('Field type validation failed', errors);
    }
  }

  /**
   * Get vector dimension limits for a field type
   */
  private static getVectorDimensionLimits(type: FieldType): {
    min: number;
    max: number;
  } {
    switch (type) {
      case 'vector':
        return { min: 1, max: 16384 };
      case 'halfvec':
        return { min: 1, max: 8192 };
      case 'sparsevec':
        return { min: 1, max: 32768 };
      default:
        return { min: 0, max: 0 };
    }
  }

  /**
   * Comprehensive validation of a table schema
   */
  static validateTableSchema(
    fields: FieldDefinition[],
    description?: string,
    limits?: Partial<SchemaComplexityLimits>
  ): void {
    // Validate schema complexity
    this.validateSchemaComplexity(fields, description, limits);

    // Validate each field's type requirements
    for (const field of fields) {
      this.validateFieldTypeRequirements(field);
    }

    // Validate field dependencies
    for (const field of fields) {
      this.validateFieldDependencies(field, fields);
    }

    // Validate cross-field rules
    this.validateCrossFieldRules(fields);
  }
}
