import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockConfig, mockGetServerSession, mockRedirect } = vi.hoisted(() => ({
  mockConfig: { consentRememberMode: "always" },
  mockGetServerSession: vi.fn(),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@ory/nextjs/app", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/ory.config", () => ({
  appBaseUrl: "https://sso.example.com",
  orySdkUrl: "https://operator.example.com",
  get consentRememberMode() {
    return mockConfig.consentRememberMode;
  },
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

import ConsentPage from "./page";

describe("ConsentPage", () => {
  beforeEach(() => {
    mockConfig.consentRememberMode = "always";
    mockGetServerSession.mockReset();
    mockRedirect.mockClear();
  });

  it("keeps the unauthenticated consent return path on the application origin", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(
      ConsentPage({
        searchParams: Promise.resolve({
          provider_return_to: "https://operator.example.com/consent",
          transaction: "txn-1",
          csrf: "csrf-1",
          client_name: "Example Client",
          scope: "openid profile",
        }),
      }),
    ).rejects.toThrow("redirect:/login");

    const destination = mockRedirect.mock.calls[0][0] as string;
    const returnTo = new URL(destination, "https://sso.example.com").searchParams.get(
      "return_to",
    );

    expect(returnTo).toContain("https://sso.example.com/consent?");
    expect(returnTo).toContain("transaction=txn-1");
    expect(returnTo).toContain("csrf=csrf-1");
  });

  it("remembers accepted consent by default and auto-submits skipped consent", async () => {
    mockGetServerSession.mockResolvedValue({});

    const page = await ConsentPage({
      searchParams: Promise.resolve({
        provider_return_to: "https://operator.example.com/consent",
        transaction: "txn-1",
        csrf: "csrf-1",
        client_name: "Example Client",
        scope: "openid profile",
        skip_consent: "true",
      }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('data-auto-submit="true"');
    expect(markup).toMatch(/<input type="hidden" name="remember" value="true"/);
    expect(markup).toContain('name="decision"');
    expect(markup).toContain('value="accept"');
  });

  it("shows a remember checkbox in prompt mode", async () => {
    mockConfig.consentRememberMode = "prompt";
    mockGetServerSession.mockResolvedValue({});

    const page = await ConsentPage({
      searchParams: Promise.resolve({
        provider_return_to: "https://operator.example.com/consent",
        transaction: "txn-1",
        csrf: "csrf-1",
      }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('data-slot="checkbox"');
    expect(markup).toContain('name="remember"');
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('value="true"');
    expect(markup).toContain("auth.consent.remember");
  });

  it("does not send a remember field in never mode", async () => {
    mockConfig.consentRememberMode = "never";
    mockGetServerSession.mockResolvedValue({});

    const page = await ConsentPage({
      searchParams: Promise.resolve({
        provider_return_to: "https://operator.example.com/consent",
        transaction: "txn-1",
        csrf: "csrf-1",
      }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).not.toContain('name="remember"');
  });
});
