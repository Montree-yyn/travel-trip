import { AnimatePresence, motion } from "framer-motion";

import { Button, GlassCard } from "@/components/ui";
import { useTranslation } from "@/i18n";
import type { ChecklistItem } from "@/types/trip";

export function ChecklistDeleteDialog({
  open,
  item,
  onClose,
  onConfirm,
}: {
  open: boolean;
  item: ChecklistItem | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 pb-28 sm:items-center sm:pb-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <GlassCard elevated padding="lg" className="flex flex-col gap-4 text-center">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-ink">{t("checklist.deleteItem")}</h2>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {t("checklist.deleteConfirm", { label: item.label })}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  {t("checklist.cancel")}
                </Button>
                <Button
                  fullWidth
                  className="from-red-500 to-red-600"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {t("checklist.confirmDelete")}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
