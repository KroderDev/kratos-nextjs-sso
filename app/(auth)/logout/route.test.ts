import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCheckKratosSessionStatus,
  mockConfig,
  mockCreateProviderLogoutFlow,
} = vi.hoisted(() => ({
  mockCheckKratosSessionStatus: vi.fn(),
  mockConfig: {
    appBaseUrl: "https://sso.example",
    isOryConfigured: true,
    oryProviderOrigin: "https://provider.example" as string | undefined,
    orySdkUrl: "https://provider.example",
  },
  mockCreateProviderLogoutFlow: vi.fn(),
}));

vi.mock("@/ory.config", () => mockConfig);

vi.mock("@/lib/ory/logout", () => ({
  checkKratosSessionStatus: mockCheckKratosSessionStatus,
  createProviderLogoutFlow: mockCreateProviderLogoutFlow,
}));

import {
  LOGOUT_COMPLETE_PATH,
  LOGOUT_CONTINUATION_COOKIE,
  resetConsumedLogoutContinuationsForTests,
  verifyLogoutContinuationToken,
} from "@/lib/ory/logout-continuation";
import { GET } from "./route";

function extractCookieValue(setCookieHeader: string | null): string | undefined {
  if (!setCookieHeader) {
    return undefined;
  }
  const match = setCookieHeader.match(
    new RegExp(`${LOGOUT_CONTINUATION_COOKIE}=([^;]+)`),
  );
  return match?.[1];
}

