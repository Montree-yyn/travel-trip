import { motion } from "framer-motion";

import { GlassCard, ProgressBar } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { BUDGET_CATEGORY_ICONS } from "@/lib/budget";
import type { BudgetCategorySpending } from "@/types/budget";

export function CategoryRow({ category }: { category: BudgetCategorySpending }) {
  const { t } = useTranslation();
  const Icon = BUDGET_CATEGORY_ICONS[category.icon];
  const percent = category.allocated > 0 ? Math.round((category.spent / category.allocated) * 100) : 0;

  return (
    <motion.div variants={riseIn}>
      <GlassCard interactive padding="sm" className="mx-5 flex items-center gap-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent-soft/40 text-accent-strong">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{t(`budget.categories.${category.icon}`)}</span>
            <span className="shrink-0 text-xs font-semibold text-ink-muted">
              {category.spent.toLocaleString()} / {category.allocated.toLocaleString()}
            </span>
          </div>
          <ProgressBar value={percent} />
        </div>
      </GlassCard>
    </motion.div>
  );
}
