import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const state = vi.hoisted(() => ({
  isOryConfigured: true,
  appBaseUrl: undefined as string | undefined,
  orySdkUrl: "https://ory.example.com",
  oryCanonicalUrl: "",
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
    rewriteOryResponseLocation: vi.fn(
      (response: Response, fallbackOrigin: string) => {
        state.rewriteCalls.push({ response, fallbackOrigin });
        return actual.rewriteOryResponseLocation(response, fallbackOrigin);
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
  get orySdkUrl() { return state.orySdkUrl; },
  get oryCanonicalUrl() { return state.oryCanonicalUrl; },
  get oryProviderOrigin() { return state.oryCanonicalUrl || state.orySdkUrl; },
}));

import { rewriteOryResponseLocation } from "./lib/ory/url";
import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    state.isOryConfigured = true;
    state.appBaseUrl = undefined;
    state.orySdkUrl = "https://ory.example.com";
    state.oryCanonicalUrl = "";
    state.middlewareResponse = undefined;
    state.middlewareCalls = [];
    state.rewriteCalls = [];
    vi.mocked(rewriteOryResponseLocation).mockClear();
  });

  it.each([401, 500, 303])("recovers failed browser logout (%s) through guarded completion", async (status) => {
    state.appBaseUrl = "https://sso.example";
    state.middlewareResponse = new Response(null, {
      status,
      headers: [
        ["location", "https://sso.example/error?id=revoked"],
        ["set-cookie", "ory_kratos_session=; Max-Age=0; Path=/"],
        ["set-cookie", "other=fixture; Path=/"],
      ],
    });
    const request = new NextRequest("https://sso.example/self-service/logout?token=opaque&return_to=" +
      encodeURIComponent("https://sso.example/logout/complete"));
    const response = await proxy(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://sso.example/logout/complete");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.getSetCookie()).toEqual([
      "ory_kratos_session=; Max-Age=0; Path=/",
      "other=fixture; Path=/",
    ]);
  });

  it.each([
    ["GET", "token=fixture&return_to=https://other.example"],
    ["GET", "token=fixture&return_to=https://sso.example/logout/complete&return_to=https://sso.example/logout/complete"],
    ["GET", "token=fixture&token=other&return_to=https://sso.example/logout/complete"],
    ["GET", "token=%20&return_to=https://sso.example/logout/complete"],
    ["POST", "token=fixture&return_to=https://sso.example/logout/complete"],
  ])("does not recover a browser logout outside the fixed recovery contract (%s %s)", async (method, query) => {
    state.appBaseUrl = "https://sso.example";
    state.middlewareResponse = new Response(null, { status: 401 });
    const response = await proxy(new NextRequest(`https://sso.example/self-service/logout?${query}`, { method }));
    expect(response.status).toBe(401);
  });

  it.each([
    ["https://other.example/error", 303],
    ["http://[invalid", 303],
    ["https://sso.example/logout/complete", 303],
    ["https://sso.example/error", 200],
    [null, 303],
  ])("leaves ordinary Kratos responses alone (%s, %s)", async (location, status) => {
    state.appBaseUrl = "https://sso.example";
    state.middlewareResponse = new Response(null, { status, headers: location ? { location } : undefined });
    const query = new URLSearchParams({ token: "fixture", return_to: "https://sso.example/logout/complete" });
    const response = await proxy(new NextRequest(`https://sso.example/self-service/logout?${query}`));
    expect(response.status).toBe(status);
    expect(response.headers.get("location")).toBe(location);
    expect(response.headers.get("referrer-policy")).toBeNull();
  });

  it.each(["/logout", "/logout/complete"])("allows a top-level redirect but rejects prefetches and subresource requests at %s", async (path) => {
    const url = `https://sso.example${path}`;
    const navigation = await proxy(new NextRequest(url, {
      headers: { "sec-fetch-mode": "navigate", "sec-fetch-dest": "document", "sec-fetch-site": "cross-site" },
    }));
    expect(navigation.headers.get("x-middleware-next")).toBe("1");

    const nonNavigationHeaders: HeadersInit[] = [
      { "sec-purpose": "prefetch;prerender" },
      { purpose: "prefetch" },
      { rsc: "1" },
      { "next-router-prefetch": "1" },
      { "sec-fetch-mode": "cors" },
      { "sec-fetch-mode": "navigate", "sec-fetch-dest": "iframe" },
    ];
    for (const headers of nonNavigationHeaders) {
      const response = await proxy(new NextRequest(url, { headers }));
      expect(response.status, JSON.stringify(headers)).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.getSetCookie()).toEqual([]);
    }

    for (const method of ["HEAD", "POST"]) {
      const response = await proxy(new NextRequest(url, { method }));
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
      expect(response.headers.getSetCookie()).toEqual([]);
    }
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

  it("only allows the local UI preview route in development", async () => {
    const nextSpy = vi.spyOn(NextResponse, "next");

    try {
      vi.stubEnv("NODE_ENV", "production");
      const productionResult = await proxy(
        new NextRequest("http://localhost:3000/dev/ui-preview"),
      );

      expect(productionResult.status).toBe(404);
      expect(state.middlewareCalls).toHaveLength(0);
      expect(nextSpy).not.toHaveBeenCalled();

      vi.stubEnv("NODE_ENV", "development");
      state.isOryConfigured = false;
      const developmentResult = await proxy(
        new NextRequest("http://localhost:3000/dev/ui-preview"),
      );

      expect(developmentResult).toBe(nextSpy.mock.results[0]?.value);
      expect(developmentResult.status).toBe(200);
      expect(nextSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllEnvs();
      nextSpy.mockRestore();
    }
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

  it("passes configured non-Ory paths through without invoking Ory middleware", async () => {
    const request = new NextRequest("http://localhost:3000/dashboard");
    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(state.middlewareCalls).toHaveLength(0);
    expect(rewriteOryResponseLocation).not.toHaveBeenCalled();
  });

  it("fails closed in production when Ory is configured without an app origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    state.appBaseUrl = undefined;

    try {
      const request = new NextRequest("http://localhost:3000/self-service/login/browser");
      const result = await proxy(request);

      expect(result.status).toBe(503);
      expect(await result.text()).toBe("Invalid application configuration");
      expect(state.middlewareCalls).toHaveLength(0);
    } finally {
      vi.unstubAllEnvs();
    }
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

  it("allows the request when the host header matches appBaseUrl without forwarding headers", async () => {
    state.appBaseUrl = "https://auth.example.com";

    const request = new NextRequest(
      "http://internal:3000/self-service/login/browser",
      {
        headers: {
          host: "auth.example.com",
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

  it("applies origin validation to application flow routes before Ory middleware", async () => {
    state.appBaseUrl = "https://auth.example.com";

    for (const pathname of [
      "/login",
      "/registration",
      "/recovery",
      "/verification",
      "/consent",
      "/logout",
      "/logout/complete",
      "/error",
      "/dashboard/settings",
    ]) {
      const request = new NextRequest(`http://localhost:3000${pathname}`);
      const result = await proxy(request);

      expect(result.status, pathname).toBe(400);
    }

    expect(state.middlewareCalls).toHaveLength(0);
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

  it.each(["/auth/login/callback", "/login/callback", "/consent", "/logout"])(
    "restores %s to the canonical provider without rewriting it back to the app",
    async (path) => {
      state.orySdkUrl = "http://127.0.0.1:4433";
      state.oryCanonicalUrl = "https://ory.example.com";
      const callbackPath = path === "/auth/login/callback" ? "/login/callback" : path;
      for (const source of ["http://localhost:3000", "https://ory.example.com"]) {
        state.middlewareResponse = new Response(null, {
          status: 303,
          headers: { location: `${source}${path}?transaction=id&csrf=token` },
        });
        const result = await proxy(new NextRequest("http://localhost:3000/self-service/login/browser"));
        expect(result.headers.get("location")).toBe(
          `https://ory.example.com${source === "http://localhost:3000" ? callbackPath : path}?transaction=id&csrf=token`,
        );
      }
    },
  );

  it("rewrites ordinary canonical UI locations while preserving a nested provider callback", async () => {
    state.orySdkUrl = "http://127.0.0.1:4433";
    state.oryCanonicalUrl = "https://ory.example.com";
    const callback = "https://ory.example.com/login/callback?transaction=id&csrf=token";
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: `https://ory.example.com/login?return_to=${encodeURIComponent(callback)}` },
    });
    const result = await proxy(new NextRequest("http://localhost:3000/self-service/login/browser"));
    const location = new URL(result.headers.get("location")!);
    expect(location.origin).toBe("http://localhost:3000");
    expect(location.searchParams.get("return_to")).toBe(callback);
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

  it("clears the logout continuation cookie and disables caching on /logout/complete", async () => {
    state.appBaseUrl = "https://sso.example";

    const request = new NextRequest("http://internal:3000/logout/complete", {
      headers: {
        "x-forwarded-host": "sso.example",
        "x-forwarded-proto": "https",
      },
    });
    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(state.middlewareCalls).toHaveLength(0);
    expect(result.headers.get("set-cookie")).toContain("kratos_logout_handoff=; Max-Age=0");
    expect(result.headers.get("set-cookie")).toContain("Path=/logout/complete");
    expect(result.headers.get("set-cookie")).toContain("HttpOnly");
    expect(result.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(result.headers.get("set-cookie")).toContain("Secure");
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.headers.get("pragma")).toBe("no-cache");
    expect(result.headers.get("referrer-policy")).toBe("strict-origin");
  });

  it("clears the logout continuation cookie on /logout/complete even when Ory is unconfigured", async () => {
    state.isOryConfigured = false;

    const request = new NextRequest("http://localhost:3000/logout/complete");
    const result = await proxy(request);

    expect(result.status).toBe(200);
    expect(result.headers.get("set-cookie")).toContain("kratos_logout_handoff=; Max-Age=0");
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.headers.get("referrer-policy")).toBe("strict-origin");
  });

  it("keeps Kratos logout redirects to /logout/complete on the application origin", async () => {
    state.appBaseUrl = "https://sso.example";
    state.orySdkUrl = "http://127.0.0.1:4433";
    state.oryCanonicalUrl = "https://provider.example";
    state.middlewareResponse = new Response(null, {
      status: 303,
      headers: { location: "https://sso.example/logout/complete" },
    });

    const request = new NextRequest(
      "http://internal:3000/self-service/logout?token=demo-token",
      {
        headers: {
          "x-forwarded-host": "sso.example",
          "x-forwarded-proto": "https",
        },
      },
    );
    const result = await proxy(request);

    expect(result.headers.get("location")).toBe("https://sso.example/logout/complete");
  });

  it("does not log raw handoff query fields on origin mismatch", async () => {
    state.appBaseUrl = "https://sso.example";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const request = new NextRequest(
        "http://localhost:3000/logout?flow=logout&transaction=secret-txn-demo&csrf=secret-csrf-demo&return_to=https%3A%2F%2Fprovider.example%2Flogout",
      );
      const result = await proxy(request);

      expect(result.status).toBe(400);
      const logged = errorSpy.mock.calls.flat().join(" ");
      expect(logged).toContain("pathname=/logout");
      expect(logged).not.toContain("secret-txn-demo");
      expect(logged).not.toContain("secret-csrf-demo");
      expect(logged).not.toContain("provider.example");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
