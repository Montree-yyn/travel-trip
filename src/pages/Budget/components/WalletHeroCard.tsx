import { motion } from "framer-motion";
import { Pencil, Wallet } from "lucide-react";

import { ProgressRing } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

export interface WalletHeroCardProps {
  currency: string;
  spent: number;
  total: number;
  onEdit?: () => void;
}

export function WalletHeroCard({ currency, spent, total, onEdit }: WalletHeroCardProps) {
  const { t } = useTranslation();
  const remaining = Math.max(0, total - spent);
  const percent = total > 0 ? Math.round((spent / total) * 100) : 0;

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
      className="glass-shadow-glow relative mx-5 overflow-hidden rounded-4xl bg-gradient-to-br from-[#FF9CB8] via-accent-strong to-[#7A2453] p-6 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
          <span className="rounded-pill bg-white/20 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/25">
            {currency}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25"
              aria-label="Edit total budget"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-7 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-white/70">{t("budget.remaining")}</p>
          <p className="mt-1 truncate text-[2.25rem] font-bold leading-none tracking-tight">
            {remaining.toLocaleString()}
          </p>
          <p className="mt-3 text-xs font-medium text-white/70">
            {t("budget.spentOf", {
              currency,
              spent: spent.toLocaleString(),
              total: total.toLocaleString(),
            })}
          </p>
        </div>
        <ProgressRing
          value={percent}
          size={76}
          strokeWidth={7}
          trackClassName="stroke-white/20"
          progressClassName="stroke-white"
        >
          <span className="text-sm font-bold">{percent}%</span>
        </ProgressRing>
      </div>

      <div className="relative mt-6 flex items-center gap-1.5 border-t border-white/15 pt-4">
        <div className="grid flex-1 grid-cols-3 gap-2 text-[0.6875rem] font-semibold">
          <span>
            <span className="block text-white/55">{t("budget.totalBudget")}</span>
            {total.toLocaleString()}
          </span>
          <span>
            <span className="block text-white/55">{t("budget.spent")}</span>
            {spent.toLocaleString()}
          </span>
          <span>
            <span className="block text-white/55">{t("budget.remaining")}</span>
            {remaining.toLocaleString()}
          </span>
        </div>
        <span className="ml-auto text-[0.6875rem] font-medium tracking-wide text-white/60">
          {t("common.updatedJustNow")}
        </span>
      </div>
    </motion.div>
  );
}
