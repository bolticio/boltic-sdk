/**
 * Filter structure according to Tables Module PRD and backend buildWhereClause function
 */
export interface ApiFilter {
  field: string;
  operator: string;
  values: unknown[];
}

export interface WhereCondition {
  [field: string]: unknown;
}

/**
 * Comprehensive filter operators based on backend buildWhereClause function
 */
export const FILTER_OPERATORS = {
  // Relational operators
  EQUALS: '=',
  NOT_EQUALS: '!=',
  GREATER_THAN: '>',
  GREATER_THAN_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_EQUAL: '<=',

  // String operators
  LIKE: 'LIKE', // contains (case-sensitive)
  ILIKE: 'ILIKE', // contains (case-insensitive)
  STARTS_WITH: 'STARTS WITH',

  // Array/Set operators
  IN: 'IN', // is one of
  NOT_IN: 'NOT IN', // is not one of

  // Special operators
  IS_EMPTY: 'IS EMPTY',
  IS_NULL: 'IS NULL',
  IS_NOT_NULL: 'IS NOT NULL',
  BETWEEN: 'BETWEEN',

  // Dropdown/Array specific operators
  ARRAY_CONTAINS: '@>', // is exactly for dropdown
  ARRAY_NOT_CONTAINS: 'NOT @>', // is different from for dropdown
  ANY: 'ANY', // contains (case-sensitive) for dropdown
  IS_ONE_OF_ARRAY: 'IS ONE OF', // is one of for dropdown
  DROPDOWN_ITEM_STARTS_WITH: 'DROPDOWN ITEM STARTS WITH',

  // Date operators
  WITHIN: 'WITHIN', // date range operator
} as const;

/**
 * Map SDK where clause operators to API filter operators
 */
const OPERATOR_MAPPING: Record<string, string> = {
  // Basic comparisons
  $eq: FILTER_OPERATORS.EQUALS,
  $ne: FILTER_OPERATORS.NOT_EQUALS,
  $gt: FILTER_OPERATORS.GREATER_THAN,
  $gte: FILTER_OPERATORS.GREATER_THAN_EQUAL,
  $lt: FILTER_OPERATORS.LESS_THAN,
  $lte: FILTER_OPERATORS.LESS_THAN_EQUAL,

  // String operations
  $like: FILTER_OPERATORS.LIKE,
  $ilike: FILTER_OPERATORS.ILIKE,
  $startsWith: FILTER_OPERATORS.STARTS_WITH,

  // Array operations
  $in: FILTER_OPERATORS.IN,
  $notIn: FILTER_OPERATORS.NOT_IN,

  // Special operations
  $between: FILTER_OPERATORS.BETWEEN,
  $isEmpty: FILTER_OPERATORS.IS_EMPTY,
  $isNull: FILTER_OPERATORS.IS_NULL,
  $isNotNull: FILTER_OPERATORS.IS_NOT_NULL,

  // Array/dropdown operations
  $arrayContains: FILTER_OPERATORS.ARRAY_CONTAINS,
  $arrayNotContains: FILTER_OPERATORS.ARRAY_NOT_CONTAINS,
  $any: FILTER_OPERATORS.ANY,
  $isOneOfArray: FILTER_OPERATORS.IS_ONE_OF_ARRAY,
  $dropdownItemStartsWith: FILTER_OPERATORS.DROPDOWN_ITEM_STARTS_WITH,

  // Date operations
  $within: FILTER_OPERATORS.WITHIN,
};

/**
 * Convert direct filter array format to SDK format
 * This handles the case where filters are passed directly as an array
 */
export function normalizeFilters(
  filters: ApiFilter[] | Record<string, unknown>[] | WhereCondition
): ApiFilter[] {
  if (Array.isArray(filters)) {
    // Check if it's already ApiFilter format
    if (
      filters.length > 0 &&
      typeof filters[0] === 'object' &&
      'field' in filters[0] &&
      'operator' in filters[0] &&
      'values' in filters[0]
    ) {
      return filters as ApiFilter[];
    }
    // Handle legacy Record<string, unknown>[] format
    // For now, treat it as an empty array since this format is deprecated
    console.warn(
      'Legacy Record<string, unknown>[] filter format detected. Please migrate to the new filter format.'
    );
    return [];
  }
  return mapWhereToFilters(filters);
}

/**
 * Map SDK where clause to API filters format
 */
export function mapWhereToFilters(where: WhereCondition): ApiFilter[] {
  const filters: ApiFilter[] = [];

  Object.entries(where).forEach(([field, condition]) => {
    if (
      typeof condition !== 'object' ||
      Array.isArray(condition) ||
      condition === null
    ) {
      // Direct value comparison
      filters.push({
        field,
        operator: FILTER_OPERATORS.EQUALS,
        values: [condition],
      });
      return;
    }

    // Handle operator-based conditions
    Object.entries(condition).forEach(([operator, value]) => {
      const apiOperator = OPERATOR_MAPPING[operator];
      if (!apiOperator) {
        throw new Error(`Unsupported operator: ${operator}`);
      }

      let values: unknown[];

      // Handle different operator value formats
      if (
        apiOperator === FILTER_OPERATORS.BETWEEN &&
        Array.isArray(value) &&
        value.length === 2
      ) {
        values = value;
      } else if (
        (apiOperator === FILTER_OPERATORS.IN ||
          apiOperator === FILTER_OPERATORS.NOT_IN ||
          apiOperator === FILTER_OPERATORS.IS_ONE_OF_ARRAY) &&
        Array.isArray(value)
      ) {
        values = value;
      } else if (
        apiOperator === FILTER_OPERATORS.IS_NULL ||
        apiOperator === FILTER_OPERATORS.IS_NOT_NULL ||
        apiOperator === FILTER_OPERATORS.IS_EMPTY
      ) {
        values = [];
      } else {
        values = [value];
      }

      filters.push({
        field,
        operator: apiOperator,
        values,
      });
    });
  });

  return filters;
}

