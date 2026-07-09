import { motion } from "framer-motion";
import { Pencil, Wallet } from "lucide-react";

import { ProgressRing } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { BudgetWalletSummary } from "@/types/budget";

export interface TripBudgetCardProps {
  totalBudget?: number;
  spent?: number;
  remaining?: number;
  currency?: string;
  wallets?: BudgetWalletSummary[];
  lastUpdated?: string;
  onEdit?: () => void;
  className?: string;
}

const walletLabels = {
  THB: { flag: "🇹🇭", label: "THB Wallet" },
  JPY: { flag: "🇯🇵", label: "JPY Wallet" },
} as const;

function formatLastUpdated(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function TripBudgetCard({
  totalBudget,
  spent,
  remaining,
  currency = "THB",
  wallets,
  lastUpdated,
  onEdit,
  className,
}: TripBudgetCardProps) {
  const { t } = useTranslation();

  const safeTotalBudget = safeNumber(totalBudget);
  const safeSpent = safeNumber(spent);
  const safeRemaining = Number.isFinite(remaining)
    ? Number(remaining)
    : safeTotalBudget - safeSpent;

  const percent = safeTotalBudget > 0 ? Math.round((safeSpent / safeTotalBudget) * 100) : 0;
  const updatedLabel = formatLastUpdated(lastUpdated) ?? t("common.updatedJustNow");
  const displayedWallets = wallets?.length
    ? wallets
    : [{
        currency: currency === "JPY" ? "JPY" as const : "THB" as const,
        totalBudget: safeTotalBudget,
        totalSpent: safeSpent,
        remaining: safeRemaining,
        spentPercent: percent,
      }];

  return (
    <motion.div
      variants={scaleIn}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (!onEdit) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit();
        }
      }}
      className={cn(
        "glass-shadow-glow relative mx-5 overflow-hidden rounded-4xl bg-gradient-to-br from-[#FF9CB8] via-accent-strong to-[#7A2453] p-6 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        className,
      )}
    >
      <div className="absolute -right-10 -top-12 size-44 rounded-full bg-white/12 blur-3xl" />
      <div className="absolute -bottom-14 -left-10 size-40 rounded-full bg-black/20 blur-3xl" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        initial={{ x: "-120%" }}
        animate={{ x: "160%" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-8 items-center justify-center rounded-md bg-gradient-to-br from-white/50 to-white/20 ring-1 ring-white/40">
            <Wallet size={13} strokeWidth={2} />
          </span>
          <span className="text-[0.8125rem] font-semibold uppercase tracking-wide text-white/85">
            {t("budget.tripWallet")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25"
              aria-label={t("budget.editTotalBudget")}
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3">
        {displayedWallets.map((wallet) => {
          const label = walletLabels[wallet.currency];

          return (
            <div key={wallet.currency} className="rounded-3xl bg-white/12 p-3 ring-1 ring-white/15">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-bold uppercase tracking-wide text-white/85">
                    {label.flag} {label.label}
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold leading-none tracking-tight">
                    {wallet.remaining.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-white/70">
                    {t("budget.spentOf", {
                      currency: wallet.currency,
                      spent: wallet.totalSpent.toLocaleString(),
                      total: wallet.totalBudget.toLocaleString(),
                    })}
                  </p>
                </div>
                <ProgressRing
                  value={wallet.spentPercent}
                  size={58}
                  strokeWidth={6}
                  trackClassName="stroke-white/20"
                  progressClassName="stroke-white"
                >
                  <span className="text-xs font-bold">{wallet.spentPercent}%</span>
                </ProgressRing>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/15 pt-3 text-[0.6875rem] font-semibold">
                <span>
                  <span className="block text-white/55">{t("budget.totalBudget")}</span>
                  {wallet.totalBudget.toLocaleString()}
                </span>
                <span>
                  <span className="block text-white/55">{t("budget.spent")}</span>
                  {wallet.totalSpent.toLocaleString()}
                </span>
                <span>
                  <span className="block text-white/55">{t("budget.remaining")}</span>
                  {wallet.remaining.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 flex justify-end border-t border-white/15 pt-3">
        <span className="ml-auto text-[0.6875rem] font-medium tracking-wide text-white/60">
          {updatedLabel}
        </span>
      </div>
    </motion.div>
  );
}
