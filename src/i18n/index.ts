import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isLocale, saveSettingsPartial, SETTINGS_SYNC_EVENT } from "@/sync/settingsBridge";

import en from "./en.json";
import th from "./th.json";

export type Locale = "en" | "th";

const STORAGE_KEY = "travel-trip-locale";
const catalogs: Record<Locale, Record<string, unknown>> = { en, th };

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === "string" ? value : undefined;
}

export type TranslateParams = Record<string, string | number>;

export function createTranslator(locale: Locale) {
  return function t(key: string, params?: TranslateParams) {
    let value =
      getNested(catalogs[locale], key) ??
      getNested(catalogs.en, key) ??
      key;

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replaceAll(`{{${paramKey}}}`, String(paramValue));
      }
    }

    return value;
  };
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    void saveSettingsPartial({ locale: next });
  }, []);

  useEffect(() => {
    function handleSettingsSync(event: Event) {
      const detail = (event as CustomEvent<{ locale?: Locale }>).detail;
      if (detail?.locale && isLocale(detail.locale)) {
        setLocaleState(detail.locale);
      }
    }

    window.addEventListener(SETTINGS_SYNC_EVENT, handleSettingsSync);
    return () => window.removeEventListener(SETTINGS_SYNC_EVENT, handleSettingsSync);
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslation must be used within I18nProvider");
  return context;
}

export function useLocaleDateFormatter() {
  const { locale } = useTranslation();
  return useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );
}

export function useLocaleDateTimeFormatter() {
  const { locale } = useTranslation();
  return useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [locale],
  );
}
