import { LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "./locales";

export { LOCALES, DEFAULT_LOCALE };
export type Locale = SupportedLocale;

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isValidLocale(locale: string | undefined | null): locale is Locale {
  return typeof locale === "string" && (LOCALES as readonly string[]).includes(locale);
}

export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  // Parse standard Accept-Language header, e.g. "es-ES,es;q=0.9,en;q=0.8"
  const preferences = header
    .split(",")
    .map((item) => {
      const [lang, qPart] = item.trim().split(";");
      const quality = qPart && qPart.startsWith("q=") ? parseFloat(qPart.slice(2)) : 1.0;
      const code = lang?.toLowerCase().split("-")[0];
      return { code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const pref of preferences) {
    if (isValidLocale(pref.code)) {
      return pref.code;
    }
  }

  return DEFAULT_LOCALE;
}
