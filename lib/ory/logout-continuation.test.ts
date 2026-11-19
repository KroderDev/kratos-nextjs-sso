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
      consume: false,
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
      consume: false,
      nowMs: now + 1000,
    });
    expect(first).not.toBeNull();
    expect(consumeLogoutContinuation(first!, now + 1000)).toBe(true);
    expect(consumeLogoutContinuation(first!, now + 1000)).toBe(false);
    expect(
      verifyLogoutContinuationToken(token, {
        consume: false,
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

  it("does not evict live replay records during read-only verification at capacity", () => {
    const now = 1_700_000_000_000;
    const token = createLogoutContinuationToken(baseHandoff, now)!;
    const first = verifyLogoutContinuationToken(token, { nowMs: now })!;
    expect(consumeLogoutContinuation(first, now)).toBe(true);
    for (let i = 1; i < 10_000; i++) {
      expect(consumeLogoutContinuation({ jti: `fixture-${i}`, exp: first.exp }, now)).toBe(true);
    }
    const fresh = createLogoutContinuationToken(baseHandoff, now)!;
    expect(verifyLogoutContinuationToken(fresh, { consume: false, nowMs: now })).not.toBeNull();
    expect(verifyLogoutContinuationToken(token, { consume: false, nowMs: now })).toBeNull();
    expect(consumeLogoutContinuation(first, now)).toBe(false);
    expect(verifyLogoutContinuationToken(token, { consume: true, nowMs: now })).toBeNull();
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
