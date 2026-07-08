import type { ChecklistItem } from "@/types/trip";

export interface ChecklistData {
  items: ChecklistItem[];
}

/** @deprecated Legacy Firestore/localStorage shape — migrated on read. */
export type LegacyChecklistDoc = Record<string, boolean>;
