import { motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DataErrorState,
  EmptyState,
  GenericPageSkeleton,
  IconButton,
  SectionHeader,
  ThemeToggle,
} from "@/components/ui";
import { PageHeader, PageLoadingGate } from "@/components/layout";
import { TripBudgetCard } from "@/components/trip/TripBudgetCard";
import { sampleTrip } from "@/data/sample-trip";
import { staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import {
  calculateBudgetSummary,
  filterExpenses,
  sortExpensesByDate,
} from "@/lib/budget";
import { getCurrentTripDay } from "@/lib/trip-progress";
import { useTripSync } from "@/sync";
import type { BudgetExpense, ExpenseFilters } from "@/types/budget";

import { ExpenseCard } from "./components/ExpenseCard";
import { ExpenseDeleteDialog } from "./components/ExpenseDeleteDialog";
import { ExpenseFiltersBar } from "./components/ExpenseFiltersBar";
import { ExpenseFormDialog } from "./components/ExpenseFormDialog";
import { TotalBudgetDialog } from "./components/TotalBudgetDialog";

const defaultFilters: ExpenseFilters = {
  query: "",
  category: "all",
  currency: "all",
  date: "all",
};

export function BudgetPage() {
  const { t } = useTranslation();
  const { ready, error: syncError, retry } = useTripSync();
  const defaultCurrency = sampleTrip.budget.currency;
  const {
    expenses,
    totalBudget,
    currencyBudgets,
    walletSummaries,
    currency,
    error: budgetError,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudgetSettings,
  } = usePersistentBudget({
    defaultTotalBudget: sampleTrip.budget.totalMax,
    defaultCurrency,
  });
  const [filters, setFilters] = useState<ExpenseFilters>(defaultFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeExpense, setActiveExpense] = useState<BudgetExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetExpense | null>(null);

  const currentDay = getCurrentTripDay(sampleTrip);
  const defaultDate = currentDay.date;

  const filteredExpenses = useMemo(
    () => sortExpensesByDate(filterExpenses(expenses, filters)),
    [expenses, filters],
  );

  const budgetSummary = useMemo(
    () =>
      calculateBudgetSummary({
        expenses,
        totalBudget,
        tripDays: sampleTrip.itinerary,
      }),
    [expenses, totalBudget],
  );

  function openAddDialog() {
    setFormMode("add");
    setActiveExpense(null);
    setFormOpen(true);
  }

  function openEditDialog(expense: BudgetExpense) {
    setFormMode("edit");
    setActiveExpense(expense);
    setFormOpen(true);
  }

  if (!ready) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
        <GenericPageSkeleton />
      </div>
    );
  }

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative flex flex-col gap-4 pb-28">
        <PageHeader title={t("budget.title")} subtitle={t("budget.subtitle")} actions={<ThemeToggle />} />

        {(syncError || budgetError) && (
          <div className="px-5">
            <DataErrorState
              titleKey="budget.syncErrorTitle"
              description={budgetError || t("sync.unavailable")}
              onRetry={retry}
            />
          </div>
        )}

        <TripBudgetCard
          totalBudget={budgetSummary.totalBudget}
          spent={budgetSummary.totalSpent}
          remaining={budgetSummary.remaining}
          currency={currency}
          wallets={walletSummaries}
          onEdit={() => setBudgetDialogOpen(true)}
        />

        {expenses.length > 0 && (
          <ExpenseFiltersBar filters={filters} tripDays={sampleTrip.itinerary} onChange={setFilters} />
        )}

        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("budget.expenses")} />
          {expenses.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t("empty.budget.title")}
              description={t("empty.budget.description")}
            />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t("empty.budgetNoResults.title")}
              description={t("empty.budgetNoResults.description")}
            />
          ) : (
            <motion.div variants={staggerContainer} className="flex flex-col gap-3">
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={() => openEditDialog(expense)}
                  onDelete={() => setDeleteTarget(expense)}
                />
              ))}
            </motion.div>
          )}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-md justify-end px-5 md:max-w-lg lg:max-w-xl">
          <IconButton
            variant="solid"
            size="lg"
            aria-label={t("budget.addExpense")}
            className="pointer-events-auto glow-accent"
            onClick={openAddDialog}
          >
            <Plus size={22} strokeWidth={2.25} />
          </IconButton>
        </div>

        <ExpenseFormDialog
          open={formOpen}
          mode={formMode}
          initialExpense={activeExpense ?? undefined}
          defaultDate={defaultDate}
          defaultCurrency={currency}
          onClose={() => setFormOpen(false)}
          onDelete={
            activeExpense
              ? () => {
                  setFormOpen(false);
                  setDeleteTarget(activeExpense);
                }
              : undefined
          }
          onSave={(input) => {
            if (formMode === "edit" && activeExpense) {
              updateExpense(activeExpense.id, input);
              return;
            }
            addExpense(input);
          }}
        />

        <ExpenseDeleteDialog
          open={deleteTarget !== null}
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) deleteExpense(deleteTarget.id);
          }}
        />

        <TotalBudgetDialog
          open={budgetDialogOpen}
          budgets={currencyBudgets}
          onClose={() => setBudgetDialogOpen(false)}
          onSave={updateBudgetSettings}
        />
      </motion.div>
    </PageLoadingGate>
  );
}

export default BudgetPage;
