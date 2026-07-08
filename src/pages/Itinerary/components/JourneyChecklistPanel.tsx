import { motion } from "framer-motion";
import { ListChecks, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, GlassCard, IconButton, ProgressBar, ProgressRing } from "@/components/ui";
import { scaleIn, staggerContainer } from "@/design-system/motion";
import { usePersistentChecklist } from "@/hooks/usePersistentChecklist";
import { useTranslation } from "@/i18n";
import { CHECKLIST_CATEGORY_ORDER } from "@/lib/checklist";
import type { ChecklistItem } from "@/types/trip";

import { ChecklistDeleteDialog } from "@/pages/Checklist/components/ChecklistDeleteDialog";
import { ChecklistFormDialog } from "@/pages/Checklist/components/ChecklistFormDialog";
import { ChecklistSection } from "@/pages/Checklist/components/ChecklistSection";

export function JourneyChecklistPanel() {
  const { t } = useTranslation();
  const { items, addItem, updateItem, deleteItem, toggleItem } = usePersistentChecklist();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistItem | null>(null);

  const doneCount = items.filter((i) => i.checked).length;
  const remainingCount = items.length - doneCount;
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const grouped = useMemo(() => {
    return CHECKLIST_CATEGORY_ORDER.map((category) => ({
      category,
      items: items.filter((i) => i.category === category),
    })).filter((group) => group.items.length > 0);
  }, [items]);

  function openAddDialog() {
    setFormMode("add");
    setActiveItem(null);
    setFormOpen(true);
  }

  function openEditDialog(item: ChecklistItem) {
    setFormMode("edit");
    setActiveItem(item);
    setFormOpen(true);
  }

  return (
    <>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative flex flex-col gap-5">
        {items.length > 0 && (
          <motion.div variants={scaleIn}>
            <GlassCard elevated padding="lg" className="mx-5 flex flex-col gap-4">
              <div className="flex items-center gap-5">
                <ProgressRing value={percent} size={84} strokeWidth={8}>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-ink">{percent}%</span>
                  </div>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {t("checklist.packedProgress", { done: doneCount, total: items.length })}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("checklist.completed", { count: doneCount })}
                    {" · "}
                    {t("checklist.remaining", { count: remainingCount })}
                  </p>
                </div>
              </div>
              <ProgressBar value={percent} />
            </GlassCard>
          </motion.div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={t("empty.checklist.title")}
            description={t("empty.checklist.description")}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(({ category, items: groupItems }) => (
              <ChecklistSection
                key={category}
                category={category}
                items={groupItems}
                onToggle={toggleItem}
                onEdit={openEditDialog}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex max-w-md justify-end px-5 md:max-w-lg lg:max-w-xl">
          <IconButton
            variant="solid"
            size="lg"
            aria-label={t("checklist.addItem")}
            className="pointer-events-auto glow-accent"
            onClick={openAddDialog}
          >
            <Plus size={22} strokeWidth={2.25} />
          </IconButton>
        </div>
      </motion.div>

      <ChecklistFormDialog
        open={formOpen}
        mode={formMode}
        initialItem={activeItem ?? undefined}
        onClose={() => setFormOpen(false)}
        onSave={(input) => {
          if (formMode === "edit" && activeItem) {
            updateItem(activeItem.id, input);
            return;
          }
          addItem(input);
        }}
      />

      <ChecklistDeleteDialog
        open={deleteTarget !== null}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteItem(deleteTarget.id);
        }}
      />
    </>
  );
}
