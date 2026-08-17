import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const state = vi.hoisted(() => ({
  isOryConfigured: true,
  appBaseUrl: undefined as string | undefined,
  middlewareResponse: undefined as Response | undefined,
  middlewareCalls: [] as NextRequest[],
  rewriteCalls: [] as Array<{ response: Response; fallbackOrigin: string }>,
}));

vi.mock("@ory/nextjs/middleware", () => ({
  createOryMiddleware: vi.fn(() => async (request: NextRequest) => {
    state.middlewareCalls.push(request);
    return state.middlewareResponse ?? new Response(null, { status: 200 });
  }),
}));

vi.mock("./lib/ory/url", async () => {
  const actual = await vi.importActual<typeof import("./lib/ory/url")>("./lib/ory/url");

  return {
    ...actual,
    restoreOryProviderCallback: vi.fn(actual.restoreOryProviderCallback),
    rewriteOryResponseLocation: vi.fn(
      (response: Response, fallbackOrigin: string) => {
        state.rewriteCalls.push({ response, fallbackOrigin });
        return response;
      },
    ),
  };
});

vi.mock("./ory.config", () => ({
  default: { project: { name: "test-project" } },
  get appBaseUrl() {
    return state.appBaseUrl;
  },
  get isOryConfigured() {
    return state.isOryConfigured;
  },
  orySdkUrl: "https://ory.example.com",
}));

import { restoreOryProviderCallback, rewriteOryResponseLocation } from "./lib/ory/url";
import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    state.isOryConfigured = true;
    state.appBaseUrl = undefined;
    state.middlewareResponse = undefined;
    state.middlewareCalls = [];
    state.rewriteCalls = [];
    vi.mocked(restoreOryProviderCallback).mockClear();
    vi.mocked(rewriteOryResponseLocation).mockClear();
  });

  it("bypasses the Ory middleware entirely when Ory is not configured", async () => {
    state.isOryConfigured = false;
    const nextSpy = vi.spyOn(NextResponse, "next");

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(nextSpy.mock.results[0]?.value);
    expect(state.middlewareCalls).toHaveLength(0);
    expect(rewriteOryResponseLocation).not.toHaveBeenCalled();

    nextSpy.mockRestore();
  });

  it("skips the origin check when no appBaseUrl is configured", async () => {
    state.appBaseUrl = undefined;

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(state.middlewareCalls).toHaveLength(1);
    expect(result.status).toBe(200);
    expect(rewriteOryResponseLocation).toHaveBeenCalledWith(
      expect.anything(),
      "http://localhost:3000",
    );
  });

  it("allows the request when the forwarded origin matches the configured app base URL", async () => {
    state.appBaseUrl = "https://auth.example.com";

    const request = new NextRequest(
      "http://internal:3000/self-service/login/browser",
      {
        headers: {
          "x-forwarded-host": "auth.example.com",
          "x-forwarded-proto": "https",
        },
      },
    );

    const result = await proxy(request);

    expect(state.middlewareCalls).toHaveLength(1);
    expect(result.status).toBe(200);
    expect(rewriteOryResponseLocation).toHaveBeenCalledWith(
      expect.anything(),
      "https://auth.example.com",
    );
  });

  it("rejects the request with 400 when the request origin does not match appBaseUrl", async () => {
    state.appBaseUrl = "https://auth.example.com";

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result.status).toBe(400);
    expect(await result.text()).toBe("Invalid application origin");
    expect(state.middlewareCalls).toHaveLength(0);
    expect(rewriteOryResponseLocation).not.toHaveBeenCalled();
  });

  it("rejects a forwarded origin that does not match appBaseUrl even though it differs from the raw request origin", async () => {
    state.appBaseUrl = "https://auth.example.com";

    const request = new NextRequest(
      "http://internal:3000/self-service/login/browser",
      {
        headers: {
          "x-forwarded-host": "attacker.example",
          "x-forwarded-proto": "https",
        },
      },
    );

    const result = await proxy(request);

    expect(result.status).toBe(400);
    expect(state.middlewareCalls).toHaveLength(0);
  });

  it("returns 400 when appBaseUrl is malformed", async () => {
    state.appBaseUrl = "not a valid url";

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result.status).toBe(400);
    expect(await result.text()).toBe("Invalid application origin");
    expect(state.middlewareCalls).toHaveLength(0);
  });

  it("returns the response produced by rewriteOryResponseLocation", async () => {
    state.appBaseUrl = undefined;
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: "http://internal:4433/self-service/login" },
    });

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result).toBe(state.middlewareResponse);
    expect(state.rewriteCalls).toEqual([
      {
        response: state.middlewareResponse,
        fallbackOrigin: "http://localhost:3000",
      },
    ]);
  });

  it("remembers a deep-linked settings area before the Ory flow initializes", async () => {
    const request = new NextRequest(
      "http://localhost:3000/dashboard/settings?section=security",
    );
    const result = await proxy(request);
    const nextResult = result as NextResponse;

    expect(state.middlewareCalls).toHaveLength(0);
    expect(nextResult.headers.get("set-cookie")).toContain("kratos_settings_area=security");
    expect(nextResult.headers.get("set-cookie")).toContain("Path=/dashboard/settings");
    expect(nextResult.headers.get("set-cookie")).toContain("SameSite=Lax");
  });

  it("sets rewritten location header when restoreOryProviderCallback modifies the location", async () => {
    vi.mocked(restoreOryProviderCallback).mockImplementationOnce(
      (value: string) => `${value}/restored`,
    );
    state.appBaseUrl = undefined;
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: "https://auth.example.com/auth/login/callback" },
    });

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result.headers.get("location")).toBe(
      "https://auth.example.com/auth/login/callback/restored",
    );
    expect(restoreOryProviderCallback).toHaveBeenCalledWith(
      "https://auth.example.com/auth/login/callback",
      "http://localhost:3000",
      "https://ory.example.com",
    );
  });

  it("preserves an internal consent handoff on the application origin", async () => {
    const location = new URL("http://localhost:3000/consent");
    location.searchParams.set("provider_return_to", "https://ory.example.com/consent");
    location.searchParams.set("transaction", "transaction-id");
    location.searchParams.set("csrf", "csrf-token");
    location.searchParams.set("client_name", "Example Client");
    location.searchParams.set("scope", "openid profile");
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: location.toString() },
    });

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result.headers.get("location")).toBe(location.toString());
  });

  it("restores a genuine consent callback to the provider origin", async () => {
    const location = new URL("http://localhost:3000/consent");
    location.searchParams.set("transaction", "transaction-id");
    location.searchParams.set("csrf", "csrf-token");
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: location.toString() },
    });

    const request = new NextRequest("http://localhost:3000/self-service/login/browser");
    const result = await proxy(request);

    expect(result.headers.get("location")).toBe(
      "https://ory.example.com/consent?transaction=transaction-id&csrf=csrf-token",
    );
  });

  it("does not set a settings cookie for an unknown area", async () => {
    const request = new NextRequest(
      "http://localhost:3000/dashboard/settings?section=unknown",
    );
    const result = await proxy(request);

    expect((result as NextResponse).headers.get("set-cookie")).toBeNull();
  });
});
