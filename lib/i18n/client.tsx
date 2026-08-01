"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "./config";
import { dictionaries } from "./locales";
import { formatString, translatePath } from "./utils";

type I18nContextType = {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  t: (key: string, params?: Record<string, string | number>) => {
    const raw = translatePath(dictionaries[DEFAULT_LOCALE], key) ?? key;
    return formatString(raw, params);
  },
});

function getClientBrowserLocale(): Locale | undefined {
  if (typeof window === "undefined") return undefined;
  const navLang = window.navigator.language || (window.navigator.languages && window.navigator.languages[0]);
  if (navLang) {
    const primaryCode = navLang.toLowerCase().split("-")[0];
    if (isValidLocale(primaryCode)) {
      return primaryCode;
    }
  }
  return undefined;
}

const subscribe = () => () => {};
const getClientSnapshot = () => getClientBrowserLocale();
const getServerSnapshot = () => undefined;

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const detectedLocale = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const locale: Locale = initialLocale ?? detectedLocale ?? DEFAULT_LOCALE;

  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];

  const t = useMemo(
    () => (key: string, params?: Record<string, string | number>): string => {
      const raw =
        translatePath(dict, key) ??
        translatePath(dictionaries[DEFAULT_LOCALE], key) ??
        key;
      return formatString(raw, params);
    },
    [dict],
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
