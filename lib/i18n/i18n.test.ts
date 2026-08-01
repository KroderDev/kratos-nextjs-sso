import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, isValidLocale } from "./config";
import { dictionaries, en } from "./locales";
import { formatString, translatePath } from "./utils";

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).reduce((acc: string[], key) => {
    const pre = prefix ? `${prefix}.` : "";
    if (typeof obj[key] === "object" && obj[key] !== null) {
      acc.push(...getKeys(obj[key] as Record<string, unknown>, pre + key));
    } else {
      acc.push(pre + key);
    }
    return acc;
  }, []);
}

describe("i18n configuration and health audit", () => {
  it("parses Accept-Language headers correctly", () => {
    expect(parseAcceptLanguage("es-ES,es;q=0.9,en;q=0.8")).toBe("es");
    expect(parseAcceptLanguage("es-MX,es;q=0.8")).toBe("es");
    expect(parseAcceptLanguage("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9")).toBe("en");
    expect(parseAcceptLanguage(null)).toBe("en");
  });

  it("validates locale strings against registered dictionaries", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("es")).toBe(true);
    expect(isValidLocale("invalid-lang")).toBe(false);
    expect(isValidLocale(null)).toBe(false);
  });

  it("interpolates parameters in translation templates and handles missing parameters", () => {
    expect(formatString("Hello {name}!", { name: "Antigravity" })).toBe("Hello Antigravity!");
    expect(formatString("Expires {date}", { date: "Jan 1, 2026" })).toBe("Expires Jan 1, 2026");
    expect(formatString("Hello {name} ({role})", { name: "Alice" })).toBe("Hello Alice ({role})");
    expect(formatString("No parameters")).toBe("No parameters");
  });

  it("resolves nested key paths and returns undefined for sub-trees or non-existent keys", () => {
    expect(translatePath(en, "common.navigation.signIn")).toBe("Sign in");
    expect(translatePath(dictionaries.es, "common.navigation.signIn")).toBe("Iniciar sesión");
    expect(translatePath(en, "common.navigation")).toBeUndefined();
    expect(translatePath(en, "non.existent.key")).toBeUndefined();
  });

  it("enforces 100% key parity across all registered locale dictionaries", () => {
    const enKeys = getKeys(en as unknown as Record<string, unknown>).sort();

    for (const [locale, dict] of Object.entries(dictionaries)) {
      if (locale === "en") continue;
      const localeKeys = getKeys(dict as unknown as Record<string, unknown>).sort();
      expect(localeKeys, `Locale '${locale}' is missing keys present in 'en'`).toEqual(enKeys);
    }
  });

  it("provides the new social login and provider action translation keys in every locale", () => {
    expect(en.ory.nodes.login).toBe("Login");
    expect(en.ory.nodes.continueWith).toBe("Continue with {provider}");
    expect(en.ory.nodes.socialLogin).toBe("Sign in with a social account");
    expect(en.ory.nodes.emailDivider).toBe("Or");
    expect(en.ory.nodes.emailDividerCompact).toBe("Or continue with");

    expect(dictionaries.es.ory.nodes.login).toBe("Iniciar sesión");
    expect(dictionaries.es.ory.nodes.continueWith).toBe("Continuar con {provider}");
    expect(dictionaries.es.ory.nodes.socialLogin).toBe("Iniciar sesión con una cuenta social");
    expect(dictionaries.es.ory.nodes.emailDivider).toBe("O");
    expect(dictionaries.es.ory.nodes.emailDividerCompact).toBe("O continúa con");
  });

  it("interpolates the {provider} placeholder consistently across locales", () => {
    expect(formatString(en.ory.nodes.continueWith, { provider: "Google" })).toBe(
      "Continue with Google",
    );
    expect(formatString(dictionaries.es.ory.nodes.continueWith, { provider: "Google" })).toBe(
      "Continuar con Google",
    );
  });

  it("reflects the updated auth copy referenced by the smoke tests", () => {
    expect(en.auth.login.footer.createOne).toBe("Create an account");
    expect(en.auth.registration.title).toBe("Create your account");
    expect(en.auth.recovery.title).toBe("Recover your account");
    expect(en.auth.verification.title).toBe("Verify your email address");
    expect(en.auth.error.title).toBe("Unable to complete request");
  });
});
