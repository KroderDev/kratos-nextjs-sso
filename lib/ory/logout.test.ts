import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkKratosSessionStatus,
  createProviderLogoutFlow,
  getSafeLogoutFlow,
} from "./logout";

vi.mock("@ory/nextjs/app", () => ({
  getLogoutFlow: vi.fn(),
}));

import { getLogoutFlow } from "@ory/nextjs/app";

describe("getSafeLogoutFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns logout flow when returnTo succeeds", async () => {
    vi.mocked(getLogoutFlow).mockResolvedValueOnce({
      logout_url: "https://ory.example/logout?token=123",
      logout_token: "123",
    });

    const result = await getSafeLogoutFlow("https://app.example");
    expect(result.logout_url).toBe("https://ory.example/logout?token=123");
    expect(getLogoutFlow).toHaveBeenCalledWith({ returnTo: "https://app.example" });
  });

  it("falls back to getLogoutFlow without returnTo when returnTo throws 400 Bad Request", async () => {
    vi.mocked(getLogoutFlow)
      .mockRejectedValueOnce(new Error("Response returned an error code 400"))
      .mockResolvedValueOnce({
        logout_url: "https://ory.example/logout?token=456",
        logout_token: "456",
      });

    const result = await getSafeLogoutFlow("https://unallowed.example");
    expect(result.logout_url).toBe("https://ory.example/logout?token=456");
    expect(getLogoutFlow).toHaveBeenNthCalledWith(1, { returnTo: "https://unallowed.example" });
    expect(getLogoutFlow).toHaveBeenNthCalledWith(2);
  });

  it("returns fallback '#' when both calls throw an error", async () => {
    vi.mocked(getLogoutFlow).mockRejectedValue(new Error("Network Error"));

    const result = await getSafeLogoutFlow("https://app.example");
    expect(result.logout_url).toBe("#");
    expect(result.logout_token).toBe("");
  });

  it("does not redirect to an unrelated logout origin", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://app.example",
      orySdkUrl: "https://ory.example",
      oryProviderOrigin: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://attacker.example/logout",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("#");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rewrites a provider logout URL to the application origin", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");

      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValue({
        logout_url: "https://ory.example/self-service/logout?token=123",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow("https://app.example");

      expect(result.logout_url).toBe(
        "https://app.example/self-service/logout?token=123",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects malformed logout URLs from a configured provider", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://app.example",
      orySdkUrl: "https://ory.example",
      oryProviderOrigin: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://[invalid",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("#");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("uses application logout URLs with a local SDK and public canonical provider", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://app.example",
      orySdkUrl: "http://127.0.0.1:4433",
      oryProviderOrigin: "https://auth.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      for (const origin of ["http://127.0.0.1:4433", "https://auth.example"]) {
        vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
          logout_url: `${origin}/self-service/logout?token=123`,
          logout_token: "123",
        });
        const flow = await getConfiguredLogoutFlow();
        expect(flow.logout_url).toBe("https://app.example/self-service/logout?token=123");
      }
    } finally {
      vi.doUnmock("@/ory.config");
    }
  });

  it("accepts provider logout URLs when no application origin is configured", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: undefined,
      orySdkUrl: "https://ory.example",
      oryProviderOrigin: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://ory.example/logout?token=123",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("https://ory.example/logout?token=123");
    } finally {
      vi.doUnmock("@/ory.config");
    }
  });
});

