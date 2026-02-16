/**
 * JSON Flattener Utility
 * Converts nested JSON objects into flat dot-notation paths
 * Used to extract fields available in webhook payloads
 */

export interface FlatField {
  path: string;        // e.g., "issue.title", "user.email.address"
  value: any;          // The actual value at this path
  type: string;        // e.g., "string", "number", "boolean", "object", "array"
  displayName: string; // Human-readable name: "issue.title" → "Issue Title"
}

/**
 * Flattens a nested JSON object into an array of dot-path fields
 * @param obj - The JSON object to flatten
 * @param prefix - Current path prefix (used internally for recursion)
 * @param maxDepth - Maximum nesting depth to prevent infinite recursion
 * @returns Array of FlatField objects
 */
export const flattenObject = (
  obj: any,
  prefix = "",
  maxDepth = 5
): FlatField[] => {
  const fields: FlatField[] = [];

  if (maxDepth === 0 || obj === null || typeof obj !== "object") {
    return fields;
  }

  if (Array.isArray(obj)) {
    // For arrays, show the first item's structure
    if (obj.length > 0 && typeof obj[0] === "object") {
      const nestedFields = flattenObject(obj[0], `${prefix}[0]`, maxDepth - 1);
      fields.push(...nestedFields);
    }
    // Also add the array itself
    fields.push({
      path: prefix,
      value: obj,
      type: "array",
      displayName: formatDisplayName(prefix)
    });
  } else {
    // For objects, recurse into each property
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newPath = prefix ? `${prefix}.${key}` : key;
        const type = getTypeOf(value);

        // Add the field itself
        fields.push({
          path: newPath,
          value: value,
          type: type,
          displayName: formatDisplayName(newPath)
        });

        // Recurse into nested objects and arrays
        if (typeof value === "object" && value !== null) {
          const nestedFields = flattenObject(value, newPath, maxDepth - 1);
          fields.push(...nestedFields);
        }
      }
    }
  }

  return fields;
};

/**
 * Gets the JavaScript type of a value in a readable format
 */
const getTypeOf = (value: any): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

/**
 * Converts dot-notation path to human-readable display name
 * "/issue.title" → "Issue Title"
 */
const formatDisplayName = (path: string): string => {
  return path
    .split(".")
    .map((part) =>
      part
        .replace(/\[0\]/g, "")
        .split(/(?=[A-Z])/)
        .join(" ")
        .toLowerCase()
        .replace(/^./, (char) => char.toUpperCase())
    )
    .join(" > ");
};

/**
 * Extracts unique root-level field groups from flattened fields
 * Useful for categorizing fields (e.g., "issue.*", "user.*")
 */
export const groupFieldsByRoot = (fields: FlatField[]): Map<string, FlatField[]> => {
  const groups = new Map<string, FlatField[]>();

  for (const field of fields) {
    const rootKey = field.path.split(".")[0];
    if (!groups.has(rootKey)) {
      groups.set(rootKey, []);
    }
    groups.get(rootKey)!.push(field);
  }

  return groups;
};

/**
 * Filters fields to only include primitive types (for template placeholders)
 */
export const getPrimitiveFields = (fields: FlatField[]): FlatField[] => {
  return fields.filter((field) =>
    ["string", "number", "boolean", "null"].includes(field.type)
  );
};
