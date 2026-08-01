import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isValidLocale,
  parseAcceptLanguage,
} from "./config";

describe("i18n config", () => {
  it("exports the supported locale configuration", () => {
    expect(LOCALES).toEqual(["en", "es"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
  });

  it("accepts supported locales and rejects missing or unsupported values", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("es")).toBe(true);
    expect(isValidLocale("EN")).toBe(false);
    expect(isValidLocale("")).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
    expect(isValidLocale(null)).toBe(false);
  });

  it("uses the first supported language with the highest quality", () => {
    expect(parseAcceptLanguage("fr-FR;q=0.9,es-MX;q=0.8,en;q=0.7")).toBe("es");
    expect(parseAcceptLanguage("en-US,en;q=0.9,es;q=1.1")).toBe("es");
    expect(parseAcceptLanguage("es;q=abc,en;q=0.5")).toBe("es");
  });

  it("falls back when the header is absent or contains no supported language", () => {
    expect(parseAcceptLanguage(undefined)).toBe(DEFAULT_LOCALE);
    expect(parseAcceptLanguage("")).toBe(DEFAULT_LOCALE);
    expect(parseAcceptLanguage("fr-FR,de;q=0.9")).toBe(DEFAULT_LOCALE);
  });
});
