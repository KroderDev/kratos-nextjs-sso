import { describe, expect, it, vi } from "vitest";

vi.mock("@/ory.config", () => ({
  appBaseUrl: "https://auth.example.com",
  oryCanonicalUrl: "https://ory.example.com",
  orySdkUrl: "http://127.0.0.1:4433",
}));

import {
  rewriteOryFlow,
  rewriteOryResponseLocation,
  rewriteOryUrl,
} from "./url";

describe("Ory URL rewriting", () => {
  it("rewrites local provider URLs to the configured public app origin", () => {
    expect(
      rewriteOryUrl("https://ory.example.com/login?flow=123"),
    ).toBe("https://auth.example.com/auth/login?flow=123");
    expect(
      rewriteOryUrl("https://ory.example.com/self-service/login"),
    ).toBe("https://auth.example.com/self-service/login");
  });

  it("leaves unrelated origins and malformed URLs unchanged", () => {
    expect(rewriteOryUrl("https://attacker.example/login")).toBe(
      "https://attacker.example/login",
    );
    expect(rewriteOryUrl("not a URL")).toBe("not a URL");
  });

  it("rewrites nested flow values without changing other data", () => {
    const flow = {
      ui: {
        action: "https://ory.example.com/self-service/login",
        nodes: [{ attributes: { href: "https://ory.example.com/login" } }],
      },
      id: "flow-id",
    };

    expect(rewriteOryFlow(flow as never)).toEqual({
      ui: {
        action: "https://auth.example.com/self-service/login",
        nodes: [{ attributes: { href: "https://auth.example.com/auth/login" } }],
      },
      id: "flow-id",
    });
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
      "https://auth.example.com/auth/login?flow=123",
    );
  });
});
