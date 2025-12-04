// Utility functions to transform data between camelCase and snake_case

// Convert camelCase keys to snake_case
export const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        transformed[snakeKey] = toSnakeCase(obj[key]);
      }
    }
    return transformed;
  }

  return obj;
};

// Convert snake_case keys to camelCase
export const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = toCamelCase(obj[key]);
      }
    }
    return transformed;
  }

  return obj;
};