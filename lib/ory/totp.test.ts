import { describe, expect, it } from "vitest";

import { generateTotpCode } from "./totp";

describe("TOTP helpers", () => {
  it("generates the RFC 6238 SHA-1 test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(generateTotpCode(secret, 59_000)).toBe("287082");
    expect(generateTotpCode(secret, 1_111_111_109_000)).toBe("081804");
  });

  it("normalizes padded and lowercase base32 secrets", () => {
    expect(generateTotpCode("gez dgnbvgy3tqojqgez dgnbvgy3tqojq".replaceAll(" ", "") + "=", 59_000)).toBe("287082");
  });

  it("rejects invalid base32 secrets", () => {
    expect(() => generateTotpCode("not-valid!", 59_000)).toThrow("Invalid base32 character");
  });
});