/**
 * Build API filters with validation based on backend buildWhereClause
 */
export function buildApiFilters(
  whereOrFilters: WhereCondition | ApiFilter[],
  whereOperator: 'AND' | 'OR' = 'AND'
): { filters: ApiFilter[]; whereOperator: string } {
  const filters = normalizeFilters(whereOrFilters);

  // Validate filters
  filters.forEach((filter, index) => {
    if (!filter.field) {
      throw new Error(`Filter at index ${index} missing required field`);
    }
    if (!filter.operator) {
      throw new Error(`Filter at index ${index} missing required operator`);
    }
    if (!Array.isArray(filter.values)) {
      throw new Error(`Filter at index ${index} values must be an array`);
    }
  });

  return {
    filters,
    whereOperator,
  };
}

/**
 * Convert API filters back to SDK where clause
 */
export function mapFiltersToWhere(filters: ApiFilter[]): WhereCondition {
  const where: WhereCondition = {};

  filters.forEach((filter) => {
    const reverseMapping: Record<string, string> = {};
    Object.entries(OPERATOR_MAPPING).forEach(([sdkOp, apiOp]) => {
      reverseMapping[apiOp] = sdkOp;
    });

    const sdkOperator = reverseMapping[filter.operator];
    if (!sdkOperator) {
      throw new Error(`Unsupported API operator: ${filter.operator}`);
    }

    if (!where[filter.field]) {
      where[filter.field] = {};
    }

    const fieldCondition = where[filter.field] as Record<string, unknown>;

    if (sdkOperator === '$between' && filter.values.length === 2) {
      fieldCondition[sdkOperator] = filter.values;
    } else if (
      sdkOperator === '$in' ||
      sdkOperator === '$notIn' ||
      sdkOperator === '$isOneOfArray'
    ) {
      fieldCondition[sdkOperator] = filter.values;
    } else if (
      sdkOperator === '$isNull' ||
      sdkOperator === '$isNotNull' ||
      sdkOperator === '$isEmpty'
    ) {
      fieldCondition[sdkOperator] = true;
    } else {
      fieldCondition[sdkOperator] = filter.values[0];
    }
  });

  return where;
}

/**
 * Validate filter values based on operator
 */
export function validateFilterValues(
  operator: string,
  values: unknown[]
): boolean {
  switch (operator) {
    case FILTER_OPERATORS.BETWEEN:
      return values.length === 2;
    case FILTER_OPERATORS.IS_NULL:
    case FILTER_OPERATORS.IS_NOT_NULL:
    case FILTER_OPERATORS.IS_EMPTY:
      return values.length === 0;
    case FILTER_OPERATORS.IN:
    case FILTER_OPERATORS.NOT_IN:
    case FILTER_OPERATORS.IS_ONE_OF_ARRAY:
      return values.length > 0;
    default:
      return values.length === 1;
  }
}

/**
 * Create filter helper for building complex filter conditions
 */
export class FilterBuilder {
  private filters: ApiFilter[] = [];

  equals(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.EQUALS,
      values: [value],
    });
    return this;
  }

  notEquals(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.NOT_EQUALS,
      values: [value],
    });
    return this;
  }

  greaterThan(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.GREATER_THAN,
      values: [value],
    });
    return this;
  }

  lessThan(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.LESS_THAN,
      values: [value],
    });
    return this;
  }

  between(field: string, start: unknown, end: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.BETWEEN,
      values: [start, end],
    });
    return this;
  }

  in(field: string, values: unknown[]): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.IN,
      values,
    });
    return this;
  }

  like(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.LIKE,
      values: [value],
    });
    return this;
  }

  startsWith(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.STARTS_WITH,
      values: [value],
    });
    return this;
  }

  isEmpty(field: string): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.IS_EMPTY,
      values: [],
    });
    return this;
  }

  isNull(field: string): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.IS_NULL,
      values: [],
    });
    return this;
  }

  arrayContains(field: string, value: unknown): FilterBuilder {
    this.filters.push({
      field,
      operator: FILTER_OPERATORS.ARRAY_CONTAINS,
      values: [value],
    });
    return this;
  }

  build(): ApiFilter[] {
    return [...this.filters];
  }

  clear(): FilterBuilder {
    this.filters = [];
    return this;
  }
}

/**
 * Helper function to create a new filter builder
 */
export function createFilter(): FilterBuilder {
  return new FilterBuilder();
}
