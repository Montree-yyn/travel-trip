import { useCallback, useEffect, useRef, useState } from "react";

import { createExpenseId } from "@/lib/budget";
import { readBudgetFromStorage, writeBudgetToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type { BudgetData, BudgetExpense } from "@/types/budget";

export type BudgetExpenseInput = Omit<BudgetExpense, "id">;

function applyBudgetDefaults(data: BudgetData, defaultTotalBudget?: number, defaultCurrency?: string): BudgetData {
  return {
    expenses: data.expenses,
    totalBudget: typeof data.totalBudget === "number" ? data.totalBudget : defaultTotalBudget,
    currency: data.currency ?? defaultCurrency,
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

  const addExpense = useCallback((input: BudgetExpenseInput) => {
    setData((current) => ({
      ...current,
      expenses: [...current.expenses, { ...input, id: createExpenseId() }],
    }));
  }, []);

  const updateExpense = useCallback((id: string, input: BudgetExpenseInput) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id ? { ...input, id } : expense,
      ),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }));
  }, []);

  const updateBudgetSettings = useCallback(({ totalBudget, currency }: { totalBudget: number; currency: string }) => {
    setData((current) => ({
      ...current,
      totalBudget,
      currency,
    }));
  }, []);

  return {
    expenses,
    totalBudget,
    currency,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudgetSettings,
  };
}
