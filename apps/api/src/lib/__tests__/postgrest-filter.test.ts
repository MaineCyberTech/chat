import { describe, it, expect } from "vitest";
import {
  MAX_SEARCH_TERM_LENGTH,
  containsPattern,
  normalizeSearchTerm,
  quotePostgrestValue,
} from "../postgrest-filter.js";

describe("quotePostgrestValue", () => {
  it("wraps plain values in double quotes", () => {
    expect(quotePostgrestValue("%bob%")).toBe('"%bob%"');
  });

  it("keeps filter-syntax characters literal", () => {
    expect(quotePostgrestValue("%a,b(c).%")).toBe('"%a,b(c).%"');
  });

  it("escapes embedded double quotes and backslashes", () => {
    expect(quotePostgrestValue('he said "hi"\\')).toBe('"he said \\"hi\\"\\\\"');
  });
});

describe("normalizeSearchTerm", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeSearchTerm("  bob  ")).toBe("bob");
  });

  it("caps the length", () => {
    expect(normalizeSearchTerm("x".repeat(150))).toHaveLength(MAX_SEARCH_TERM_LENGTH);
  });
});

describe("containsPattern", () => {
  it("wraps the normalised term in wildcards", () => {
    expect(containsPattern("  bob  ")).toBe("%bob%");
  });
});
