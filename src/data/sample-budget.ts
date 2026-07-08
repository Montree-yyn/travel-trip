import type { BudgetCategoryIcon, BudgetCategorySpending, DailySpending, LegacyBudgetData } from "@/types/budget";

import budgetDataJson from "./budget.json";

const budgetData = budgetDataJson as LegacyBudgetData;

export const categorySpending: BudgetCategorySpending[] = Array.isArray(budgetData.categories)
  ? budgetData.categories.map((category) => ({
      ...category,
      icon: normalizeIcon(category.icon),
    }))
  : [];
export const dailySpending: DailySpending[] = Array.isArray(budgetData.dailySpending)
  ? budgetData.dailySpending
  : [];

function normalizeIcon(icon: string): BudgetCategoryIcon {
  if (icon === "flight" || icon === "train") return "transport";
  if (icon === "activities") return "attraction";
  if (icon === "food" || icon === "hotel" || icon === "transport" || icon === "shopping" || icon === "attraction") return icon;
  return "other";
}
