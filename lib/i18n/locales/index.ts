import { en, type TranslationKeys } from "./en";
import { es } from "./es";

export const dictionaries = {
  en,
  es,
} as const;

export type SupportedLocale = keyof typeof dictionaries;
export const LOCALES = Object.keys(dictionaries) as SupportedLocale[];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export { en, es, type TranslationKeys };