describe("GET /logout", () => {
  beforeEach(() => {
    mockConfig.appBaseUrl = "https://sso.example";
    mockConfig.isOryConfigured = true;
    mockConfig.oryProviderOrigin = "https://provider.example";
    mockConfig.orySdkUrl = "https://provider.example";
    mockCheckKratosSessionStatus.mockReset();
    mockCreateProviderLogoutFlow.mockReset();
    resetConsumedLogoutContinuationsForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects invalid, missing, external, and duplicated provider handoffs with no-store and no-referrer", async () => {
    const invalidUrls = [
      "https://sso.example/logout",
      "https://sso.example/logout?flow=login&transaction=txn-demo-1&csrf=csrf-demo-1&return_to=https%3A%2F%2Fprovider.example%2Flogout",
      "https://sso.example/logout?flow=logout&transaction=txn-demo-1&csrf=csrf-demo-1&return_to=https%3A%2F%2Fattacker.example%2Flogout",
      "https://sso.example/logout?flow=logout&transaction=txn-demo-1&transaction=txn-demo-2&csrf=csrf-demo-1&return_to=https%3A%2F%2Fprovider.example%2Flogout",
    ];

    for (const url of invalidUrls) {
      const response = await GET(new NextRequest(url));

      expect(response.status, url).toBe(303);
      expect(response.headers.get("location"), url).toBe(
        "https://sso.example/error?reason=invalid_request",
      );
      expect(response.headers.get("cache-control"), url).toContain("no-store");
      expect(response.headers.get("pragma"), url).toBe("no-cache");
      expect(response.headers.get("referrer-policy"), url).toBe("no-referrer");
      expect(response.headers.get("set-cookie"), url).toContain("Max-Age=0");
    }

    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
    expect(mockCreateProviderLogoutFlow).not.toHaveBeenCalled();
  });

  it("starts Kratos logout using the fixed /logout/complete return URL and never sends the adapter callback to Kratos", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockCheckKratosSessionStatus.mockResolvedValue({
      state: "active",
      session: { id: "session-demo-1" },
    });
    mockCreateProviderLogoutFlow.mockResolvedValue({
      status: "ready",
      logoutUrl: "https://sso.example/self-service/logout?token=kratos-logout-token-1",
    });

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-secret-demo-1");
    url.searchParams.set("csrf", "csrf-secret-demo-1");
    url.searchParams.set("return_to", "https://provider.example/logout");
    url.searchParams.set("lang", "es");

    const response = await GET(
      new NextRequest(url, {
        headers: { cookie: "ory_kratos_session=demo-session" },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/self-service/logout?token=kratos-logout-token-1",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");

    // Must pass fixed app-owned /logout/complete, never the provider callback URL.
    expect(mockCreateProviderLogoutFlow).toHaveBeenCalledWith(
      "https://sso.example/logout/complete",
      "ory_kratos_session=demo-session",
    );

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${LOGOUT_CONTINUATION_COOKIE}=`);
    expect(setCookie).toContain(`Path=${LOGOUT_COMPLETE_PATH}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");

    const verified = verifyLogoutContinuationToken(extractCookieValue(setCookie));
    expect(verified).toMatchObject({
      csrf: "csrf-secret-demo-1",
      locale: "es",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-secret-demo-1",
    });

    // Must not log raw handoff fields.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("redirects directly to /logout/complete with a signed continuation cookie when already logged out in Kratos", async () => {
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "no_session" });

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-demo-already-out");
    url.searchParams.set("csrf", "csrf-demo-already-out");
    url.searchParams.set("return_to", "https://provider.example/logout");

    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/logout/complete",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(mockCreateProviderLogoutFlow).not.toHaveBeenCalled();

    const verified = verifyLogoutContinuationToken(
      extractCookieValue(response.headers.get("set-cookie")),
    );
    expect(verified).toMatchObject({
      csrf: "csrf-demo-already-out",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-already-out",
    });
  });

  it("does not begin a Kratos logout if the handoff cannot fit in a continuation cookie", async () => {
    // WHATWG URL accepts an oversized host in configuration; it must not induce
    // a logout that cannot subsequently be completed by the browser.
    mockConfig.oryProviderOrigin = `https://${"test.".repeat(280)}example`;
    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "t".repeat(256));
    url.searchParams.set("csrf", "c".repeat(256));
    url.searchParams.set("return_to", `${mockConfig.oryProviderOrigin}/logout`);

    const response = await GET(new NextRequest(url));

    expect(response.headers.get("location")).toBe(
      "https://sso.example/error?reason=invalid_request",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
    expect(mockCreateProviderLogoutFlow).not.toHaveBeenCalled();
  });

  it("re-checks whoami and proceeds to /logout/complete if the Kratos session expires before logout flow creation", async () => {
    mockCheckKratosSessionStatus
      .mockResolvedValueOnce({ state: "active" })
      .mockResolvedValueOnce({ state: "no_session" });
    mockCreateProviderLogoutFlow.mockResolvedValue({ status: "no_session" });

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-demo-race");
    url.searchParams.set("csrf", "csrf-demo-race");
    url.searchParams.set("return_to", "https://provider.example/logout");

    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/logout/complete",
    );
    expect(mockCheckKratosSessionStatus).toHaveBeenCalledTimes(2);
  });

  it("fails closed on whoami errors instead of treating them as already logged out", async () => {
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "error" });

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-demo-err");
    url.searchParams.set("csrf", "csrf-demo-err");
    url.searchParams.set("return_to", "https://provider.example/logout");

    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/error?reason=logout_unavailable",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(mockCreateProviderLogoutFlow).not.toHaveBeenCalled();
  });

  it.each(["active", "error"])(
    "refuses the flow-creation race when the second whoami returns %s",
    async (state) => {
      mockCheckKratosSessionStatus
        .mockResolvedValueOnce({ state: "active" })
        .mockResolvedValueOnce({ state });
      mockCreateProviderLogoutFlow.mockResolvedValue({ status: "no_session" });

      const url = new URL("https://sso.example/logout");
      url.searchParams.set("flow", "logout");
      url.searchParams.set("transaction", "txn-demo-race");
      url.searchParams.set("csrf", "csrf-demo-race");
      url.searchParams.set("return_to", "https://provider.example/logout");
      const response = await GET(new NextRequest(url));

      expect(mockCheckKratosSessionStatus).toHaveBeenCalledTimes(2);
      expect(response.headers.get("location")).toBe(
        "https://sso.example/error?reason=logout_unavailable",
      );
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    },
  );

  it("fails closed when Kratos rejects /logout/complete or cannot create a logout flow", async () => {
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "active" });
    mockCreateProviderLogoutFlow.mockResolvedValue({ status: "unavailable" });

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-demo-unavail");
    url.searchParams.set("csrf", "csrf-demo-unavail");
    url.searchParams.set("return_to", "https://provider.example/logout");

    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/error?reason=logout_unavailable",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("fails closed when Ory is unconfigured", async () => {
    mockConfig.isOryConfigured = false;

    const url = new URL("https://sso.example/logout");
    url.searchParams.set("flow", "logout");
    url.searchParams.set("transaction", "txn-demo-unconf");
    url.searchParams.set("csrf", "csrf-demo-unconf");
    url.searchParams.set("return_to", "https://provider.example/logout");

    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://sso.example/error?reason=logout_unavailable",
    );
    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
  });

  it("returns 503 in production when appBaseUrl is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockConfig.appBaseUrl = "";

    const response = await GET(
      new NextRequest(
        "https://sso.example/logout?flow=logout&transaction=txn-demo-1&csrf=csrf-demo-1&return_to=https%3A%2F%2Fprovider.example%2Flogout",
      ),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("ignores forwarded origins when the configured application URL is invalid", async () => {
    mockConfig.appBaseUrl = "not-an-origin";

    const response = await GET(new NextRequest("https://sso.example/logout", {
      headers: { "x-forwarded-host": "forwarded.example", "x-forwarded-proto": "https" },
    }));

    expect(response.status).toBe(503);
    expect(response.headers.has("location")).toBe(false);
    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
  });

  it("uses the request origin for the completion URL in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockConfig.appBaseUrl = "";
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "no_session" });
    const url = new URL("http://localhost:3000/logout");
    url.search = new URLSearchParams({
      flow: "logout",
      transaction: "txn-demo",
      csrf: "csrf-demo",
      return_to: "https://provider.example/logout",
      unrelated: "ignored",
    }).toString();

    const response = await GET(new NextRequest(url));

    expect(response.headers.get("location")).toBe("http://localhost:3000/logout/complete");
    expect(response.headers.get("set-cookie")).not.toContain("Secure");
  });
});
