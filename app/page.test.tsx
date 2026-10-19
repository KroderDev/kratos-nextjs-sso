// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dictionaries, type SupportedLocale } from "@/lib/i18n/locales";
import { translatePath } from "@/lib/i18n/utils";

const state = vi.hoisted(() => ({
  registrationEnabled: true,
  configured: true,
  defaultRedirect: "/dashboard",
  session: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@ory/nextjs/app", () => ({ getServerSession: state.session }));
vi.mock("next/navigation", () => ({ redirect: state.redirect }));
vi.mock("@/components/layout/brand", () => ({ Brand: () => <div /> }));
vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button" />,
}));
vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async (params?: Promise<Record<string, unknown>>) => {
    const locale = (await params)?.lang === "es" ? "es" : "en";
    return { t: (key: string) => translatePath(dictionaries[locale], key) ?? key };
  }),
}));
vi.mock("@/ory.config", () => ({
  default: {
    project: { get default_redirect_url() { return state.defaultRedirect; } },
  },
  get isRegistrationEnabled() { return state.registrationEnabled; },
  get isOryConfigured() { return state.configured; },
}));

import { getTranslations } from "@/lib/i18n/server";
import Home from "./page";

async function renderHome(locale: SupportedLocale = "en") {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    await Home({ searchParams: Promise.resolve({ lang: locale }) }),
  );
  return container;
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.configured = true;
    state.registrationEnabled = true;
    state.defaultRedirect = "/dashboard";
    state.session.mockResolvedValue(null);
  });

  for (const locale of ["en", "es"] as const) {
    const copy = dictionaries[locale];

    it(`offers account creation only at registration destinations (${locale})`, async () => {
      const container = await renderHome(locale);
      const links = [...container.querySelectorAll("a")];
      const createAccount = links.find(
        (link) => link.textContent?.trim() === copy.home.hero.createIdentity,
      );
      const getStarted = links.find(
        (link) => link.textContent?.trim() === copy.common.navigation.getStarted,
      );

      expect(createAccount?.getAttribute("href")).toBe("/registration");
      expect(getStarted?.getAttribute("href")).toBe("/registration");
      expect(container.querySelectorAll('a[href="/registration"]')).toHaveLength(2);
    });

    it(`shows sign-in without registration copy when disabled (${locale})`, async () => {
      state.registrationEnabled = false;
      const container = await renderHome(locale);
      const navigationLinks = [...container.querySelectorAll("nav a")];

      expect(container.querySelector('a[href="/registration"]')).toBeNull();
      expect(container.textContent?.toLowerCase()).not.toContain("crea");
      expect(container.textContent).not.toContain(copy.common.navigation.getStarted);
      expect(navigationLinks).toHaveLength(1);
      expect(navigationLinks[0].textContent?.trim()).toBe(copy.common.navigation.signIn);
      expect(navigationLinks[0].getAttribute("href")).toBe("/login");
      expect(navigationLinks[0].classList.contains("hidden")).toBe(false);
      const enterWorkspace = [...container.querySelectorAll("main a")].find(
        (link) => link.textContent?.trim() === copy.home.hero.enterWorkspace,
      );
      expect(enterWorkspace?.getAttribute("href")).toBe("/login");
    });
  }

  it("renders the anonymous landing page after checking the session", async () => {
    const container = await renderHome();
    expect(state.session).toHaveBeenCalledOnce();
    expect(container.querySelector("h1")?.textContent).toBe(dictionaries.en.home.hero.title);
    expect(state.redirect).not.toHaveBeenCalled();
  });

  it("keeps the unconfigured landing page independent of session calls", async () => {
    state.configured = false;
    await renderHome();
    expect(state.session).not.toHaveBeenCalled();
  });

  it("does not redirect a session without an identity", async () => {
    state.session.mockResolvedValue({});
    await renderHome();
    expect(state.redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to the configured destination before rendering", async () => {
    state.session.mockResolvedValue({ identity: { id: "identity-1" } });
    state.defaultRedirect = "/dashboard?welcome=1";

    await expect(Home({})).rejects.toThrow("NEXT_REDIRECT:/dashboard?welcome=1");
    expect(state.redirect).toHaveBeenCalledWith(state.defaultRedirect);
    expect(getTranslations).not.toHaveBeenCalled();
  });

  it("checks authentication again on the next request after logout", async () => {
    state.session.mockResolvedValueOnce({ identity: { id: "identity-1" } });
    await expect(Home({})).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    await renderHome();
    expect(state.session).toHaveBeenCalledTimes(2);
    expect(state.redirect).toHaveBeenCalledOnce();
  });
});
