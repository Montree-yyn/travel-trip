import { motion } from "framer-motion";

import { staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { CHECKLIST_CATEGORY_ICONS, CHECKLIST_CATEGORY_LABEL_KEYS } from "@/lib/checklist";
import type { ChecklistItem } from "@/types/trip";

import { ChecklistRow } from "./ChecklistRow";

export function ChecklistSection({
  category,
  items,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: ChecklistItem["category"];
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
}) {
  const { t } = useTranslation();
  const Icon = CHECKLIST_CATEGORY_ICONS[category];
  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-5">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon size={15} className="text-accent-strong" />
          {t(CHECKLIST_CATEGORY_LABEL_KEYS[category])}
        </span>
        <span className="text-xs font-medium text-ink-muted">
          {doneCount}/{items.length}
        </span>
      </div>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-2 px-5">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggle={() => onToggle(item.id)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        ))}
      </motion.div>
    </div>
  );
}
