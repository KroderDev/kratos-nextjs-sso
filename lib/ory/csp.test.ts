import { describe, expect, it } from "vitest";

import { getFormActionSources, getOAuthOrigins } from "./csp";

describe("getOAuthOrigins", () => {
  it("parses and deduplicates comma- or whitespace-separated origins", () => {
    expect(
      getOAuthOrigins(
        "https://accounts.google.com, https://github.com\nhttps://accounts.google.com",
      ),
    ).toEqual(["https://accounts.google.com", "https://github.com"]);
  });

  it("rejects unsafe, credential-bearing, and non-origin values", () => {
    expect(
      getOAuthOrigins(
        "javascript:alert(1) https://user:pass@example.com https://example.com/oauth https://example.com/?next=x",
      ),
    ).toEqual([]);
  });

  it("rejects wildcard hostnames", () => {
    expect(
      getOAuthOrigins("https://*.example.com https://*.subdomain.example.com"),
    ).toEqual([]);
  });

  it("allows valid origins while rejecting wildcard origins", () => {
    expect(
      getOAuthOrigins("https://accounts.google.com https://*.malicious.com https://github.com"),
    ).toEqual(["https://accounts.google.com", "https://github.com"]);
  });

  it("returns no origins when configuration is missing", () => {
    expect(getOAuthOrigins(undefined)).toEqual([]);
  });

  it("allows configured provider origins in form actions", () => {
    expect(
      getFormActionSources("https://ory.example.com", [
        "https://accounts.google.com",
        "https://github.com",
      ]),
    ).toBe(
      "'self' https://ory.example.com https://accounts.google.com https://github.com",
    );
  });

  it("does not allow providers that are absent from the configured origins", () => {
    const sources = getFormActionSources("https://ory.example.com", [
      "https://accounts.google.com",
    ]);

    expect(sources).toContain("https://accounts.google.com");
    expect(sources).not.toContain("https://attacker.example");
  });
});
