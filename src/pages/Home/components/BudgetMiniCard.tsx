import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard, ProgressBar } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import type { BudgetBreakdown } from "@/types/trip";

export function BudgetMiniCard({ budget, spent }: { budget: BudgetBreakdown; spent: number }) {
  const { t } = useTranslation();
  const percent =
    budget.totalMax > 0 ? Math.round((spent / budget.totalMax) * 100) : 0;
  const remaining = Math.max(budget.totalMax - spent, 0);

  return (
    <motion.div variants={riseIn} className="w-full">
      <Link to={ROUTES.budget}>
        <GlassCard interactive padding="md" className="h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">{t("home.budgetUsed")}</span>
            <Wallet size={18} className="text-accent-strong" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tracking-tight text-ink">{percent}%</span>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {t("home.budgetRemaining", {
              currency: budget.currency,
              amount: remaining.toLocaleString(),
            })}
          </p>
          <ProgressBar value={percent} className="mt-2.5" />
        </GlassCard>
      </Link>
    </motion.div>
  );
}
