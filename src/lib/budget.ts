import {
  BedDouble,
  Tag,
  Landmark,
  ShoppingBag,
  TrainFront,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { TripDay } from "@/types/trip";
import type {
  BudgetCategoryIcon,
  BudgetCategorySpending,
  BudgetData,
  BudgetExpense,
  BudgetExpenseCategory,
  BudgetSummary,
  DailySpending,
  ExpenseFilters,
  LegacyBudgetExpenseCategory,
  LegacyBudgetData,
} from "@/types/budget";

export const BUDGET_CATEGORY_ICONS: Record<BudgetCategoryIcon, LucideIcon> = {
  food: UtensilsCrossed,
  transport: TrainFront,
  shopping: ShoppingBag,
  attraction: Landmark,
  hotel: BedDouble,
  other: Tag,
};

export const BUDGET_EXPENSE_CATEGORY_ICONS: Record<BudgetExpenseCategory, LucideIcon> = {
  ...BUDGET_CATEGORY_ICONS,
};

export const BUDGET_EXPENSE_CATEGORIES: BudgetExpenseCategory[] = [
  "food",
  "transport",
  "shopping",
  "attraction",
  "hotel",
  "other",
];

export const BUDGET_PAYMENT_METHODS = ["cash", "card", "icoca", "mobile"] as const;

export const BUDGET_CURRENCIES = ["THB", "JPY", "USD"] as const;

const categoryTemplates: BudgetCategorySpending[] = [
  { id: "food", label: "Food", icon: "food", spent: 0, allocated: 0 },
  { id: "transport", label: "Transport", icon: "transport", spent: 0, allocated: 0 },
  { id: "shopping", label: "Shopping", icon: "shopping", spent: 0, allocated: 0 },
  { id: "attraction", label: "Attraction", icon: "attraction", spent: 0, allocated: 0 },
  { id: "hotel", label: "Hotel", icon: "hotel", spent: 0, allocated: 0 },
  { id: "other", label: "Other", icon: "other", spent: 0, allocated: 0 },
];

export function createExpenseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isExpenseCategory(value: unknown): value is BudgetExpenseCategory {
  return typeof value === "string" && BUDGET_EXPENSE_CATEGORIES.includes(value as BudgetExpenseCategory);
}

function normalizeExpenseCategory(value: unknown): BudgetExpenseCategory | null {
  if (isExpenseCategory(value)) return value;

  const legacy = value as LegacyBudgetExpenseCategory;
  if (legacy === "flight" || legacy === "train") return "transport";
  if (legacy === "activities") return "attraction";
  return null;
}

function isPaymentMethod(value: unknown): value is BudgetExpense["paymentMethod"] {
  return typeof value === "string" && BUDGET_PAYMENT_METHODS.includes(value as BudgetExpense["paymentMethod"]);
}

function normalizeExpense(value: unknown, defaultCurrency = "THB"): BudgetExpense | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<BudgetExpense>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.amount !== "number" ||
    typeof candidate.date !== "string" ||
    !normalizeExpenseCategory(candidate.category)
  ) {
    return null;
  }

  const category = normalizeExpenseCategory(candidate.category);
  if (!category) return null;

  const expense: BudgetExpense = {
    id: candidate.id,
    title: candidate.title.trim(),
    category,
    amount: Math.max(0, candidate.amount),
    currency: typeof candidate.currency === "string" && candidate.currency.trim() ? candidate.currency.trim() : defaultCurrency,
    date: candidate.date,
    paymentMethod: isPaymentMethod(candidate.paymentMethod) ? candidate.paymentMethod : "cash",
  };

  const note = typeof candidate.note === "string" ? candidate.note.trim() : "";
  if (note) expense.note = note;

  const receiptPhotoUrl = typeof candidate.receiptPhotoUrl === "string" ? candidate.receiptPhotoUrl : "";
  if (receiptPhotoUrl) expense.receiptPhotoUrl = receiptPhotoUrl;

  const receiptPhotoPath = typeof candidate.receiptPhotoPath === "string" ? candidate.receiptPhotoPath : "";
  if (receiptPhotoPath) expense.receiptPhotoPath = receiptPhotoPath;

  const merchant = typeof candidate.merchant === "string" ? candidate.merchant.trim() : "";
  if (merchant) expense.merchant = merchant;

  return expense;
}

