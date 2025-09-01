/**
 * Common utility functions for the Boltic SDK
 */

/**
 * Filters an object to only include specified fields
 * @param obj - The object to filter
 * @param fields - Array of field names to include. If empty or undefined, returns the original object
 * @returns Filtered object with only the specified fields
 */
export function filterObjectFields<T extends Record<string, unknown>>(
  obj: T,
  fields?: string[]
): Partial<T> {
  // If no fields specified or empty array, return original object
  if (!fields || fields.length === 0) {
    return obj;
  }

  // Filter the object to only include specified fields
  const filtered: Partial<T> = {};
  for (const field of fields) {
    if (field in obj) {
      (filtered as Record<string, unknown>)[field] = obj[field];
    }
  }

  return filtered;
}

/**
 * Filters an array of objects to only include specified fields
 * @param arr - Array of objects to filter
 * @param fields - Array of field names to include. If empty or undefined, returns the original array
 * @returns Array of filtered objects with only the specified fields
 */
export function filterArrayFields<T extends Record<string, unknown>>(
  arr: T[],
  fields?: string[]
): Partial<T>[] {
  // If no fields specified or empty array, return original array
  if (!fields || fields.length === 0) {
    return arr;
  }

  // Filter each object in the array
  return arr.map((obj) => filterObjectFields(obj, fields));
}
