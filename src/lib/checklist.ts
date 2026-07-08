import { BriefcaseMedical, Cpu, FileText, Shirt, Wallet, type LucideIcon } from "lucide-react";

import { sampleChecklist } from "@/data/sample-checklist";
import type { ChecklistData, LegacyChecklistDoc } from "@/types/checklist";
import type { ChecklistItem } from "@/types/trip";

type ChecklistCategory = ChecklistItem["category"];

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  "documents",
  "money",
  "packing",
  "electronics",
  "health",
];

export const CHECKLIST_CATEGORY_ORDER = CHECKLIST_CATEGORIES;

export function createChecklistItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isChecklistCategory(value: unknown): value is ChecklistCategory {
  return typeof value === "string" && CHECKLIST_CATEGORIES.includes(value as ChecklistCategory);
}

function normalizeItem(value: unknown): ChecklistItem | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ChecklistItem>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.label !== "string" ||
    !isChecklistCategory(candidate.category)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    label: candidate.label.trim(),
    category: candidate.category,
    checked: Boolean(candidate.checked),
  };
}

function isLegacyChecklistDoc(value: unknown): value is LegacyChecklistDoc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if ("items" in value) return false;
  return Object.values(value).every((entry) => typeof entry === "boolean");
}

function migrateLegacyChecklist(legacy: LegacyChecklistDoc, seedItems: ChecklistItem[]): ChecklistData {
  return {
    items: seedItems.map((item) => ({
      ...item,
      checked: legacy[item.id] ?? item.checked,
    })),
  };
}

export function normalizeChecklistData(
  value: unknown,
  seedItems: ChecklistItem[] = sampleChecklist,
): ChecklistData {
  if (!value || typeof value !== "object") {
    return { items: seedItems.map((item) => ({ ...item })) };
  }

  if (isLegacyChecklistDoc(value)) {
    return migrateLegacyChecklist(value, seedItems);
  }

  const candidate = value as ChecklistData;
  if (Array.isArray(candidate.items)) {
    return {
      items: candidate.items
        .map(normalizeItem)
        .filter((item): item is ChecklistItem => item !== null),
    };
  }

  return { items: seedItems.map((item) => ({ ...item })) };
}

export const CHECKLIST_CATEGORY_ICONS: Record<ChecklistCategory, LucideIcon> = {
  documents: FileText,
  packing: Shirt,
  electronics: Cpu,
  money: Wallet,
  health: BriefcaseMedical,
};

export const CHECKLIST_CATEGORY_LABEL_KEYS: Record<ChecklistCategory, string> = {
  documents: "checklistCategories.documents",
  packing: "checklistCategories.packing",
  electronics: "checklistCategories.electronics",
  money: "checklistCategories.money",
  health: "checklistCategories.health",
};
