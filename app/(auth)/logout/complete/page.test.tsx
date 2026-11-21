import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCheckKratosSessionStatus,
  mockConfig,
  mockCookies,
  mockCreateProviderLogoutFlow,
  mockGetTranslations,
  mockHeaders,
  mockRedirect,
} = vi.hoisted(() => ({
  mockCheckKratosSessionStatus: vi.fn(),
  mockConfig: {
    appBaseUrl: "https://sso.example",
    isOryConfigured: true,
    oryProviderOrigin: "https://provider.example" as string | undefined,
    orySdkUrl: "https://provider.example",
  },
  mockCookies: vi.fn(),
  mockCreateProviderLogoutFlow: vi.fn(),
  mockGetTranslations: vi.fn(async (_params?: unknown, overrideLocale?: string) => ({
    locale: overrideLocale ?? "en",
    t: (key: string) => (overrideLocale ? `${overrideLocale}:${key}` : key),
  })),
  mockHeaders: vi.fn(),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/ory.config", () => mockConfig);

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: mockGetTranslations,
}));

vi.mock("@/lib/ory/logout", () => ({
  checkKratosSessionStatus: mockCheckKratosSessionStatus,
  createProviderLogoutFlow: mockCreateProviderLogoutFlow,
}));

import {
  createLogoutContinuationToken,
  LOGOUT_CONTINUATION_COOKIE,
  LOGOUT_CONTINUATION_TTL_SECONDS,
  resetConsumedLogoutContinuationsForTests,
} from "@/lib/ory/logout-continuation";
import { GET as startLogout } from "../route";
import LogoutCompletePage, { generateMetadata } from "./page";

function mockCookieStore(token: string | undefined) {
  mockCookies.mockResolvedValue({
    get: (name: string) =>
      name === LOGOUT_CONTINUATION_COOKIE && token !== undefined
        ? { name, value: token }
        : undefined,
  });
}

