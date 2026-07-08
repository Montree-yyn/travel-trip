import { motion } from "framer-motion";
import { Check, Pencil, Trash2 } from "lucide-react";

import { IconButton } from "@/components/ui";
import { riseIn, tapScaleSubtle } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/types/trip";

export function ChecklistRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="glass-surface glass-shadow flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2">
      <motion.button
        type="button"
        whileTap={tapScaleSubtle}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            item.checked ? "border-accent-strong bg-gradient-to-b from-accent to-accent-strong" : "border-ink/20",
          )}
        >
          {item.checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
              <Check size={15} className="text-white" strokeWidth={3} />
            </motion.span>
          )}
        </span>
        <span className={cn("text-sm font-medium transition-colors", item.checked ? "text-ink-faint line-through" : "text-ink")}>
          {item.label}
        </span>
      </motion.button>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={t("checklist.editItem")}
          onClick={onEdit}
        >
          <Pencil size={15} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={t("checklist.deleteItem")}
          onClick={onDelete}
        >
          <Trash2 size={15} className="text-red-500" />
        </IconButton>
      </div>
    </motion.div>
  );
}
