import { TablesApiClient } from '../../api/clients/tables-api-client';
import { ValidationError } from '../../errors/utils';
import {
  FieldDefinition,
  TableCreateRequest,
  TableCreateResponse,
} from '../../types/api/table';
import {
  BolticErrorResponse,
  BolticSuccessResponse,
} from '../../types/common/responses';

export interface TableBuilderOptions {
  name: string;
  description?: string;
  is_ai_generated_schema?: boolean;
}

/**
 * Table Builder - provides a fluent interface for creating tables
 */
export class TableBuilder {
  private tableName: string;
  private description?: string;
  private fields: FieldDefinition[] = [];
  private tablesApiClient?: TablesApiClient;

  constructor(options: TableBuilderOptions, tablesApiClient?: TablesApiClient) {
    this.tableName = options.name;
    this.description = options.description;
    this.tablesApiClient = tablesApiClient;
  }

  /**
   * Set table name
   */
  name(name: string): TableBuilder {
    this.tableName = name;
    return this;
  }

  /**
   * Set table description
   */
  describe(description: string): TableBuilder {
    this.description = description;
    return this;
  }

  /**
   * Add a text field
   */
  text(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      indexed?: boolean;
      defaultValue?: string;
      description?: string;
      alignment?: 'left' | 'center' | 'right';
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'text',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_indexed: options.indexed ?? false,
      is_primary_key: false,
      default_value: options.defaultValue,
      description: options.description,
      alignment: options.alignment || 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a long text field
   */
  longText(
    name: string,
    options: {
      nullable?: boolean;
      description?: string;
      alignment?: 'left' | 'center' | 'right';
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'long-text',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      alignment: options.alignment || 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a number field
   */
  number(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      indexed?: boolean;
      defaultValue?: number;
      description?: string;
      decimals?: string;
      alignment?: 'left' | 'center' | 'right';
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'number',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_indexed: options.indexed ?? false,
      is_primary_key: false,
      default_value: options.defaultValue,
      description: options.description,
      decimals: options.decimals,
      alignment: options.alignment || 'right',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a currency field
   */
  currency(
    name: string,
    options: {
      nullable?: boolean;
      defaultValue?: number;
      description?: string;
      currencyFormat?: string;
      decimals?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'currency',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      default_value: options.defaultValue,
      description: options.description,
      currency_format: options.currencyFormat,
      decimals: options.decimals,
      alignment: 'right',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a checkbox field
   */
  checkbox(
    name: string,
    options: {
      nullable?: boolean;
      defaultValue?: boolean;
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'checkbox',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      default_value: options.defaultValue,
      description: options.description,
      alignment: 'center',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a dropdown field
   */
  dropdown(
    name: string,
    items: string[],
    options: {
      nullable?: boolean;
      multiple?: boolean;
      defaultValue?: string | string[];
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'dropdown',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      default_value: options.defaultValue,
      description: options.description,
      selection_source: 'provide-static-list',
      selectable_items: items,
      multiple_selections: options.multiple ?? false,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add an email field
   */
  email(
    name: string,
    options: {
      nullable?: boolean;
      unique?: boolean;
      indexed?: boolean;
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'email',
      is_nullable: options.nullable ?? true,
      is_unique: options.unique ?? false,
      is_indexed: options.indexed ?? false,
      is_primary_key: false,
      description: options.description,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a phone number field
   */
  phone(
    name: string,
    options: {
      nullable?: boolean;
      description?: string;
      format?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'phone-number',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      phone_format: options.format,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a link field
   */
  link(
    name: string,
    options: {
      nullable?: boolean;
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'link',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a JSON field
   */
  json(
    name: string,
    options: {
      nullable?: boolean;
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'json',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a date-time field
   */
  dateTime(
    name: string,
    options: {
      nullable?: boolean;
      description?: string;
      dateFormat?: string;
      timeFormat?: string;
      timezone?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'date-time',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      date_format: options.dateFormat,
      time_format: options.timeFormat,
      timezone: options.timezone,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a vector field
   */
  vector(
    name: string,
    dimension: number,
    options: {
      nullable?: boolean;
      description?: string;
    } = {}
  ): TableBuilder {
    this.fields.push({
      name,
      type: 'vector',
      is_nullable: options.nullable ?? true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      description: options.description,
      vector_dimension: dimension,
      alignment: 'left',
      field_order: this.fields.length + 1,
    });
    return this;
  }

  /**
   * Add a custom field
   */
  addField(field: FieldDefinition): TableBuilder {
    this.fields.push({
      ...field,
      field_order: field.field_order || this.fields.length + 1,
    });
    return this;
  }

  /**
   * Remove a field by name
   */
  removeField(name: string): TableBuilder {
    this.fields = this.fields.filter((field) => field.name !== name);
    // Reorder remaining fields
    this.fields.forEach((field, index) => {
      field.field_order = index + 1;
    });
    return this;
  }

  /**
   * Get current fields
   */
  getFields(): FieldDefinition[] {
    return [...this.fields];
  }

  /**
   * Get current table name
   */
  getName(): string {
    return this.tableName;
  }

  /**
   * Get current description
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Build the table request object
   */
  build(): TableCreateRequest {
    if (!this.tableName) {
      throw new ValidationError('Table name is required', [
        { field: 'name', message: 'Table name cannot be empty' },
      ]);
    }

    if (this.fields.length === 0) {
      throw new ValidationError('At least one field is required', [
        { field: 'fields', message: 'Table must have at least one field' },
      ]);
    }

    return {
      name: this.tableName,
      description: this.description,
      fields: this.fields,
    };
  }

  /**
   * Build and create the table (requires API client)
   */
  async create(
    options: { is_ai_generated_schema?: boolean; is_template?: boolean } = {}
  ): Promise<BolticSuccessResponse<TableCreateResponse> | BolticErrorResponse> {
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
