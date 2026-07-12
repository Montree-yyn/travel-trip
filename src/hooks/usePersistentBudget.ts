import {
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { BUDGET_WALLET_CURRENCIES, calculateWalletSummaries, createExpenseId, normalizeBudgetData } from "@/lib/budget";
import { readBudgetFromStorage } from "@/sync/localStorage";
import {
  getActiveTripId,
  legacyUserTripSubDoc,
  sanitizeFirestoreData,
  sharedTripCollection,
  sharedTripSubDoc,
} from "@/sync/sharedTrip";
import type { BudgetCurrency, BudgetData, BudgetExpense } from "@/types/budget";

export type BudgetExpenseInput = Omit<BudgetExpense, "id">;
export type BudgetSettingsInput = {
  totalBudget?: number;
  currency?: string;
  budgets?: Partial<Record<BudgetCurrency, number>>;
};

const settingsDocId = "settings";
const emptyBudget: BudgetData = { expenses: [] };

function applyBudgetDefaults(data: BudgetData, defaultTotalBudget?: number, defaultCurrency?: string): BudgetData {
  const fallbackCurrency = isWalletCurrency(defaultCurrency) ? defaultCurrency : "THB";
  const fallbackBudgets = createDefaultBudgets(defaultTotalBudget, fallbackCurrency);

  return {
    expenses: data.expenses,
    totalBudget: typeof data.totalBudget === "number" ? data.totalBudget : defaultTotalBudget,
    budgets: {
      ...fallbackBudgets,
      ...data.budgets,
    },
    currency: data.currency ?? defaultCurrency,
    lastUpdated: data.lastUpdated,
  };
}

function isWalletCurrency(value: unknown): value is BudgetCurrency {
  return typeof value === "string" && BUDGET_WALLET_CURRENCIES.includes(value as BudgetCurrency);
}

function createDefaultBudgets(defaultTotalBudget?: number, defaultCurrency?: BudgetCurrency): Record<BudgetCurrency, number> {
  return {
    THB: defaultCurrency === "THB" ? defaultTotalBudget ?? 0 : 0,
    JPY: defaultCurrency === "JPY" ? defaultTotalBudget ?? 0 : 0,
  };
}

function normalizeUpdatedAt(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    const date = timestamp.toDate?.();
    if (date && !Number.isNaN(date.getTime())) return date.toISOString();
  }

  return undefined;
}

function readFallbackBudget(defaultCurrency?: string) {
  return normalizeBudgetData(readBudgetFromStorage(), defaultCurrency);
}

function normalizeExpenseDoc(snapshot: QueryDocumentSnapshot): BudgetExpense | null {
  const normalized = normalizeBudgetData({ expenses: [{ ...snapshot.data(), id: snapshot.id }] });
  return normalized.expenses[0] ?? null;
}

function serializeExpense({
  expense,
  tripId,
  uid,
  isCreate,
}: {
  expense: BudgetExpense;
  tripId: string;
  uid: string;
  isCreate?: boolean;
}) {
  return sanitizeFirestoreData({
    ...expense,
    tripId,
    createdAt: isCreate ? serverTimestamp() : undefined,
    updatedAt: serverTimestamp(),
    createdBy: isCreate ? uid : undefined,
    updatedBy: uid,
  });
}

async function migrateLegacyBudgetIfNeeded({
  uid,
  tripId,
  defaultCurrency,
}: {
  uid: string;
  tripId: string;
  defaultCurrency?: string;
}) {
  const expensesRef = sharedTripCollection(tripId, "expenses");
  const [existing, settingsSnapshot] = await Promise.all([
    getDocs(expensesRef),
    getDoc(sharedTripSubDoc(tripId, "budget", settingsDocId)),
  ]);
  if (!existing.empty || settingsSnapshot.exists()) return;

  const legacySnapshot = await getDoc(legacyUserTripSubDoc(uid, tripId, "budget"));
  const legacyBudget = legacySnapshot.exists()
    ? normalizeBudgetData(legacySnapshot.data(), defaultCurrency)
    : readFallbackBudget(defaultCurrency);
  const batch = writeBatch(expensesRef.firestore);
  for (const expense of legacyBudget.expenses) {
    batch.set(
      sharedTripSubDoc(tripId, "expenses", expense.id),
      serializeExpense({ expense, tripId, uid, isCreate: true }),
      { merge: true },
    );
  }

  batch.set(
    sharedTripSubDoc(tripId, "budget", settingsDocId),
    sanitizeFirestoreData({
      totalBudget: legacyBudget.totalBudget,
      budgets: legacyBudget.budgets ?? createDefaultBudgets(legacyBudget.totalBudget, isWalletCurrency(legacyBudget.currency) ? legacyBudget.currency : "THB"),
      currency: legacyBudget.currency,
      tripId,
      initializedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    }),
    { merge: true },
  );

  await batch.commit();
}

