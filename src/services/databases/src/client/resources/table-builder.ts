import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ValidationError } from '../../errors/utils';
import {
  FieldDefinition,
  FieldType,
  TableCreateRequest,
} from '../../types/api/table';

export interface TableBuilderOptions {
  name: string;
  description?: string;
  is_ai_generated_schema?: boolean;
}

export interface GenerateSchemaOptions {
  prompt: string;
  isTemplate?: boolean;
}

/**
 * Table Builder - provides a fluent interface for creating tables
 */
export class TableBuilder {
  private tableName: string;
  private description?: string;
  private isPublic: boolean = false;
  private fields: FieldDefinition[] = [];
  private tablesApiClient?: TablesApiClient;

  constructor(options: TableBuilderOptions, tablesApiClient?: TablesApiClient) {
    this.tableName = options.name;
    this.description = options.description;
    this.isPublic = options.is_ai_generated_schema ?? false;
    this.tablesApiClient = tablesApiClient;
  }

  /**
   * Add a text field
   */
  addTextField(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'text',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a number field
   */
  addNumberField(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      decimals?: number;
      description?: string;
      defaultValue?: number;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'number',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      decimals: options.decimals?.toString() ?? '0.00',
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a currency field
   */
  addCurrencyField(
    name: string,
    options: {
      currencyFormat: string;
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      decimals?: number;
      description?: string;
      defaultValue?: number;
    }
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'currency',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      currency_format: options.currencyFormat,
      decimals: options.decimals?.toString() ?? '0.00',
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a checkbox field
   */
  addCheckboxField(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: boolean;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'checkbox',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a dropdown field
   */
  addDropdownField(
    name: string,
    options: {
      items: string[];
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: string;
    }
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'dropdown',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      selectable_items: options.items,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add an email field
   */
  addEmailField(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'email',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a phone number field
   */
  addPhoneField(
    name: string,
    options: {
      format?: 'international' | 'national' | 'e164';
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'phone-number',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      phone_format: options.format,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a date-time field
   */
  addDateTimeField(
    name: string,
    options: {
      dateFormat?: string;
      timeFormat?: string;
      timezone?: string;
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
      defaultValue?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'date-time',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      date_format: options.dateFormat,
      time_format: options.timeFormat,
      timezone: options.timezone,
      description: options.description,
      default_value: options.defaultValue,
    });
    return this;
  }

  /**
   * Add a vector field for AI/ML operations
   */
  addVectorField(
    name: string,
    options: {
      dimension: number;
      type?: 'vector' | 'halfvec' | 'sparsevec';
      nullable?: boolean;
      unique?: boolean;
      primaryKey?: boolean;
      indexed?: boolean;
      description?: string;
    }
  ): TableBuilder {
    this.fields.push({
      name,
      type: options.type || 'vector',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_primary_key: options.primaryKey ?? false,
      is_indexed: options.indexed ?? false,
      vector_dimension: options.dimension,
      description: options.description,
    });
    return this;
  }

  /**
   * Add a custom field with full configuration
   */
  addField(field: FieldDefinition): TableBuilder {
    // Validate field name
    if (!field.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
      throw new ValidationError('Invalid field name', [
        {
          field: 'name',
          message:
            'Field name must start with a letter and contain only letters, numbers, and underscores',
        },
      ]);
    }

    // Check for duplicate field names
    if (
      this.fields.some((f) => f.name.toLowerCase() === field.name.toLowerCase())
    ) {
      throw new ValidationError('Duplicate field name', [
        {
          field: 'name',
          message: `Field name '${field.name}' already exists`,
        },
      ]);
    }

    // Set field order
    field.field_order = this.fields.length + 1;

    this.fields.push(field);
    return this;
  }

  /**
   * Generate schema from natural language prompt
   */
  async generateFromPrompt(
    options: GenerateSchemaOptions
  ): Promise<TableBuilder> {
    if (!this.tablesApiClient) {
      throw new Error('TablesApiClient is required for schema generation');
    }

    try {
      const result = await this.tablesApiClient.generateSchema(options.prompt);

      if (result.error) {
        throw new Error(`Schema generation failed: ${result.error}`);
      }

      if (result.data?.fields && Array.isArray(result.data.fields)) {
        this.fields = []; // Clear existing fields
        result.data.fields.forEach(
          (
            field: { name: string; type: string; description?: string },
            index: number
          ) => {
            const fieldDefinition: FieldDefinition = {
              name: field.name,
              type: field.type as FieldType,
              is_nullable: true,
              is_primary_key: false,
              is_unique: false,
              is_indexed: false,
              field_order: index + 1,
              description: field.description,
            };
            this.fields.push(fieldDefinition);
          }
        );
        if (result.data.name) this.tableName = result.data.name;
        if (result.data.description) this.description = result.data.description;
      }

      return this;
    } catch (error) {
      throw new ValidationError('Schema generation failed', [
        {
          field: 'prompt',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ]);
    }
  }

  /**
   * Set table description
   */
  setDescription(description: string): TableBuilder {
    this.description = description;
    return this;
  }

  /**
   * Set table visibility
   */
  setPublic(isPublic: boolean): TableBuilder {
    this.isPublic = isPublic;
    return this;
  }

  /**
   * Get the current field count
   */
  getFieldCount(): number {
    return this.fields.length;
  }

  /**
   * Get field names
   */
  getFieldNames(): string[] {
    return this.fields.map((f) => f.name);
  }

  /**
   * Check if a field exists
   */
  hasField(fieldName: string): boolean {
    return this.fields.some(
      (f) => f.name.toLowerCase() === fieldName.toLowerCase()
    );
  }

  /**
   * Remove a field
   */
  removeField(fieldName: string): TableBuilder {
    this.fields = this.fields.filter(
      (f) => f.name.toLowerCase() !== fieldName.toLowerCase()
    );

    // Update field orders
    this.fields.forEach((field, index) => {
      field.field_order = index + 1;
    });

    return this;
  }

  /**
   * Build the table creation request
   */
  build(): TableCreateRequest {
    return {
      name: this.tableName,
      description: this.description,
      fields: this.fields,
      is_ai_generated_schema: this.isPublic,
      is_template: false,
    };
  }

  /**
   * Build and create the table (requires API client)
   */
  async create(
    options: { is_ai_generated_schema?: boolean; is_template?: boolean } = {}
  ): Promise<{ data: { id: string; message: string }; error?: unknown }> {
    if (!this.tablesApiClient) {
      throw new Error('TablesApiClient is required for table creation');
    }
    const request = this.build();
    return this.tablesApiClient.createTable(request, options);
  }
}

/**
 * Create a new table builder
 */
export function createTableBuilder(
  options: TableBuilderOptions,
  tablesApiClient?: TablesApiClient
): TableBuilder {
  return new TableBuilder(options, tablesApiClient);
}
