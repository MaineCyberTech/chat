/**
 * Helpers for safely building PostgREST filter expressions from user input.
 *
 * PostgREST parses `,`, `(`, `)`, `.` and `"` as filter syntax inside `or()` /
 * `and()` expressions, so interpolating raw user input lets a caller widen or
 * otherwise alter the intended filter. Values that may contain those characters
 * must be double-quoted, with embedded backslashes and quotes escaped, so the
 * whole value is treated literally.
 *
 * See: https://postgrest.org/en/stable/references/api/tables_views.html#operators
 */

/** Maximum length accepted for a free-text search term. */
export const MAX_SEARCH_TERM_LENGTH = 100;

/**
 * Wraps a value in PostgREST's double-quote escaping so filter-syntax
 * characters (`,` `(` `)` `.` `"`) are treated as literal text.
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Normalises a user-provided search term: trims surrounding whitespace and
 * caps the length so callers cannot send unbounded filter values.
 */
export function normalizeSearchTerm(term: string): string {
  return term.trim().slice(0, MAX_SEARCH_TERM_LENGTH);
}

/**
 * Builds a case-insensitive "contains" pattern (`%term%`) for structured
 * `.ilike()` calls. Because the pattern is passed as a bound filter value it
 * cannot escape into the surrounding query.
 */
export function containsPattern(term: string): string {
  return `%${normalizeSearchTerm(term)}%`;
}
