import { describe, expect, it, vi } from "vitest";

const { cookiesMock, headersMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

import { getLocale, getTranslations } from "./server";

describe("server i18n", () => {
  it("prefers a valid query locale over cookies and headers", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "en" }) });
    headersMock.mockResolvedValue({ get: () => "en-US" });

    expect(await getLocale({ lang: "es" })).toBe("es");
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(headersMock).not.toHaveBeenCalled();
  });

  it("uses a valid cookie before checking Accept-Language", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "es" }) });
    headersMock.mockResolvedValue({ get: () => "en-US" });

    expect(await getLocale({ lang: "fr" })).toBe("es");
    expect(headersMock).not.toHaveBeenCalled();
  });

  it("uses the header and supports promised search parameters", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    headersMock.mockResolvedValue({ get: () => "es-MX, en;q=0.8" });

    expect(await getLocale(Promise.resolve({ lang: "invalid" }))).toBe("es");
  });

  it("falls back when request context APIs throw or have no preferences", async () => {
    cookiesMock.mockRejectedValue(new Error("outside request context"));
    headersMock.mockRejectedValue(new Error("outside request context"));

    expect(await getLocale({ lang: "fr" })).toBe("en");
  });

  it("falls back when request context has no cookie or language header", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    headersMock.mockResolvedValue({ get: () => undefined });

    expect(await getLocale({ lang: ["fr", "es"] })).toBe("en");
  });

  it("uses the default locale when no search parameters are supplied", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    headersMock.mockResolvedValue({ get: () => undefined });

    expect(await getLocale()).toBe("en");
  });

  it("returns translated functions for an override locale", async () => {
    const result = await getTranslations(undefined, "es");

    expect(result.locale).toBe("es");
    expect(result.t("common.navigation.signIn")).toBe("Iniciar sesión");
    expect(result.t("dashboard.overview.title", { name: "Ada" })).toContain("Ada");
  });

  it("falls back to the default dictionary and key for missing translations", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "en" }) });
    const result = await getTranslations({ lang: "en" });

    expect(result.t("common.navigation.signIn")).toBe("Sign in");
    expect(result.t("missing.translation")).toBe("missing.translation");
  });

  it("uses the default dictionary for an invalid runtime override locale", async () => {
    const result = await getTranslations(undefined, "fr" as never);

    expect(result.locale).toBe("fr");
    expect(result.t("common.navigation.signIn")).toBe("Sign in");
  });
});
