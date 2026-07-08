import type { BudgetData } from "@/types/budget";
import type { ChecklistData } from "@/types/checklist";
import type { MemoriesData } from "@/types/memory";
import type { TranslatorData } from "@/types/translator";
import type { Locale } from "@/i18n";
import type { ThemeMode } from "@/theme/theme-context";

export const SYNC_DOC_ID = "data";

export interface TripSettingsDoc {
  theme: ThemeMode;
  locale: Locale;
}

export interface TripFavoritesDoc {
  places: string[];
  restaurants: string[];
}

export interface TripVisitedDoc {
  ids: string[];
}

export type TripChecklistDoc = ChecklistData;
export type TripMemoriesDoc = MemoriesData;
export type TripBudgetDoc = BudgetData;
export type TripTranslatorDoc = TranslatorData;

export type SyncStatus = "synced" | "offline" | "error";

export interface TripSyncSnapshot {
  settings: TripSettingsDoc | null;
  favorites: TripFavoritesDoc | null;
  visited: TripVisitedDoc | null;
  checklist: TripChecklistDoc | null;
  memories: TripMemoriesDoc | null;
  budget: TripBudgetDoc | null;
  translator: TripTranslatorDoc | null;
}