export function normalizeBudgetData(value: unknown, defaultCurrency = "THB"): BudgetData {
  if (!value || typeof value !== "object") {
    return { expenses: [] };
  }

  const candidate = value as BudgetData & LegacyBudgetData;
  const totalBudget = typeof candidate.totalBudget === "number" && Number.isFinite(candidate.totalBudget)
    ? Math.max(0, candidate.totalBudget)
    : undefined;
  const currency = typeof candidate.currency === "string" && candidate.currency.trim()
    ? candidate.currency.trim()
    : undefined;

  if (Array.isArray(candidate.expenses)) {
    return {
      expenses: candidate.expenses
        .map((expense) => normalizeExpense(expense, defaultCurrency))
        .filter((expense): expense is BudgetExpense => expense !== null),
      totalBudget,
      currency,
    };
  }

  return {
    ...migrateLegacyBudget(candidate, defaultCurrency),
    totalBudget,
    currency,
  };
}

export function migrateLegacyBudget(legacy: LegacyBudgetData, defaultCurrency = "THB"): BudgetData {
  const expenses: BudgetExpense[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (Array.isArray(legacy.categories)) {
    for (const category of legacy.categories) {
      if (typeof category.spent !== "number" || category.spent <= 0) continue;
      const icon = category.icon;
      expenses.push({
        id: createExpenseId(),
        title: category.label,
        category: normalizeExpenseCategory(icon) ?? "other",
        amount: category.spent,
        currency: defaultCurrency,
        date: today,
        paymentMethod: "cash",
      });
    }
  }

  return { expenses };
}

function aggregateCategories(expenses: BudgetExpense[], totalBudget: number): BudgetCategorySpending[] {
  const spentByIcon = new Map<BudgetCategoryIcon, number>();
  const allocated = Math.round(totalBudget / categoryTemplates.length);

  for (const expense of expenses) {
    spentByIcon.set(expense.category, (spentByIcon.get(expense.category) ?? 0) + expense.amount);
  }

  return categoryTemplates.map((template) => ({
    ...template,
    allocated,
    spent: spentByIcon.get(template.icon) ?? 0,
  }));
}

function aggregateDailySpending(expenses: BudgetExpense[], tripDays: TripDay[]): DailySpending[] {
  if (tripDays.length === 0) return [];

  return tripDays.map((day) => ({
    day: day.dayNumber,
    label: `Day ${day.dayNumber}`,
    amount: expenses
      .filter((expense) => expense.date === day.date)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));
}

export function calculateBudgetSummary({
  expenses,
  totalBudget,
  tripDays = [],
}: {
  expenses: BudgetExpense[];
  totalBudget: number;
  tripDays?: TripDay[];
}): BudgetSummary {
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const spentPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return {
    totalBudget,
    totalSpent,
    remaining,
    spentPercent,
    categories: aggregateCategories(expenses, totalBudget),
    dailySpending: aggregateDailySpending(expenses, tripDays),
  };
}

export function sortExpensesByDate(expenses: BudgetExpense[]) {
  return [...expenses].sort((left, right) => right.date.localeCompare(left.date) || right.title.localeCompare(left.title));
}

export function filterExpenses(expenses: BudgetExpense[], filters: ExpenseFilters) {
  const query = filters.query.trim().toLowerCase();

  return expenses.filter((expense) => {
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    if (filters.date !== "all" && expense.date !== filters.date) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      expense.title,
      expense.note ?? "",
      expense.currency,
      expense.paymentMethod,
      expense.category,
      expense.merchant ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function hasActiveExpenseFilters(filters: ExpenseFilters) {
  return filters.query.trim().length > 0 || filters.category !== "all" || filters.date !== "all";
}
