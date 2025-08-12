/**
 * Filter structure according to Tables Module PRD
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
 * Supported filter operators according to PRD Filter Structure
 */
export const FILTER_OPERATORS = {
  EQUALS: '=',
  NOT_EQUALS: '!=',
  GREATER_THAN: '>',
  GREATER_THAN_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_EQUAL: '<=',
  LIKE: 'like',
  NOT_LIKE: 'not like',
  IN: 'in',
  NOT_IN: 'not in',
  BETWEEN: 'between',
  IS_NULL: 'is null',
  IS_NOT_NULL: 'is not null',
} as const;

/**
 * Map SDK where clause operators to API filter operators
 */
const OPERATOR_MAPPING: Record<string, string> = {
  $eq: FILTER_OPERATORS.EQUALS,
  $ne: FILTER_OPERATORS.NOT_EQUALS,
  $gt: FILTER_OPERATORS.GREATER_THAN,
  $gte: FILTER_OPERATORS.GREATER_THAN_EQUAL,
  $lt: FILTER_OPERATORS.LESS_THAN,
  $lte: FILTER_OPERATORS.LESS_THAN_EQUAL,
  $like: FILTER_OPERATORS.LIKE,
  $notLike: FILTER_OPERATORS.NOT_LIKE,
  $in: FILTER_OPERATORS.IN,
  $notIn: FILTER_OPERATORS.NOT_IN,
  $between: FILTER_OPERATORS.BETWEEN,
  $isNull: FILTER_OPERATORS.IS_NULL,
  $isNotNull: FILTER_OPERATORS.IS_NOT_NULL,
};

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
      filters.push({
        field,
        operator: FILTER_OPERATORS.EQUALS,
        values: [condition],
      });
      return;
    }

    Object.entries(condition).forEach(([operator, value]) => {
      const apiOperator = OPERATOR_MAPPING[operator];
      if (!apiOperator) {
        throw new Error(`Unsupported operator: ${operator}`);
      }

      let values: unknown[];

      if (
        operator === '$between' &&
        Array.isArray(value) &&
        value.length === 2
      ) {
        values = value;
      } else if (operator === '$in' && Array.isArray(value)) {
        values = value;
      } else if (operator === '$notIn' && Array.isArray(value)) {
        values = value;
      } else if (operator === '$isNull' || operator === '$isNotNull') {
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
 * Build API filters with validation
 */
export function buildApiFilters(where: WhereCondition): ApiFilter[] {
  const filters = mapWhereToFilters(where);
  return filters;
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
    } else if (sdkOperator === '$in' || sdkOperator === '$notIn') {
      fieldCondition[sdkOperator] = filter.values;
    } else if (sdkOperator === '$isNull' || sdkOperator === '$isNotNull') {
      fieldCondition[sdkOperator] = true;
    } else {
      fieldCondition[sdkOperator] = filter.values[0];
    }
  });

  return where;
}
