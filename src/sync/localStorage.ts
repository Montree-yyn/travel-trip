import { normalizeBudgetData } from "@/lib/budget";
import { normalizeChecklistData } from "@/lib/checklist";
import { normalizeMemoriesData } from "@/lib/memories";
import { normalizeTranslatorData } from "@/lib/translator";
import type { Locale } from "@/i18n";
import type { ThemeMode } from "@/theme/theme-context";
import type { BudgetData } from "@/types/budget";

import { SYNC_STORAGE_KEYS } from "./keys";
import type {
  TripBudgetDoc,
  TripChecklistDoc,
  TripFavoritesDoc,
  TripMemoriesDoc,
  TripSettingsDoc,
  TripTranslatorDoc,
  TripVisitedDoc,
} from "./types";

const defaultBudget: BudgetData = { expenses: [] };

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readStringArray(key: string, fallback: string[] = []) {
  const parsed = readJson<unknown>(key, fallback);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : fallback;
}

export function readThemeFromStorage(): ThemeMode {
  const stored = window.localStorage.getItem(SYNC_STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function readLocaleFromStorage(): Locale {
  const stored = window.localStorage.getItem(SYNC_STORAGE_KEYS.locale);
  return stored === "th" ? "th" : "en";
}

export function readSettingsFromStorage(): TripSettingsDoc {
  return {
    theme: readThemeFromStorage(),
    locale: readLocaleFromStorage(),
  };
}

export function writeSettingsToStorage(settings: Partial<TripSettingsDoc>) {
  if (settings.theme) {
    window.localStorage.setItem(SYNC_STORAGE_KEYS.theme, settings.theme);
  }
  if (settings.locale) {
    window.localStorage.setItem(SYNC_STORAGE_KEYS.locale, settings.locale);
  }
}

export function readFavoritesFromStorage(): TripFavoritesDoc {
  return {
    places: readStringArray(SYNC_STORAGE_KEYS.placeFavorites),
    restaurants: readStringArray(SYNC_STORAGE_KEYS.restaurantFavorites),
  };
}

export function writeFavoritesToStorage(favorites: TripFavoritesDoc) {
  writeJson(SYNC_STORAGE_KEYS.placeFavorites, favorites.places);
  writeJson(SYNC_STORAGE_KEYS.restaurantFavorites, favorites.restaurants);
}

export function readVisitedFromStorage(): TripVisitedDoc {
  return { ids: readStringArray(SYNC_STORAGE_KEYS.visited) };
}

export function writeVisitedToStorage(visited: TripVisitedDoc) {
  writeJson(SYNC_STORAGE_KEYS.visited, visited.ids);
}

export function readChecklistFromStorage(): TripChecklistDoc {
  const parsed = readJson<unknown>(SYNC_STORAGE_KEYS.checklist, null);
  return normalizeChecklistData(parsed);
}

export function writeChecklistToStorage(checklist: TripChecklistDoc) {
  writeJson(SYNC_STORAGE_KEYS.checklist, checklist);
}

export function readMemoriesFromStorage(): TripMemoriesDoc {
  const parsed = readJson<unknown>(SYNC_STORAGE_KEYS.memories, null);
  return normalizeMemoriesData(parsed);
}

export function writeMemoriesToStorage(memories: TripMemoriesDoc) {
  writeJson(SYNC_STORAGE_KEYS.memories, memories);
}

export function readBudgetFromStorage(): TripBudgetDoc {
  const parsed = readJson<unknown>(SYNC_STORAGE_KEYS.budget, defaultBudget);
  return normalizeBudgetData(parsed);
}

export function writeBudgetToStorage(budget: TripBudgetDoc) {
  writeJson(SYNC_STORAGE_KEYS.budget, budget);
}

export function readTranslatorFromStorage(): TripTranslatorDoc {
  const parsed = readJson<unknown>((SYNC_STORAGE_KEYS.translator), null);
  return normalizeTranslatorData(parsed);
}

export function writeTranslatorToStorage(translator: TripTranslatorDoc) {
  writeJson(SYNC_STORAGE_KEYS.translator, translator);
}

export function readStringSet(key: string, fallback: string[] = []) {
  return new Set(readStringArray(key, fallback));
}

export function writeStringSet(key: string, items: Set<string>) {
  writeJson(key, [...items]);
}
