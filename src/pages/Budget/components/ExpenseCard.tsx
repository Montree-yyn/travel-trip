import { motion } from "framer-motion";
import { Image, Pencil, Trash2 } from "lucide-react";

import { GlassCard, IconButton } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";
import { BUDGET_EXPENSE_CATEGORY_ICONS } from "@/lib/budget";
import type { BudgetExpense } from "@/types/budget";

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
}: {
  expense: BudgetExpense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const Icon = BUDGET_EXPENSE_CATEGORY_ICONS[expense.category];

  return (
    <motion.div variants={riseIn}>
      <GlassCard interactive padding="sm" className="mx-5 flex items-start gap-3.5" onClick={onEdit}>
        {expense.receiptPhotoUrl ? (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-ink/5">
            <img src={expense.receiptPhotoUrl} alt="" loading="lazy" className="size-full object-cover" />
            <span className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white">
              <Image size={11} />
            </span>
          </span>
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent-soft/40 text-accent-strong">
            <Icon size={21} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{expense.merchant || expense.title}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {t(`budget.categories.${expense.category}`)} · {formatDate.format(new Date(expense.date))} ·{" "}
                {t(`budget.paymentMethods.${expense.paymentMethod}`)}
              </p>
              {expense.merchant && expense.title !== expense.merchant && (
                <p className="mt-0.5 truncate text-xs text-ink-muted">{expense.title}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.625rem] font-bold text-accent-strong">
                {expense.currency}
              </span>
              <p className="mt-1 text-sm font-bold text-ink">
                {expense.amount.toLocaleString()}
              </p>
            </div>
          </div>

          {expense.note && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">{expense.note}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={t("budget.editExpense")}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={15} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={t("budget.deleteExpense")}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={15} className="text-red-500" />
          </IconButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}
