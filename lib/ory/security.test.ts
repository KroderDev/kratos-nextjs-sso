import { describe, expect, it } from "vitest";

import { allowedOryOrigins, isSafeFlowAction, isSafeProviderUrl } from "./security";

const origins = allowedOryOrigins([
  "https://app.example.com",
  "https://project.oryapis.com",
]);

describe("provider URL security", () => {
  it("allows relative URLs and configured origins", () => {
    expect(isSafeProviderUrl("/self-service/login", origins)).toBe(true);
    expect(isSafeProviderUrl("https://project.oryapis.com/self-service/login", origins)).toBe(true);
  });

  it("rejects dangerous schemes and protocol-relative URLs", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "//attacker.example/login",
      "https://user:pass@project.oryapis.com/login",
    ]) {
      expect(isSafeProviderUrl(value, origins)).toBe(false);
    }
  });

  it("rejects unapproved absolute form actions", () => {
    expect(isSafeFlowAction("https://attacker.example/collect", origins)).toBe(false);
    expect(isSafeFlowAction("https://project.oryapis.com/self-service/login", origins)).toBe(true);
  });

  it("rejects URLs with null-byte username injection", () => {
    // null byte allows injecting an @ to make the URL appear to be
    // the allowed origin while the browser connects to a different host.
    expect(
      isSafeProviderUrl(
        "https://project.oryapis.com%00@evil.com/login",
        origins,
      ),
    ).toBe(false);
    expect(
      isSafeProviderUrl(
        "https://project.oryapis.com\u0000@evil.com/login",
        origins,
      ),
    ).toBe(false);
  });

  it("rejects URLs with newline-based host bypass", () => {
    // Embedded newlines can split the hostname in some parsers,
    // directing the request to an attacker-controlled host.
    expect(
      isSafeProviderUrl(
        "https://project.oryapis.com\n@evil.com/login",
        origins,
      ),
    ).toBe(false);
    expect(
      isSafeProviderUrl(
        "https://project.oryapis.com\r@evil.com/login",
        origins,
      ),
    ).toBe(false);
    expect(
      isSafeProviderUrl(
        "https://project.oryapis.com\r\nevil.com/login",
        origins,
      ),
    ).toBe(false);
  });

  it("rejects URLs with Cyrillic homoglyph domains", () => {
    // Cyrillic 'о' (U+043E) visually matches Latin 'o' but is a
    // different Unicode codepoint. Punycode codepoint differences
    // should not be accepted as matching the ASCII allowed origin.
    expect(
      isSafeProviderUrl(
        "https://project.\u043Eryapis.com/login",
        origins,
      ),
    ).toBe(false);
  });
});