export function usePersistentBudget({
  defaultTotalBudget,
  defaultCurrency,
}: {
  defaultTotalBudget?: number;
  defaultCurrency?: string;
} = {}) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(() =>
    applyBudgetDefaults(
      isFirebaseConfigured() ? emptyBudget : readFallbackBudget(defaultCurrency),
      defaultTotalBudget,
      defaultCurrency,
    ),
  );
  const [error, setError] = useState("");
  const migrationKeyRef = useRef("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setData(applyBudgetDefaults(readFallbackBudget(defaultCurrency), defaultTotalBudget, defaultCurrency));
      setError("Cloud sync is not configured. Budget changes may stay on this device.");
      return;
    }

    if (authLoading || !user) return;

    const tripId = getActiveTripId();
    let expenses: BudgetExpense[] = [];
    let settings: Pick<BudgetData, "budgets" | "currency" | "lastUpdated" | "totalBudget"> = {};

    function commit() {
      setData(applyBudgetDefaults({ expenses, ...settings }, defaultTotalBudget, defaultCurrency));
    }

    const unsubscribeExpenses = onSnapshot(
      sharedTripCollection(tripId, "expenses"),
      (snapshot) => {
        expenses = snapshot.docs
          .map(normalizeExpenseDoc)
          .filter((expense): expense is BudgetExpense => expense !== null);
        commit();

        const migrationKey = `${user.uid}:${tripId}:budget`;
        if (snapshot.empty && !snapshot.metadata.fromCache && migrationKeyRef.current !== migrationKey) {
          migrationKeyRef.current = migrationKey;
          void migrateLegacyBudgetIfNeeded({ uid: user.uid, tripId, defaultCurrency }).catch((migrationError) => {
            console.error("[travel-trip-sync] Could not migrate legacy budget data", migrationError);
          });
        }
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Budget expenses snapshot failed", snapshotError);
        setError("Could not load shared budget data. Please refresh and try again.");
      },
    );

    const unsubscribeSettings = onSnapshot(
      sharedTripSubDoc(tripId, "budget", settingsDocId),
      (snapshot) => {
        const value = snapshot.data() as (Partial<BudgetData> & { updatedAt?: unknown }) | undefined;
        settings = {
          totalBudget: typeof value?.totalBudget === "number" ? value.totalBudget : undefined,
          budgets: value?.budgets,
          currency: typeof value?.currency === "string" ? value.currency : undefined,
          lastUpdated: normalizeUpdatedAt(value?.lastUpdated ?? value?.updatedAt),
        };
        commit();
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Budget settings snapshot failed", snapshotError);
        setError("Could not load shared budget settings. Please refresh and try again.");
      },
    );

    return () => {
      unsubscribeExpenses();
      unsubscribeSettings();
    };
  }, [authLoading, defaultCurrency, defaultTotalBudget, user]);

  const persistExpense = useCallback(
    (expense: BudgetExpense, isCreate?: boolean) => {
      if (!user || !isFirebaseConfigured()) return;
      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "expenses", expense.id),
        serializeExpense({ expense, tripId, uid: user.uid, isCreate }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Budget expense save failed", saveError);
        setError("Could not save this expense to the shared trip. Please try again.");
      });
    },
    [user],
  );

  const expenses = data.expenses;
  const totalBudget = data.totalBudget ?? defaultTotalBudget ?? 0;
  const currency = data.currency ?? defaultCurrency ?? "THB";
  const fallbackCurrency = isWalletCurrency(currency) ? currency : "THB";
  const currencyBudgets = useMemo(
    () => ({
      ...createDefaultBudgets(defaultTotalBudget, fallbackCurrency),
      ...data.budgets,
    }),
    [data.budgets, defaultTotalBudget, fallbackCurrency],
  );
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(totalBudget - spent, 0);
  const walletSummaries = useMemo(
    () => calculateWalletSummaries({ budgets: currencyBudgets, expenses }),
    [currencyBudgets, expenses],
  );
  const lastUpdated = data.lastUpdated;

  const addExpense = useCallback((input: BudgetExpenseInput) => {
    const expense = { ...input, id: createExpenseId() };
    setData((current) => ({
      ...current,
      expenses: [...current.expenses, expense],
      lastUpdated: new Date().toISOString(),
    }));
    persistExpense(expense, true);
  }, [persistExpense]);

  const updateExpense = useCallback((id: string, input: BudgetExpenseInput) => {
    const expense = { ...input, id };
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((currentExpense) =>
        currentExpense.id === id ? expense : currentExpense,
      ),
      lastUpdated: new Date().toISOString(),
    }));
    persistExpense(expense);
  }, [persistExpense]);

  const deleteExpense = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
      lastUpdated: new Date().toISOString(),
    }));

    if (!user || !isFirebaseConfigured()) return;
    const tripId = getActiveTripId();
    void deleteDoc(sharedTripSubDoc(tripId, "expenses", id)).catch((deleteError) => {
      console.error("[travel-trip-sync] Budget expense delete failed", deleteError);
      setError("Could not delete this expense from the shared trip. Please try again.");
    });
  }, [user]);

  const updateBudgetSettings = useCallback(({ totalBudget, currency, budgets }: BudgetSettingsInput) => {
    const nextBudgets = budgets
      ? {
          ...currencyBudgets,
          ...budgets,
        }
      : currencyBudgets;
    const nextCurrency = currency ?? "THB";
    const nextTotalBudget = typeof totalBudget === "number" ? totalBudget : nextBudgets.THB;

    setData((current) => ({
      ...current,
      totalBudget: nextTotalBudget,
      budgets: nextBudgets,
      currency: nextCurrency,
      lastUpdated: new Date().toISOString(),
    }));

    if (!user || !isFirebaseConfigured()) return;
    const tripId = getActiveTripId();
    void setDoc(
      sharedTripSubDoc(tripId, "budget", settingsDocId),
      sanitizeFirestoreData({
        totalBudget: nextTotalBudget,
        budgets: nextBudgets,
        currency: nextCurrency,
        tripId,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      }),
      { merge: true },
    ).catch((saveError) => {
      console.error("[travel-trip-sync] Budget settings save failed", saveError);
      setError("Could not save budget settings to the shared trip. Please try again.");
    });
  }, [currencyBudgets, user]);

  return {
    expenses,
    totalBudget,
    currencyBudgets,
    walletSummaries,
    spent,
    remaining,
    currency,
    lastUpdated,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudgetSettings,
  };
}