describe("LogoutCompletePage", () => {
  beforeEach(() => {
    mockConfig.appBaseUrl = "https://sso.example";
    mockConfig.isOryConfigured = true;
    mockConfig.oryProviderOrigin = "https://provider.example";
    mockConfig.orySdkUrl = "https://provider.example";
    mockCheckKratosSessionStatus.mockReset();
    mockCreateProviderLogoutFlow.mockReset();
    mockCookies.mockReset();
    mockHeaders.mockReset();
    mockRedirect.mockClear();
    mockGetTranslations.mockClear();
    resetConsumedLogoutContinuationsForTests();
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("rejects missing, forged, and expired continuation cookies without calling whoami", async () => {
    mockCookieStore(undefined);
    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=invalid_request",
    );

    mockCookieStore("forged.signature");
    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=invalid_request",
    );

    const expired = createLogoutContinuationToken(
      {
        csrf: "csrf-demo-1",
        providerReturnTo: "https://provider.example/logout",
        transaction: "txn-demo-1",
      },
      Date.now() - (LOGOUT_CONTINUATION_TTL_SECONDS + 10) * 1000,
    )!;
    mockCookieStore(expired);
    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=invalid_request",
    );

    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
  });

  it("refuses to finalize provider logout when Kratos session is still active", async () => {
    const token = createLogoutContinuationToken({
      csrf: "csrf-demo-active",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-active",
    })!;
    mockCookieStore(token);
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: "ory_kratos_session=still-active" }),
    );
    mockCheckKratosSessionStatus.mockResolvedValue({
      state: "active",
      session: { id: "session-demo-1" },
    });

    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=logout_unavailable",
    );
    expect(mockCheckKratosSessionStatus).toHaveBeenCalledWith(
      "ory_kratos_session=still-active",
    );

    // Token was consumed on failure so it cannot be replayed later.
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "no_session" });
    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=invalid_request",
    );
  });

  it("refuses to finalize provider logout when Kratos whoami errors", async () => {
    const token = createLogoutContinuationToken({
      csrf: "csrf-demo-err",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-err",
    })!;
    mockCookieStore(token);
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "error" });

    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=logout_unavailable",
    );
  });

  it("cannot render two POST forms for concurrent requests carrying the same continuation", async () => {
    mockCookieStore(createLogoutContinuationToken({
      csrf: "csrf-demo-concurrent",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-concurrent",
    })!);
    let releaseWhoami!: () => void;
    const waitForWhoami = new Promise<void>((resolve) => { releaseWhoami = resolve; });
    mockCheckKratosSessionStatus.mockImplementation(async () => {
      await waitForWhoami;
      return { state: "no_session" };
    });

    const outcomes = Promise.allSettled([LogoutCompletePage(), LogoutCompletePage()]);
    try {
      await vi.waitFor(() => expect(mockCheckKratosSessionStatus).toHaveBeenCalledTimes(2));
    } finally {
      releaseWhoami();
    }

    const results = await outcomes;
    const forms = results.flatMap((outcome) =>
      outcome.status === "fulfilled" ? [renderToStaticMarkup(outcome.value)] : [],
    );
    expect(forms).toEqual([expect.stringContaining('method="post"')]);
    expect(results).toContainEqual({
      status: "rejected",
      reason: new Error("redirect:/error?reason=invalid_request"),
    });
  });

  it("consumes the continuation without calling whoami if Ory is no longer configured", async () => {
    mockCookieStore(createLogoutContinuationToken({
      csrf: "csrf-demo-unconfigured",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-unconfigured",
    })!);
    mockConfig.isOryConfigured = false;

    await expect(LogoutCompletePage()).rejects.toThrow("redirect:/error?reason=logout_unavailable");
    expect(mockCheckKratosSessionStatus).not.toHaveBeenCalled();
    mockConfig.isOryConfigured = true;
    await expect(LogoutCompletePage()).rejects.toThrow("redirect:/error?reason=invalid_request");
  });

  it("renders a native auto-submitting POST form to the trusted provider callback after whoami confirms no session, and blocks replay", async () => {
    const token = createLogoutContinuationToken({
      csrf: "csrf-demo-final",
      locale: "es",
      providerReturnTo: "https://provider.example/logout",
      transaction: "txn-demo-final",
    })!;
    mockCookieStore(token);
    mockCheckKratosSessionStatus.mockResolvedValue({ state: "no_session" });

    // Metadata lookup reads locale without consuming the token.
    await expect(generateMetadata()).resolves.toEqual({
      title: "es:auth.logout.title",
    });

    const markup = renderToStaticMarkup(await LogoutCompletePage());

    expect(markup).toContain('action="https://provider.example/logout"');
    expect(markup).toContain('method="post"');
    expect(markup).toContain('data-auto-submit="true"');
    expect(markup).toContain('name="transaction" value="txn-demo-final"');
    expect(markup).toContain('name="csrf" value="csrf-demo-final"');
    expect(markup).toContain("es:auth.logout.continue");

    // Replaying the same continuation cookie must fail closed.
    await expect(LogoutCompletePage()).rejects.toThrow(
      "redirect:/error?reason=invalid_request",
    );
  });

  it("completes the full /logout -> Kratos -> /logout/complete transition with a single-use browser cookie", async () => {
    mockCheckKratosSessionStatus.mockResolvedValueOnce({
      state: "active",
      session: { id: "session-demo-1" },
    });
    mockCreateProviderLogoutFlow.mockResolvedValueOnce({
      status: "ready",
      logoutUrl: "https://sso.example/self-service/logout?token=logout-tok-demo",
    });

    const startUrl = new URL("https://sso.example/logout");
    startUrl.searchParams.set("flow", "logout");
    startUrl.searchParams.set("transaction", "txn-demo-e2e");
    startUrl.searchParams.set("csrf", "csrf-demo-e2e");
    startUrl.searchParams.set(
      "return_to",
      "https://provider.example/logout?flow=logout&transaction=txn-demo-e2e&csrf=csrf-demo-e2e",
    );

    const startResponse = await startLogout(
      new NextRequest(startUrl, {
        headers: { cookie: "ory_kratos_session=active-session" },
      }),
    );

    expect(startResponse.status).toBe(303);
    expect(startResponse.headers.get("location")).toBe(
      "https://sso.example/self-service/logout?token=logout-tok-demo",
    );
    expect(mockCreateProviderLogoutFlow).toHaveBeenCalledWith(
      "https://sso.example/logout/complete",
      "ory_kratos_session=active-session",
    );

    const cookieMatch = startResponse.headers
      .get("set-cookie")
      ?.match(new RegExp(`${LOGOUT_CONTINUATION_COOKIE}=([^;]+)`));
    expect(cookieMatch?.[1]).toBeTruthy();

    // After Kratos revokes the session and redirects to /logout/complete:
    mockCookieStore(cookieMatch![1]);
    mockHeaders.mockResolvedValue(new Headers());
    mockCheckKratosSessionStatus.mockResolvedValueOnce({ state: "no_session" });

    const markup = renderToStaticMarkup(await LogoutCompletePage());
    expect(markup).toContain('action="https://provider.example/logout"');
    expect(markup).toContain('method="post"');
    expect(markup).toContain('name="transaction" value="txn-demo-e2e"');
    expect(markup).toContain('name="csrf" value="csrf-demo-e2e"');
  });
});
