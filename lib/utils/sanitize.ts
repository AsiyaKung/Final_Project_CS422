// Server-safe sanitisation – strips HTML tags and common XSS vectors
// using regex (no jsdom/dompurify dependency which breaks on Vercel serverless).

/**
 * Strip all HTML tags and trim whitespace.
 * Sufficient for plain-text fields (titles, descriptions, names).
 */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/<[^>]*>/g, "") // second pass after entity decode
    .trim();
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
