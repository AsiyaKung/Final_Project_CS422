// Server-safe sanitisation using isomorphic-dompurify.
// Strips HTML/script tags and XSS vectors from user-supplied strings.
import DOMPurify from "isomorphic-dompurify";

/**
 * Strip all HTML tags and attributes.
 * Use for any user-supplied text that will be rendered or stored.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitise every string value in a plain object (one level deep).
 * Non-string values are preserved as-is.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === "string" ? sanitize(value) : value;
  }
  return result as T;
}
