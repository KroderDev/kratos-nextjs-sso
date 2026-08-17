import { describe, expect, it, vi } from "vitest";

const { mockGetServerSession, mockRedirect } = vi.hoisted(() => ({
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
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

import ConsentPage from "./page";

describe("ConsentPage", () => {
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
});
