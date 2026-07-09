export type BudgetCategoryIcon = "food" | "transport" | "shopping" | "attraction" | "hotel" | "other";

export type BudgetExpenseCategory = BudgetCategoryIcon;

export type LegacyBudgetExpenseCategory = "flight" | "train" | "activities";

export type BudgetPaymentMethod = "cash" | "card" | "icoca" | "mobile";
export type BudgetCurrency = "THB" | "JPY";

export interface BudgetExpense {
  id: string;
  title: string;
  category: BudgetExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: BudgetPaymentMethod;
  note?: string;
  receiptPhotoUrl?: string;
  receiptPhotoPath?: string;
  merchant?: string;
}

export interface BudgetCategorySpending {
  id: string;
  label: string;
  icon: BudgetCategoryIcon;
  spent: number;
  allocated: number;
}

export interface DailySpending {
  day: number;
  label: string;
  amount: number;
}

export interface BudgetData {
  expenses: BudgetExpense[];
  totalBudget?: number;
  budgets?: Partial<Record<BudgetCurrency, number>>;
  currency?: string;
  lastUpdated?: string;
}

export interface BudgetWalletSummary {
  currency: BudgetCurrency;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  spentPercent: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  spentPercent: number;
  categories: BudgetCategorySpending[];
  dailySpending: DailySpending[];
}

export type ExpenseCategoryFilter = BudgetExpenseCategory | "all";
export type ExpenseCurrencyFilter = BudgetCurrency | "all";
export type ExpenseDateFilter = "all" | string;

export interface ExpenseFilters {
  query: string;
  category: ExpenseCategoryFilter;
  currency: ExpenseCurrencyFilter;
  date: ExpenseDateFilter;
}

/** @deprecated Legacy Firestore/localStorage shape — migrated on read. */
export interface LegacyBudgetData {
  categories?: Array<Omit<BudgetCategorySpending, "icon"> & { icon: BudgetCategoryIcon | LegacyBudgetExpenseCategory }>;
  dailySpending?: DailySpending[];
}
