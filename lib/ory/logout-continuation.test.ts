import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({
  appBaseUrl: "https://sso.example",
  oryProviderOrigin: "https://provider.example" as string | undefined,
  orySdkUrl: "https://provider.example",
}));

vi.mock("@/ory.config", () => mockConfig);

import {
  consumeLogoutContinuation,
  createLogoutContinuationToken,
  formatClearLogoutContinuationCookie,
  formatLogoutContinuationCookie,
  isSecureOrigin,
  LOGOUT_COMPLETE_PATH,
  LOGOUT_CONTINUATION_COOKIE,
  LOGOUT_CONTINUATION_TTL_SECONDS,
  resetConsumedLogoutContinuationsForTests,
  verifyLogoutContinuationToken,
} from "./logout-continuation";

describe("logout continuation token", () => {
  const now = 1_700_000_000_000;
  const baseHandoff = {
    csrf: "csrf-demo-1",
    providerReturnTo: "https://provider.example/logout",
    transaction: "txn-demo-1",
  };

  beforeEach(() => {
    mockConfig.appBaseUrl = "https://sso.example";
    mockConfig.oryProviderOrigin = "https://provider.example";
    mockConfig.orySdkUrl = "https://provider.example";
    resetConsumedLogoutContinuationsForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and verifies a signed short-lived continuation token", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(
      { ...baseHandoff, locale: "es" },
      now,
    );

    expect(token).toBeTruthy();

    const verified = verifyLogoutContinuationToken(token ?? undefined, {
      nowMs: now + 10_000,
    });

    expect(verified).toMatchObject({
      csrf: "csrf-demo-1",
      locale: "es",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-1",
    });
    expect(verified?.exp).toBe(Math.floor(now / 1000) + LOGOUT_CONTINUATION_TTL_SECONDS);
  });

  it("rejects untrusted handoffs when creating a continuation token", () => {
    expect(
      createLogoutContinuationToken({
        ...baseHandoff,
        providerReturnTo: "https://attacker.example/logout",
      }),
    ).toBeNull();
    expect(
      createLogoutContinuationToken({
        ...baseHandoff,
        providerReturnTo: "https://provider.example/other",
      }),
    ).toBeNull();
    expect(
      createLogoutContinuationToken({
        ...baseHandoff,
        transaction: "bad token!",
      }),
    ).toBeNull();
  });

  it("rejects missing, malformed, tampered, and forged tokens", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;
    const [payload, signature] = token.split(".");

    expect(verifyLogoutContinuationToken(undefined, { nowMs: now })).toBeNull();
    expect(verifyLogoutContinuationToken("", { nowMs: now })).toBeNull();
    expect(verifyLogoutContinuationToken("not-a-token", { nowMs: now })).toBeNull();
    expect(verifyLogoutContinuationToken(`${payload}.${signature}.extra`, { nowMs: now })).toBeNull();
    expect(verifyLogoutContinuationToken(`${"a".repeat(2049)}.sig`, { nowMs: now })).toBeNull();
    expect(verifyLogoutContinuationToken(`${payload}.short`, { nowMs: now })).toBeNull();

    // Tamper with signature
    const badSig =
      (signature[0] === "a" ? "b" : "a") + signature.slice(1);
    expect(
      verifyLogoutContinuationToken(`${payload}.${badSig}`, { nowMs: now }),
    ).toBeNull();

    // Tamper with payload while keeping signature
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    parsed.r = "https://attacker.example/logout";
    const tamperedPayload = Buffer.from(JSON.stringify(parsed), "utf8").toString(
      "base64url",
    );
    expect(
      verifyLogoutContinuationToken(`${tamperedPayload}.${signature}`, { nowMs: now }),
    ).toBeNull();
  });

  describe("signed v1 fixtures", () => {
    const secret = "unit-test-only-continuation-secret";
    const iat = Math.floor(now / 1000);
    const fixture = {
      v: 1,
      jti: "continuation-fixture-id",
      t: baseHandoff.transaction,
      c: baseHandoff.csrf,
      r: baseHandoff.providerReturnTo,
      iat,
      exp: iat + 300,
    };

    function signFixture(json: string) {
      const encoded = Buffer.from(json).toString("base64url");
      const key = createHmac("sha256", secret)
        .update("kratos-nextjs-sso:logout-continuation:v1")
        .digest();
      const signature = createHmac("sha256", key).update(`v1.${encoded}`).digest("base64url");
      return `${encoded}.${signature}`;
    }

    beforeEach(() => {
      vi.stubEnv("ORY_LOGOUT_CONTINUATION_SECRET", secret);
    });

    it("accepts an existing well-formed v1 continuation within the allowed clock skew", () => {
      const valid = signFixture(JSON.stringify({ ...fixture, l: "en" }));
      expect(verifyLogoutContinuationToken(valid, { nowMs: now - 30_000 })).toMatchObject({
        ...baseHandoff,
        jti: fixture.jti,
        locale: "en",
      });
    });

    it.each([
      ["unsupported version", { v: 2 }],
      ["non-string JTI", { jti: 12 }],
      ["short JTI", { jti: "short" }],
      ["long JTI", { jti: "a".repeat(65) }],
      ["invalid JTI alphabet", { jti: "not a valid fixture id" }],
      ["missing transaction", { t: undefined }],
      ["missing CSRF", { c: undefined }],
      ["missing destination", { r: undefined }],
      ["unsupported locale", { l: "fr" }],
      ["string issued time", { iat: String(iat) }],
      ["string expiry", { exp: String(iat + 300) }],
      ["fractional issued time", { iat: iat + 0.5 }],
      ["fractional expiry", { exp: iat + 299.5 }],
      ["empty lifetime", { exp: iat }],
      ["excessive lifetime", { exp: iat + 301 }],
    ])("rejects a signed continuation with %s", (_label, fields) => {
      const token = signFixture(JSON.stringify({ ...fixture, ...fields }));
      expect(verifyLogoutContinuationToken(token, { nowMs: now })).toBeNull();
    });

    it.each(["{", "null", '"fixture"'])("rejects signed non-object JSON %s", (json) => {
      expect(verifyLogoutContinuationToken(signFixture(json), { nowMs: now })).toBeNull();
    });
  });

  it("rejects expired or future-skewed tokens", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;

    expect(
      verifyLogoutContinuationToken(token, {
        nowMs: now + (LOGOUT_CONTINUATION_TTL_SECONDS + 1) * 1000,
      }),
    ).toBeNull();

    expect(
      verifyLogoutContinuationToken(token, {
        nowMs: now - 31_000,
      }),
    ).toBeNull();
  });

  it("prevents replay once a continuation token is consumed", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;

    const first = verifyLogoutContinuationToken(token, {
      nowMs: now + 1000,
    });
    expect(first).not.toBeNull();
    expect(consumeLogoutContinuation(first!, now + 1000)).toBe(true);
    expect(consumeLogoutContinuation(first!, now + 1000)).toBe(false);
    expect(
      verifyLogoutContinuationToken(token, {
        nowMs: now + 2000,
      }),
    ).toBeNull();
  });

  it("re-validates provider origin on verification", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;

    mockConfig.oryProviderOrigin = "https://other-provider.example";
    expect(verifyLogoutContinuationToken(token, { nowMs: now })).toBeNull();
  });

  it("uses existing ORY_PROJECT_API_TOKEN or optional ORY_LOGOUT_CONTINUATION_SECRET for signing", () => {
    const now = 1_700_000_000_000;
    vi.stubEnv("ORY_LOGOUT_CONTINUATION_SECRET", "");
    vi.stubEnv("ORY_PROJECT_API_TOKEN", "ory_pat_demo_secret_1");
    const token = createLogoutContinuationToken(baseHandoff, now)!;

    expect(verifyLogoutContinuationToken(token, { nowMs: now })).not.toBeNull();

    vi.stubEnv("ORY_PROJECT_API_TOKEN", "ory_pat_demo_secret_2");
    expect(verifyLogoutContinuationToken(token, { nowMs: now })).toBeNull();

    vi.stubEnv("ORY_LOGOUT_CONTINUATION_SECRET", "dedicated-demo-secret");
    const dedicatedToken = createLogoutContinuationToken(baseHandoff, now)!;
    vi.stubEnv("ORY_PROJECT_API_TOKEN", "rotated-api-token");
    expect(
      verifyLogoutContinuationToken(dedicatedToken, { nowMs: now }),
    ).not.toBeNull();

    vi.stubEnv("ORY_LOGOUT_CONTINUATION_SECRET", "other-dedicated-secret");
    expect(
      verifyLogoutContinuationToken(dedicatedToken, { nowMs: now }),
    ).toBeNull();
  });

  it("uses exclusive expiry for verification and consumption", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;
    const expiry = now + LOGOUT_CONTINUATION_TTL_SECONDS * 1000;
    const fresh = verifyLogoutContinuationToken(token, { nowMs: expiry - 1000 })!;
    expect(fresh).not.toBeNull();
    expect(verifyLogoutContinuationToken(token, { nowMs: expiry })).toBeNull();
    expect(consumeLogoutContinuation(fresh, expiry)).toBe(false);
    expect(consumeLogoutContinuation(fresh, expiry - 1000)).toBe(true);
  });

  it("preserves live replay records during verification and frees expired records before evicting at capacity", () => {
    const token = createLogoutContinuationToken(baseHandoff, now)!;
    const first = verifyLogoutContinuationToken(token, { nowMs: now })!;
    expect(consumeLogoutContinuation(first, now)).toBe(true);
    expect(consumeLogoutContinuation({ jti: "expiring", exp: first.iat + 1 }, now)).toBe(true);
    for (let i = 2; i < 10_000; i++) {
      expect(consumeLogoutContinuation({ jti: `fixture-${i}`, exp: first.exp }, now)).toBe(true);
    }
    const fresh = createLogoutContinuationToken(baseHandoff, now)!;
    expect(verifyLogoutContinuationToken(fresh, { nowMs: now })).not.toBeNull();
    expect(verifyLogoutContinuationToken(token, { nowMs: now })).toBeNull();

    const afterExpiry = now + 1_000;
    expect(consumeLogoutContinuation(verifyLogoutContinuationToken(fresh, { nowMs: afterExpiry })!, afterExpiry)).toBe(true);
    expect(verifyLogoutContinuationToken(token, { nowMs: afterExpiry })).toBeNull();

    const another = createLogoutContinuationToken(baseHandoff, now)!;
    expect(consumeLogoutContinuation(verifyLogoutContinuationToken(another, { nowMs: afterExpiry })!, afterExpiry)).toBe(true);
    const latest = verifyLogoutContinuationToken(another, { nowMs: afterExpiry });
    expect(latest).toBeNull();
  });

  it("formats browser-bound continuation and clear cookies correctly", () => {
    expect(isSecureOrigin("https://sso.example")).toBe(true);
    expect(isSecureOrigin("http://127.0.0.1:3000")).toBe(false);
    expect(isSecureOrigin("not-a-url")).toBe(false);
    expect(isSecureOrigin(undefined)).toBe(false);

    const setCookieHttps = formatLogoutContinuationCookie("tok.sig", true);
    expect(setCookieHttps).toBe(
      `${LOGOUT_CONTINUATION_COOKIE}=tok.sig; Max-Age=${LOGOUT_CONTINUATION_TTL_SECONDS}; Path=${LOGOUT_COMPLETE_PATH}; HttpOnly; SameSite=Lax; Secure`,
    );

    const setCookieHttp = formatLogoutContinuationCookie("tok.sig", false);
    expect(setCookieHttp).not.toContain("Secure");
    expect(setCookieHttp).toContain("HttpOnly");
    expect(setCookieHttp).toContain("SameSite=Lax");
    expect(setCookieHttp).toContain(`Path=${LOGOUT_COMPLETE_PATH}`);

    const clearCookieHttps = formatClearLogoutContinuationCookie(true);
    expect(clearCookieHttps).toContain(`${LOGOUT_CONTINUATION_COOKIE}=; Max-Age=0`);
    expect(clearCookieHttps).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(clearCookieHttps).toContain(`Path=${LOGOUT_COMPLETE_PATH}`);
    expect(clearCookieHttps).toContain("HttpOnly");
    expect(clearCookieHttps).toContain("SameSite=Lax");
    expect(clearCookieHttps).toContain("Secure");
  });
});
