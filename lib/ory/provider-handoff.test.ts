import { describe, expect, it, vi } from "vitest";

vi.mock("@/ory.config", () => ({
  appBaseUrl: "https://sso.example.com",
  orySdkUrl: "https://auth.example.com",
}));

import {
  consentHandoff,
  isProviderHandoff,
  providerLoginParams,
} from "./provider-handoff";

describe("provider handoff", () => {
  it("turns a login handoff into a fresh flow with a bound provider callback", () => {
    const params = {
      flow: "login",
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/login/callback",
      lang: "es",
    };

    const result = providerLoginParams(params);

    expect(isProviderHandoff(params)).toBe(true);
    expect(result).toEqual({
      aal: "aal2",
      lang: "es",
      return_to:
        "https://auth.example.com/login/callback?transaction=transaction-id&csrf=csrf-token",
    });
  });

  it("accepts matching provider credentials nested in return_to", () => {
    const result = providerLoginParams({
      flow: "login",
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to:
        "https://auth.example.com/login/callback?csrf=csrf-token&flow=login&transaction=transaction-id",
    });

    expect(result).toEqual({
      aal: "aal2",
      return_to:
        "https://auth.example.com/login/callback?transaction=transaction-id&csrf=csrf-token",
    });
  });

  it("preserves consent state in an internal callback after authentication", () => {
    const result = providerLoginParams({
      flow: "consent",
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/consent",
      client_name: "Grafana",
      scope: "openid profile email",
      skip_consent: "true",
      lang: "es",
    });

    expect(result?.flow).toBeUndefined();
    const returnTo = new URL(String(result?.return_to));
    expect(returnTo.origin).toBe("https://sso.example.com");
    expect(returnTo.pathname).toBe("/auth/consent");
    expect(returnTo.searchParams.get("provider_return_to")).toBe(
      "https://auth.example.com/consent",
    );
    expect(returnTo.searchParams.get("transaction")).toBe("transaction-id");
    expect(returnTo.searchParams.get("csrf")).toBe("csrf-token");
    expect(returnTo.searchParams.get("scope")).toBe("openid profile email");
    expect(returnTo.searchParams.get("skip_consent")).toBe("true");
    expect(returnTo.searchParams.get("lang")).toBe("es");
  });

  it("parses a consent callback without trusting a different origin", () => {
    const params = {
      provider_return_to: "https://auth.example.com/consent",
      transaction: "transaction-id",
      csrf: "csrf-token",
      client_name: "Grafana",
      scope: "openid profile",
    };

    expect(consentHandoff(params)).toMatchObject({
      clientName: "Grafana",
      providerReturnTo: "https://auth.example.com/consent",
      scopes: ["openid", "profile"],
      transaction: "transaction-id",
    });
    expect(
      consentHandoff({ ...params, provider_return_to: "https://attacker.example/consent" }),
    ).toBeNull();
  });

  it("normalizes matching nested consent credentials", () => {
    const result = consentHandoff({
      provider_return_to:
        "https://auth.example.com/consent?csrf=csrf-token&flow=consent&transaction=transaction-id",
      transaction: "transaction-id",
      csrf: "csrf-token",
    });

    expect(result?.providerReturnTo).toBe("https://auth.example.com/consent");
  });

  it("rejects malformed provider handoffs", () => {
    expect(
      providerLoginParams({
        flow: "login",
        transaction: "transaction-id",
        csrf: "csrf-token",
        return_to: "https://attacker.example/login/callback",
      }),
    ).toBeNull();
    expect(providerLoginParams({ flow: "login" })).toBeNull();
    expect(providerLoginParams({ flow: "logout" })).toBeNull();
    expect(isProviderHandoff({ flow: "some-kratos-flow-id" })).toBe(false);

    const base = {
      flow: "login",
      transaction: "transaction-id",
      csrf: "csrf-token",
    };

    expect(
      providerLoginParams({ ...base, return_to: "https://auth.example.com/login/callback?next=/x" }),
    ).toBeNull();

    expect(
      providerLoginParams({
        ...base,
        return_to:
          "https://auth.example.com/login/callback?csrf=other-token&flow=login&transaction=transaction-id",
      }),
    ).toBeNull();

    expect(
      providerLoginParams({ ...base, return_to: "https://auth.example.com/login/callback#x" }),
    ).toBeNull();

    expect(
      providerLoginParams({ ...base, return_to: "https://u:p@auth.example.com/login/callback" }),
    ).toBeNull();

    expect(
      providerLoginParams({ ...base, return_to: "https://auth.example.com/consent" }),
    ).toBeNull();

    expect(
      providerLoginParams({
        ...base,
        return_to: "https://auth.example.com/login/callback",
        client_name: "Graf\x00ana",
      }),
    ).toBeNull();

    expect(
      providerLoginParams({
        ...base,
        return_to: "https://auth.example.com/login/callback",
        client_name: "a".repeat(257),
      }),
    ).toBeNull();

    expect(
      providerLoginParams({ ...base, return_to: "https://auth.example.com/" + "x".repeat(2036) }),
    ).toBeNull();

    expect(
      providerLoginParams({ ...base, return_to: "://unparseable" }),
    ).toBeNull();
  });

  it("passes through non-handoff params unchanged", () => {
    const params = { flow: "some-kratos-flow-id", lang: "en" };
    expect(providerLoginParams(params)).toBe(params);
  });

  it("rejects consent handoff with invalid opaque values", () => {
    expect(consentHandoff({})).toBeNull();

    expect(
      consentHandoff({
        provider_return_to: "https://auth.example.com/consent",
        transaction: "!invalid!",
        csrf: "csrf-token",
      }),
    ).toBeNull();

    expect(
      consentHandoff({
        provider_return_to: "https://auth.example.com/consent",
        transaction: "",
        csrf: "csrf-token",
      }),
    ).toBeNull();
  });

  it("rejects consent handoff with dangerous client name or scope", () => {
    const base = {
      provider_return_to: "https://auth.example.com/consent",
      transaction: "transaction-id",
      csrf: "csrf-token",
    };

    expect(
      consentHandoff({ ...base, client_name: "\x00Bad" }),
    ).toBeNull();

    expect(
      consentHandoff({ ...base, client_name: "a".repeat(257) }),
    ).toBeNull();

    expect(
      consentHandoff({ ...base, scope: "a".repeat(2049) }),
    ).toBeNull();

    expect(
      consentHandoff({ ...base, scope: "openid profile \x7Fbad" }),
    ).toBeNull();
  });

  it("parses consent handoff without optional fields", () => {
    const params = {
      provider_return_to: "https://auth.example.com/consent",
      transaction: "transaction-id",
      csrf: "csrf-token",
    };

    const result = consentHandoff(params);
    expect(result).not.toBeNull();
    expect(result?.clientName).toBe("");
    expect(result?.scopes).toEqual([]);
    expect(result?.skipConsent).toBe(false);
    expect(result?.locale).toBeUndefined();
  });

  it("rejects consent login handoff with bad scope", () => {
    expect(
      providerLoginParams({
        flow: "consent",
        transaction: "transaction-id",
        csrf: "csrf-token",
        return_to: "https://auth.example.com/consent",
        scope: "a".repeat(2049),
      }),
    ).toBeNull();
  });

  it("covers provider origin catch when SDK URL is invalid", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://sso.example.com",
      orySdkUrl: "",
    }));
    const mod = await import("./provider-handoff");

    expect(
      mod.providerLoginParams({
        flow: "login",
        transaction: "transaction-id",
        csrf: "csrf-token",
        return_to: "https://auth.example.com/login/callback",
      }),
    ).toBeNull();
  });

  it("handles single-element array query params", () => {
    const result = providerLoginParams({
      flow: ["login"],
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/login/callback",
    });

    expect(result).not.toBeNull();
    expect(result?.return_to).toContain("transaction-id");
  });

  it("rejects multi-element array query params by treating them as non-handoff", () => {
    const params: Record<string, string | string[]> = {
      flow: ["login", "consent"],
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/login/callback",
    };

    expect(providerLoginParams(params)).toBe(params);
  });

  it("handles login handoff without locale", () => {
    const result = providerLoginParams({
      flow: "login",
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/login/callback",
    });

    expect(result).not.toBeNull();
    expect(result?.lang).toBeUndefined();
  });

  it("falls back to relative consent URL when appBaseUrl is not set", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "",
      orySdkUrl: "https://auth.example.com",
    }));
    const mod = await import("./provider-handoff");

    const result = mod.providerLoginParams({
      flow: "consent",
      transaction: "transaction-id",
      csrf: "csrf-token",
      return_to: "https://auth.example.com/consent",
    });

    expect(result?.return_to).toMatch(/^\/auth\/consent\?/);
  });
});
