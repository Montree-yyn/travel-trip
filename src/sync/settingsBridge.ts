import type { Locale } from "@/i18n";
import type { ThemeMode } from "@/theme/theme-context";

import { readLocaleFromStorage, readSettingsFromStorage, readThemeFromStorage } from "./localStorage";
import type { TripSettingsDoc } from "./types";

export const SETTINGS_SYNC_EVENT = "travel-trip-settings-sync";

type SettingsSaveHandler = (settings: TripSettingsDoc) => Promise<void>;

let saveHandler: SettingsSaveHandler | null = null;

export function registerSettingsSaveHandler(handler: SettingsSaveHandler | null) {
  saveHandler = handler;
}

export function dispatchSettingsSync(settings: Partial<TripSettingsDoc>) {
  window.dispatchEvent(new CustomEvent(SETTINGS_SYNC_EVENT, { detail: settings }));
}

export async function saveSettingsPartial(partial: Partial<TripSettingsDoc>) {
  const settings: TripSettingsDoc = {
    theme: partial.theme ?? readThemeFromStorage(),
    locale: partial.locale ?? readLocaleFromStorage(),
  };

  if (saveHandler && navigator.onLine) {
    try {
      await saveHandler(settings);
    } catch {
      // localStorage remains the offline fallback
    }
  }
}

export function getCurrentSettings(): TripSettingsDoc {
  return readSettingsFromStorage();
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "th";
}
