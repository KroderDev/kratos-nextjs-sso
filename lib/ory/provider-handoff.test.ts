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
      lang: "es",
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
  });
});
