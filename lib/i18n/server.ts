import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isValidLocale,
  parseAcceptLanguage,
  type Locale,
} from "./config";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { formatString, translatePath } from "./utils";

const dictionaries = { en, es };

export async function getLocale(
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>,
): Promise<Locale> {
  // 1. Explicit query parameter ?lang=es or ?lang=en
  if (searchParams) {
    const resolvedParams = await searchParams;
    const lang = typeof resolvedParams.lang === "string" ? resolvedParams.lang : undefined;
    if (isValidLocale(lang)) {
      return lang;
    }
  }

  // 2. Cookie preference
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isValidLocale(cookieLocale)) {
      return cookieLocale;
    }
  } catch {
    // Ignore cookie reading errors outside request context
  }

  // 3. Accept-Language header automatic detection
  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    if (acceptLanguage) {
      return parseAcceptLanguage(acceptLanguage);
    }
  } catch {
    // Ignore header reading errors outside request context
  }

  return DEFAULT_LOCALE;
}

export async function getTranslations(
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>,
  overrideLocale?: Locale,
) {
  const locale = overrideLocale ?? (await getLocale(searchParams));
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];

  const t = (key: string, params?: Record<string, string | number>): string => {
    const raw = translatePath(dict, key) ?? translatePath(dictionaries[DEFAULT_LOCALE], key) ?? key;
    return formatString(raw, params);
  };

  return { t, locale };
}
