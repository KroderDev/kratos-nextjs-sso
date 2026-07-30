import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, isValidLocale } from "./config";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { formatString, translatePath } from "./utils";

describe("i18n configuration and helpers", () => {
  it("parses Accept-Language headers correctly", () => {
    expect(parseAcceptLanguage("es-ES,es;q=0.9,en;q=0.8")).toBe("es");
    expect(parseAcceptLanguage("es-MX,es;q=0.8")).toBe("es");
    expect(parseAcceptLanguage("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9")).toBe("en");
    expect(parseAcceptLanguage(null)).toBe("en");
  });

  it("validates locale strings", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("es")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);
    expect(isValidLocale(null)).toBe(false);
  });

  it("interpolates parameters in translation templates", () => {
    expect(formatString("Hello {name}!", { name: "Antigravity" })).toBe("Hello Antigravity!");
    expect(formatString("Expires {date}", { date: "Jan 1, 2026" })).toBe("Expires Jan 1, 2026");
  });

  it("resolves nested key paths", () => {
    expect(translatePath(en, "common.navigation.signIn")).toBe("Sign in");
    expect(translatePath(es, "common.navigation.signIn")).toBe("Iniciar sesión");
    expect(translatePath(en, "non.existent.key")).toBeUndefined();
  });

  it("has 100% key parity between English and Spanish locale dictionaries", () => {
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

    const enKeys = getKeys(en as unknown as Record<string, unknown>).sort();
    const esKeys = getKeys(es as unknown as Record<string, unknown>).sort();

    expect(esKeys).toEqual(enKeys);
  });
});
