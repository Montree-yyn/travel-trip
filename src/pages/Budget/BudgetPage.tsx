import { motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DataErrorState,
  EmptyState,
  GenericPageSkeleton,
  GlassCard,
  IconButton,
  ProgressRing,
  SectionHeader,
  ThemeToggle,
} from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { sampleTrip } from "@/data/sample-trip";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import {
  filterExpenses,
  sortExpensesByDate,
} from "@/lib/budget";
import { getCurrentTripDay } from "@/lib/trip-progress";
import { useTripSync } from "@/sync";
import type { BudgetCurrency, BudgetExpense, BudgetWalletSummary, ExpenseFilters } from "@/types/budget";

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

function createFallbackWallets(): BudgetWalletSummary[] {
  return ["THB", "JPY"].map((currency) => ({
    currency: currency as BudgetCurrency,
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    spentPercent: 0,
  }));
}

function WalletDashboardCard({ wallet, onEdit }: { wallet: BudgetWalletSummary; onEdit: () => void }) {
  const { t } = useTranslation();
  const isThb = wallet.currency === "THB";

  return (
    <motion.button
      type="button"
      variants={riseIn}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="glass-surface glass-shadow min-w-0 rounded-3xl p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
      aria-label={`${t("budget.editTotalBudget")} ${wallet.currency}`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-accent-strong">
            {isThb ? "🇹🇭" : "🇯🇵"} {wallet.currency} Wallet
          </p>
          <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-faint">
            {t("budget.remaining")}
          </p>
          <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">
            {wallet.remaining.toLocaleString()}
          </p>
        </div>
        <ProgressRing value={wallet.spentPercent} size={46} strokeWidth={5}>
          <span className="text-[0.625rem] font-bold text-ink">{wallet.spentPercent}%</span>
        </ProgressRing>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/55 p-2.5 text-[0.6875rem] font-semibold dark:bg-white/8">
        <span className="min-w-0">
          <span className="block text-ink-faint">{t("budget.spent")}</span>
          <span className="block truncate text-ink">{wallet.totalSpent.toLocaleString()}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-ink-faint">{t("budget.totalBudget")}</span>
          <span className="block truncate text-ink">{wallet.totalBudget.toLocaleString()}</span>
        </span>
      </div>
    </motion.button>
  );
}

function WalletDashboardSection({
  wallets,
  onEdit,
}: {
  wallets: BudgetWalletSummary[];
  onEdit: () => void;
}) {
  const safeWallets = wallets.length > 0 ? wallets : createFallbackWallets();

  return (
    <section className="flex flex-col gap-2.5 px-5">
      <div className="grid grid-cols-2 gap-2.5">
        {safeWallets.map((wallet) => (
          <WalletDashboardCard key={wallet.currency} wallet={wallet} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

function TodaysSpendingCard({ expenses, date }: { expenses: BudgetExpense[]; date: string }) {
  const { t } = useTranslation();
  const totals = {
    THB: expenses
      .filter((expense) => expense.date === date && expense.currency === "THB")
      .reduce((sum, expense) => sum + expense.amount, 0),
    JPY: expenses
      .filter((expense) => expense.date === date && expense.currency === "JPY")
      .reduce((sum, expense) => sum + expense.amount, 0),
  };

  return (
    <motion.div variants={riseIn} className="px-5">
      <GlassCard padding="sm" className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("budget.todaySpending")}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-ink-muted">
            {t("budget.filters.dayOption", { day: getCurrentTripDay(sampleTrip).dayNumber })}
          </p>
        </div>
        <div className="rounded-2xl bg-white/65 px-3 py-2 text-right dark:bg-white/8">
          <p className="text-[0.625rem] font-bold text-accent-strong">THB</p>
          <p className="text-sm font-bold text-ink">{totals.THB.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white/65 px-3 py-2 text-right dark:bg-white/8">
          <p className="text-[0.625rem] font-bold text-accent-strong">JPY</p>
          <p className="text-sm font-bold text-ink">{totals.JPY.toLocaleString()}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function BudgetPage() {
  const { t } = useTranslation();
  const { ready, error: syncError, retry } = useTripSync();
  const defaultCurrency = sampleTrip.budget.currency;
  const {
    expenses,
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
        <motion.header variants={riseIn} className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("budget.tripWallet")}</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">{t("budget.dashboardTitle")}</h1>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t("budget.dashboardSubtitle")}</p>
          </div>
          <ThemeToggle />
        </motion.header>

        {(syncError || budgetError) && (
          <div className="px-5">
            <DataErrorState
              titleKey="budget.syncErrorTitle"
              description={budgetError || t("sync.unavailable")}
              onRetry={retry}
            />
          </div>
        )}

        <WalletDashboardSection
          wallets={walletSummaries}
          onEdit={() => setBudgetDialogOpen(true)}
        />

        <TodaysSpendingCard expenses={expenses} date={defaultDate} />

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
