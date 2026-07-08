import { motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, IconButton, SectionHeader } from "@/components/ui";
import { sampleTrip } from "@/data/sample-trip";
import { staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import { calculateBudgetSummary, filterExpenses, sortExpensesByDate } from "@/lib/budget";
import { getCurrentTripDay } from "@/lib/trip-progress";
import type { BudgetExpense, ExpenseFilters } from "@/types/budget";

import { ExpenseCard } from "@/pages/Budget/components/ExpenseCard";
import { ExpenseDeleteDialog } from "@/pages/Budget/components/ExpenseDeleteDialog";
import { ExpenseFormDialog } from "@/pages/Budget/components/ExpenseFormDialog";
import { WalletHeroCard } from "@/pages/Budget/components/WalletHeroCard";

const defaultFilters: ExpenseFilters = {
  query: "",
  category: "all",
  date: "all",
};

export function JourneyBudgetPanel() {
  const { t } = useTranslation();
  const { expenses, addExpense, updateExpense, deleteExpense } = usePersistentBudget();
  const [filters] = useState<ExpenseFilters>(defaultFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeExpense, setActiveExpense] = useState<BudgetExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetExpense | null>(null);

  const currentDay = getCurrentTripDay(sampleTrip);
  const defaultDate = currentDay.date;
  const defaultCurrency = sampleTrip.budget.currency;

  const filteredExpenses = useMemo(
    () => sortExpensesByDate(filterExpenses(expenses, filters)),
    [expenses, filters],
  );

  const budgetSummary = useMemo(
    () =>
      calculateBudgetSummary({
        expenses,
        totalBudget: sampleTrip.budget.totalMax,
        tripDays: sampleTrip.itinerary,
      }),
    [expenses],
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

  return (
    <>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative flex flex-col gap-5">
        <WalletHeroCard
          currency={defaultCurrency}
          spent={budgetSummary.totalSpent}
          total={budgetSummary.totalBudget}
        />

        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("budget.expenses")} />
          {expenses.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t("empty.budget.title")}
              description={t("empty.budget.description")}
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

        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex max-w-md justify-end px-5 md:max-w-lg lg:max-w-xl">
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
      </motion.div>

      <ExpenseFormDialog
        open={formOpen}
        mode={formMode}
        initialExpense={activeExpense ?? undefined}
        defaultDate={defaultDate}
        defaultCurrency={defaultCurrency}
        onClose={() => setFormOpen(false)}
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
    </>
  );
}
