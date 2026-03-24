import { SCHEMA_TYPE_MAPPING } from '../constants';
import type {
  FormField,
  IntegrationFormJsonSchema,
  JsonSchemaProperty,
} from '../types/workflow';

const FORM_META_FIELDS = new Set(['resource', 'operation']);

function getSchemaMapping(displayType: string): {
  type: string;
  fallback_value: unknown;
} {
  return (
    (SCHEMA_TYPE_MAPPING as Record<string, { type: string; fallback_value: unknown }>)[displayType] ?? {
      type: 'string',
      fallback_value: '',
    }
  );
}

/**
 * Transform raw form fields into a flat JSON object with default/fallback
 * values for each field.
 *
 * Fields like `secret`, `resource`, and `operation` are skipped by default
 * since they are already handled by the SDK parameters.
 */
export function transformFormToDefaults(
  fields: FormField[],
  skipFields: Set<string> = FORM_META_FIELDS
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (skipFields.has(field.name)) continue;

    const displayType = field.meta?.displayType || 'text';
    const mapping = getSchemaMapping(displayType);

    result[field.name] =
      field.meta?.value !== undefined
        ? field.meta.value
        : mapping.fallback_value;
  }

  return result;
}

/**
 * Transform raw form fields into a JSON Schema object describing the
 * expected input shape.
 *
 * Fields like `secret`, `resource`, and `operation` are skipped by default
 * since they are already handled by the SDK parameters.
 */
export function transformFormToJsonSchema(
  fields: FormField[],
  skipFields: Set<string> = FORM_META_FIELDS
): IntegrationFormJsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};

  for (const field of fields) {
    if (skipFields.has(field.name)) continue;

    const displayType = field.meta?.displayType || 'text';
    const mapping = getSchemaMapping(displayType);
    const isRequired = field.meta?.validation?.required ?? false;
    const defaultValue =
      field.meta?.value !== undefined
        ? field.meta.value
        : mapping.fallback_value;

    const prop: JsonSchemaProperty = {
      type: mapping.type,
      required: isRequired,
      default: defaultValue,
    };

    if (field.meta?.description) {
      prop.description = field.meta.description;
    }

    if (
      field.meta?.options &&
      Array.isArray(field.meta.options) &&
      field.meta.options.length > 0
    ) {
      prop.enum = field.meta.options.map((opt) => opt.value);
    }

    properties[field.name] = prop;
  }

  return { type: 'object', properties };
}
