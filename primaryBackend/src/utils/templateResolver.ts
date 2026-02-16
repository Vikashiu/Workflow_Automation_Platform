/**
 * Template Resolver Utility
 * Safely resolves {{dot.path}} placeholders in template strings
 * Used at execution time to fill templates with actual payload data
 */

export interface TemplateResolveOptions {
  throwOnMissing?: boolean;    // If true, throw when field missing; if false, use empty string
  defaultValue?: any;          // Default value for missing fields
}

/**
 * Safely resolves template strings with actual payload data
 * 
 * @param templateString - Template with {{dot.path}} placeholders
 * @param payload - The actual data object (webhook payload, previous action results)
 * @param options - Resolution options
 * @returns Resolved string with placeholders replaced
 * 
 * @example
 * const template = "Issue {{issue.number}}: {{issue.title}} assigned to {{user.email}}";
 * const payload = {
 *   issue: { number: 42, title: "Fix bug" },
 *   user: { email: "dev@example.com" }
 * };
 * // Returns: "Issue 42: Fix bug assigned to dev@example.com"
 * 
 * @example
 * // Missing fields are replaced with empty string by default
 * const template = "Status: {{status}} - Error: {{error}}";
 * const payload = { status: "failed" };
 * // Returns: "Status: failed - Error: "
 */
export const resolveTemplate = (
  templateString: string,
  payload: Record<string, any>,
  options: TemplateResolveOptions = {}
): string => {
  if (!templateString || typeof templateString !== "string") {
    return String(templateString);
  }

  const { throwOnMissing = false, defaultValue = "" } = options;

  return templateString.replace(/{{\s*([\w.[\]]+)\s*}}/g, (_match, path) => {
    try {
      const value = getValueAtPath(payload, path);
      if (value === undefined) {
        if (throwOnMissing) {
          throw new Error(`Field not found in payload: ${path}`);
        }
        return String(defaultValue);
      }
      return String(value);
    } catch (error) {
      // Handle errors gracefully
      console.warn(`Failed to resolve template placeholder {{${path}}}:`, error);
      if (throwOnMissing) {
        throw error;
      }
      return String(defaultValue);
    }
  });
};

/**
 * Gets a value from a nested object using dot notation
 * Supports both object notation (issue.title) and array notation (items[0].name)
 * 
 * @param obj - The object to traverse
 * @param path - Dot-notation path (e.g., "issue.title", "items[0].name")
 * @returns The value at the path, or undefined if not found
 */
export const getValueAtPath = (obj: any, path: string): any => {
  if (!path) {
    return obj;
  }

  // Split path by dots and array brackets
  const pathParts = path
    .split(".")
    .flatMap((part) => part.split(/[\[\]]/).filter((p) => p !== ""));

  let current = obj;
  for (const part of pathParts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
};

/**
 * Validates that a template string contains only valid placeholders
 * and that values exist in the payload
 * 
 * @param templateString - Template to validate
 * @param payload - Payload to check against
 * @returns Object with validation result and missing fields
 */
export const validateTemplate = (
  templateString: string,
  payload: Record<string, any>
): { isValid: boolean; missingFields: string[] } => {
  if (!templateString || typeof templateString !== "string") {
    return { isValid: true, missingFields: [] };
  }

  const placeholderRegex = /{{\s*([\w.[\]]+)\s*}}/g;
  const missingFields: string[] = [];

  let match;
  while ((match = placeholderRegex.exec(templateString)) !== null) {
    const path = match[1];
    const value = getValueAtPath(payload, path);
    if (value === undefined) {
      missingFields.push(path);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Extracts all placeholder paths from a template string
 * 
 * @param templateString - Template to analyze
 * @returns Array of placeholder paths found
 * 
 * @example
 * extractPlaceholders("Send {{email}} to {{user.name}}")
 * // Returns: ["email", "user.name"]
 */
export const extractPlaceholders = (templateString: string): string[] => {
  if (!templateString || typeof templateString !== "string") {
    return [];
  }

  const placeholderRegex = /{{\s*([\w.[\]]+)\s*}}/g;
  const placeholders: string[] = [];

  let match;
  while ((match = placeholderRegex.exec(templateString)) !== null) {
    placeholders.push(match[1]);
  }

  return [...new Set(placeholders)]; // Return unique values
};

/**
 * Converts a value to string safely, handling null/undefined
 * 
 * @param value - The value to convert
 * @returns String representation
 */
export const valueToString = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};