describe("checkKratosSessionStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("@/ory.config");
  });

  async function importConfiguredLogout(config = {
    appBaseUrl: "https://sso.example",
    orySdkUrl: "https://kratos.example",
    oryProviderOrigin: "https://provider.example",
  }) {
    vi.resetModules();
    vi.doMock("@/ory.config", () => config);
    return import("./logout");
  }

  it("returns error when Kratos SDK URL is unconfigured", async () => {
    const result = await checkKratosSessionStatus("ory_kratos_session=demo");
    expect(result).toEqual({ state: "error" });
  });

  it("returns active for a 200 active Kratos session and forwards cookie with redirect:error and bounded timeout", async () => {
    const mod = await importConfiguredLogout();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "session-demo-1",
          active: true,
          identity: { id: "identity-demo-1" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await mod.checkKratosSessionStatus("kratos_logout_handoff=secret; ory_kratos_session=demo; other=needed");

    expect(result.state).toBe("active");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://kratos.example/sessions/whoami");
    expect(init).toMatchObject({
      cache: "no-store",
      method: "GET",
      redirect: "error",
      headers: expect.objectContaining({
        Accept: "application/json",
        Cookie: "ory_kratos_session=demo; other=needed",
      }),
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns no_session for a 200 inactive Kratos session payload", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "session-demo-1",
          active: false,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(mod.checkKratosSessionStatus("ory_kratos_session=demo")).resolves.toEqual({
      state: "no_session",
    });
  });

  it("returns no_session for verified Kratos 401 session_inactive and v26.2.0 ErrNoSessionFound JSON responses", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 401,
              id: "session_inactive",
              status: "Unauthorized",
            },
          }),
          { status: 401, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 401,
              status: "Unauthorized",
              reason: "No valid session credentials found in the request.",
              message: "The request could not be authorized",
            },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      );

    await expect(mod.checkKratosSessionStatus(undefined)).resolves.toEqual({
      state: "no_session",
    });
    await expect(mod.checkKratosSessionStatus("ory_kratos_session=expired")).resolves.toEqual({
      state: "no_session",
    });
  });

  it("treats Kratos 403 session_aal2_required as an active session that still needs logout", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 403,
            id: "session_aal2_required",
            status: "Forbidden",
          },
        }),
        { status: 403, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(mod.checkKratosSessionStatus("ory_kratos_session=aal1")).resolves.toEqual({
      state: "active",
    });
  });

  it("fails closed on 5xx, timeout/redirect/network errors, non-AAL2 403, and empty/generic/gateway/HTML 401 responses", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("upstream error", { status: 503 }))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"))
      .mockRejectedValueOnce(new TypeError("unexpected redirect"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 403, id: "security_csrf_violation" } }),
          { status: 403, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 401, status: "Unauthorized" } }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 401,
              status: "Unauthorized",
              reason: "Different upstream auth failure.",
              message: "The request could not be authorized",
            },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 401,
              id: "other_error",
              status: "Unauthorized",
              reason: "No valid session credentials found in the request.",
              message: "The request could not be authorized",
            },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 401, id: "session_inactive" } }),
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(
        new Response("Unauthorized", {
          status: 401,
          headers: {
            "content-type": "text/plain",
            "www-authenticate": 'Basic realm="proxy"',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response("<html>401</html>", {
          status: 401,
          headers: { "content-type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 401, id: "security_csrf_violation" } }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      );

    for (let i = 0; i < 13; i += 1) {
      await expect(mod.checkKratosSessionStatus("ory_kratos_session=demo")).resolves.toEqual({
        state: "error",
      });
    }
  });
});

describe("createProviderLogoutFlow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("@/ory.config");
  });

  async function importConfiguredLogout(config = {
    appBaseUrl: "https://sso.example",
    orySdkUrl: "https://kratos.example",
    oryProviderOrigin: "https://provider.example",
  }) {
    vi.resetModules();
    vi.doMock("@/ory.config", () => config);
    return import("./logout");
  }

  it("returns unavailable when Kratos SDK URL is missing or returnTo is invalid", async () => {
    await expect(
      createProviderLogoutFlow("https://sso.example/logout/complete", "cookie=1"),
    ).resolves.toEqual({ status: "unavailable" });

    const mod = await importConfiguredLogout();
    await expect(
      mod.createProviderLogoutFlow("/relative-only", "cookie=1"),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("creates a strict Kratos logout flow with exact /self-service/logout, token, and return_to, forwarding cookie with redirect:error and timeout", async () => {
    const mod = await importConfiguredLogout();
    const expectedReturnTo = "https://sso.example/logout/complete";
    const encodedReturnTo = encodeURIComponent(expectedReturnTo);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          logout_url: `https://kratos.example/self-service/logout?token=demo-tok-1&return_to=${encodedReturnTo}`,
          logout_token: "demo-tok-1",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await mod.createProviderLogoutFlow(
      expectedReturnTo,
      "kratos_logout_handoff=secret; ory_kratos_session=demo; other=needed",
    );

    expect(result).toEqual({
      status: "ready",
      logoutUrl: `https://sso.example/self-service/logout?token=demo-tok-1&return_to=${encodedReturnTo}`,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      `https://kratos.example/self-service/logout/browser?return_to=${encodedReturnTo}`,
    );
    expect(init).toMatchObject({
      cache: "no-store",
      method: "GET",
      redirect: "error",
      headers: expect.objectContaining({
        Accept: "application/json",
        cookie: "ory_kratos_session=demo; other=needed",
      }),
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not fall back to dropping returnTo when Kratos rejects /logout/complete with 400", async () => {
    const mod = await importConfiguredLogout();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 400,
            reason: "return_to is not allowed",
          },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await mod.createProviderLogoutFlow(
      "https://sso.example/logout/complete",
      "ory_kratos_session=demo",
    );

    expect(result).toEqual({ status: "unavailable" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns no_session only when Kratos responds with genuine 401 session_inactive", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 401, id: "session_inactive" },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 401, status: "Unauthorized" } }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      );

    await expect(
      mod.createProviderLogoutFlow(
        "https://sso.example/logout/complete",
        "ory_kratos_session=expired",
      ),
    ).resolves.toEqual({ status: "no_session" });
    await expect(
      mod.createProviderLogoutFlow(
        "https://sso.example/logout/complete",
        "ory_kratos_session=expired",
      ),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      mod.createProviderLogoutFlow(
        "https://sso.example/logout/complete",
        "ory_kratos_session=expired",
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("rejects logout URLs with unexpected origin, non-exact path, missing/mismatched token, or missing/mismatched return_to", async () => {
    const mod = await importConfiguredLogout();
    const expectedReturnTo = "https://sso.example/logout/complete";
    const encodedReturnTo = encodeURIComponent(expectedReturnTo);
    const badFlows = [
      // Untrusted origin
      {
        logout_url: `https://attacker.example/self-service/logout?token=demo-tok&return_to=${encodedReturnTo}`,
        logout_token: "demo-tok",
      },
      // Non-exact path (/self-service/logout/browser instead of /self-service/logout)
      {
        logout_url: `https://kratos.example/self-service/logout/browser?token=demo-tok&return_to=${encodedReturnTo}`,
        logout_token: "demo-tok",
      },
      // Unrelated path
      {
        logout_url: `https://kratos.example/dashboard?token=demo-tok&return_to=${encodedReturnTo}`,
        logout_token: "demo-tok",
      },
      // Missing token
      {
        logout_url: `https://kratos.example/self-service/logout?return_to=${encodedReturnTo}`,
        logout_token: "demo-tok",
      },
      // Mismatched token
      {
        logout_url: `https://kratos.example/self-service/logout?token=other-tok&return_to=${encodedReturnTo}`,
        logout_token: "demo-tok",
      },
      // Missing return_to
      {
        logout_url: "https://kratos.example/self-service/logout?token=demo-tok",
        logout_token: "demo-tok",
      },
      // Mismatched return_to (e.g. direct provider callback or attacker URL)
      {
        logout_url: `https://kratos.example/self-service/logout?token=demo-tok&return_to=${encodeURIComponent("https://provider.example/logout")}`,
        logout_token: "demo-tok",
      },
      // Duplicated return_to
      {
        logout_url: `https://kratos.example/self-service/logout?token=demo-tok&return_to=${encodedReturnTo}&return_to=https%3A%2F%2Fattacker.example`,
        logout_token: "demo-tok",
      },
      // Fragment present
      {
        logout_url: `https://kratos.example/self-service/logout?token=demo-tok&return_to=${encodedReturnTo}#frag`,
        logout_token: "demo-tok",
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const payload of badFlows) {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    for (const payload of badFlows) {
      await expect(
        mod.createProviderLogoutFlow(expectedReturnTo, "cookie=1"),
        payload.logout_url,
      ).resolves.toEqual({ status: "unavailable" });
    }
  });

  it("fails closed when Kratos logout creation times out or receives a redirect error", async () => {
    const mod = await importConfiguredLogout();
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"))
      .mockRejectedValueOnce(new TypeError("unexpected redirect"));

    await expect(
      mod.createProviderLogoutFlow("https://sso.example/logout/complete", "cookie=1"),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      mod.createProviderLogoutFlow("https://sso.example/logout/complete", "cookie=1"),
    ).resolves.toEqual({ status: "unavailable" });
  });
});
