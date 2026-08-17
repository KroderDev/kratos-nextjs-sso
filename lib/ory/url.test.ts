import { describe, expect, it, vi } from "vitest";

vi.mock("@/ory.config", () => ({
  appBaseUrl: "https://auth.example.com",
  oryCanonicalUrl: "https://ory.example.com",
  orySdkUrl: "http://127.0.0.1:4433",
}));

import {
  applicationUrl,
  rewriteOryFlow,
  rewriteOryResponseLocation,
  rewriteOryUrl,
  restoreOryProviderCallback,
} from "./url";

describe("Ory URL rewriting", () => {
  it("builds flow return URLs on the configured application origin", () => {
    expect(applicationUrl("/consent?transaction=txn-1")).toBe(
      "https://auth.example.com/consent?transaction=txn-1",
    );
  });

  it("rewrites local provider URLs to the configured public app origin", () => {
    expect(
      rewriteOryUrl("https://ory.example.com/login?flow=123"),
    ).toBe("https://auth.example.com/login?flow=123");
    expect(
      rewriteOryUrl("https://ory.example.com/self-service/login"),
    ).toBe("https://auth.example.com/self-service/login");
  });

  it("supports fallback origin override when appBaseUrl is unset", () => {
    expect(
      rewriteOryUrl("https://ory.example.com/login", "https://fallback.example.com"),
    ).toBe("https://fallback.example.com/login");
  });

  it("leaves unrelated origins and malformed URLs unchanged", () => {
    expect(rewriteOryUrl("https://attacker.example/login")).toBe(
      "https://attacker.example/login",
    );
    expect(rewriteOryUrl("not a URL")).toBe("not a URL");
  });

  it("returns provider callback value unchanged for invalid URLs", () => {
    expect(
      restoreOryProviderCallback(
        "not a valid url",
        "https://auth.example.com",
        "https://ory.example.com",
      ),
    ).toBe("not a valid url");
  });

  it("returns provider callback value unchanged when location origin differs", () => {
    expect(
      restoreOryProviderCallback(
        "https://other.example.com/login/callback?code=123",
        "https://auth.example.com",
        "https://ory.example.com",
      ),
    ).toBe("https://other.example.com/login/callback?code=123");
  });

  it("restores provider callbacks without rewriting internal application routes", () => {
    expect(
      restoreOryProviderCallback(
        "https://auth.example.com/auth/login/callback?transaction=opaque&csrf=token",
        "https://auth.example.com",
        "https://ory.example.com",
      ),
    ).toBe(
      "https://ory.example.com/login/callback?transaction=opaque&csrf=token",
    );
    expect(
      restoreOryProviderCallback(
        "https://auth.example.com/consent?transaction=opaque&csrf=token",
        "https://auth.example.com",
        "https://ory.example.com",
      ),
    ).toBe("https://ory.example.com/consent?transaction=opaque&csrf=token");
    expect(
      restoreOryProviderCallback(
        "https://auth.example.com/auth/consent?transaction=opaque&csrf=token",
        "https://auth.example.com",
        "https://ory.example.com",
      ),
    ).toBe("https://auth.example.com/auth/consent?transaction=opaque&csrf=token");
  });

  it("rewrites nested flow values without changing primitive non-string values", () => {
    const callbackUrl =
      "https://provider.example/login/callback?csrf=csrf-token&transaction=transaction-id&flow=login";
    const flow = {
      ui: {
        action: "https://ory.example.com/self-service/login",
        nodes: [{ attributes: { href: "https://ory.example.com/login", count: 42, active: true } }],
      },
      id: "flow-id",
      return_to: callbackUrl,
      count: 10,
      active: false,
      tags: ["tag1", "https://ory.example.com/login"],
    };

    expect(rewriteOryFlow(flow as never)).toEqual({
      ui: {
        action: "https://auth.example.com/self-service/login",
        nodes: [{ attributes: { href: "https://auth.example.com/login", count: 42, active: true } }],
      },
      id: "flow-id",
      return_to: callbackUrl,
      count: 10,
      active: false,
      tags: ["tag1", "https://auth.example.com/login"],
    });
  });

  it("returns null when input is null or undefined in rewriteOryFlow", () => {
    expect(rewriteOryFlow(null)).toBeNull();
    expect(rewriteOryFlow(undefined)).toBeNull();
  });

  it("rewrites response locations in place while preserving the response", () => {
    const response = new Response(null, {
      headers: { location: "https://ory.example.com/login?flow=123" },
      status: 303,
    });

    expect(rewriteOryResponseLocation(response, "https://auth.example.com")).toBe(
      response,
    );
    expect(response.headers.get("location")).toBe(
      "https://auth.example.com/login?flow=123",
    );
  });

  it("preserves nested return_to query parameters when rewriting a location", () => {
    const callbackUrl =
      "https://provider.example/login/callback?csrf=csrf-token&transaction=transaction-id&flow=login";
    const location = new URL("https://ory.example.com/login");
    location.searchParams.set("return_to", callbackUrl);
    const response = new Response(null, {
      headers: { location: location.toString() },
      status: 303,
    });

    rewriteOryResponseLocation(response, "https://auth.example.com");

    expect(
      new URL(response.headers.get("location") ?? "").searchParams.get("return_to"),
    ).toBe(callbackUrl);
  });

  it("returns unmodified response when location header is missing", () => {
    const response = new Response(null, { status: 200 });
    expect(rewriteOryResponseLocation(response, "https://auth.example.com")).toBe(response);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps a relative path when the application origin is unset", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "",
      oryCanonicalUrl: "",
      orySdkUrl: "",
    }));
    const mod = await import("./url");

    expect(mod.applicationUrl("/consent?transaction=txn-1")).toBe(
      "/consent?transaction=txn-1",
    );
  });

  it("keeps a relative path when the application origin is malformed", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "://invalid",
      oryCanonicalUrl: "",
      orySdkUrl: "",
    }));
    const mod = await import("./url");

    expect(mod.applicationUrl("/consent?transaction=txn-1")).toBe(
      "/consent?transaction=txn-1",
    );
  });
});
