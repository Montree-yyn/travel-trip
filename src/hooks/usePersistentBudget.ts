import { useCallback, useEffect, useRef, useState } from "react";

import { createExpenseId } from "@/lib/budget";
import { BUDGET_STORAGE_CHANGED_EVENT, readBudgetFromStorage, writeBudgetToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type { BudgetData, BudgetExpense } from "@/types/budget";

export type BudgetExpenseInput = Omit<BudgetExpense, "id">;

function applyBudgetDefaults(data: BudgetData, defaultTotalBudget?: number, defaultCurrency?: string): BudgetData {
  return {
    expenses: data.expenses,
    totalBudget: typeof data.totalBudget === "number" ? data.totalBudget : defaultTotalBudget,
    currency: data.currency ?? defaultCurrency,
    lastUpdated: data.lastUpdated,
  };
}

export function usePersistentBudget({
  defaultTotalBudget,
  defaultCurrency,
}: {
  defaultTotalBudget?: number;
  defaultCurrency?: string;
} = {}) {
  const { ready, syncVersion, saveBudget } = useTripSync();
  const [data, setData] = useState(() => applyBudgetDefaults(readBudgetFromStorage(), defaultTotalBudget, defaultCurrency));
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!ready) return;
    skipNextSave.current = true;
    setData(applyBudgetDefaults(readBudgetFromStorage(), defaultTotalBudget, defaultCurrency));
  }, [defaultCurrency, defaultTotalBudget, ready, syncVersion]);

  useEffect(() => {
    function handleBudgetStorageChanged() {
      skipNextSave.current = true;
      setData(applyBudgetDefaults(readBudgetFromStorage(), defaultTotalBudget, defaultCurrency));
    }

    window.addEventListener(BUDGET_STORAGE_CHANGED_EVENT, handleBudgetStorageChanged);
    return () => window.removeEventListener(BUDGET_STORAGE_CHANGED_EVENT, handleBudgetStorageChanged);
  }, [defaultCurrency, defaultTotalBudget]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    writeBudgetToStorage(data);
    void saveBudget(data);
  }, [data, ready, saveBudget]);

  const expenses = data.expenses;
  const totalBudget = data.totalBudget ?? defaultTotalBudget ?? 0;
  const currency = data.currency ?? defaultCurrency ?? "THB";
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(totalBudget - spent, 0);
  const lastUpdated = data.lastUpdated;

  const touchBudget = useCallback((budget: BudgetData): BudgetData => ({
    ...budget,
    lastUpdated: new Date().toISOString(),
  }), []);

  const addExpense = useCallback((input: BudgetExpenseInput) => {
    setData((current) => touchBudget({
      ...current,
      expenses: [...current.expenses, { ...input, id: createExpenseId() }],
    }));
  }, [touchBudget]);

  const updateExpense = useCallback((id: string, input: BudgetExpenseInput) => {
    setData((current) => touchBudget({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id ? { ...input, id } : expense,
      ),
    }));
  }, [touchBudget]);

  const deleteExpense = useCallback((id: string) => {
    setData((current) => touchBudget({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }));
  }, [touchBudget]);

  const updateBudgetSettings = useCallback(({ totalBudget, currency }: { totalBudget: number; currency: string }) => {
    setData((current) => touchBudget({
      ...current,
      totalBudget,
      currency,
    }));
  }, [touchBudget]);

  return {
    expenses,
    totalBudget,
    spent,
    remaining,
    currency,
    lastUpdated,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudgetSettings,
  };
}
