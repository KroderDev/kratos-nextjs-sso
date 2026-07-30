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
});
