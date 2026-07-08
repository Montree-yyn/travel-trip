import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import type { ChecklistItemInput } from "@/hooks/usePersistentChecklist";
import { useTranslation } from "@/i18n";
import { CHECKLIST_CATEGORIES } from "@/lib/checklist";
import type { ChecklistItem } from "@/types/trip";

export function ChecklistFormDialog({
  open,
  mode,
  initialItem,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initialItem?: ChecklistItem;
  onClose: () => void;
  onSave: (input: ChecklistItemInput) => void;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ChecklistItem["category"]>("packing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLabel(initialItem?.label ?? "");
    setCategory(initialItem?.category ?? "packing");
    setError(null);
  }, [initialItem, open]);

  function handleSubmit() {
    if (!label.trim()) {
      setError(t("checklist.errors.labelRequired"));
      return;
    }

    onSave({
      label: label.trim(),
      category,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
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
            <GlassCard elevated padding="lg" className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">
                  {mode === "add" ? t("checklist.addItem") : t("checklist.editItem")}
                </h2>
                <IconButton size="sm" variant="ghost" aria-label={t("checklist.closeDialog")} onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("checklist.fields.label")}</span>
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder={t("checklist.fields.labelPlaceholder")}
                  className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("checklist.fields.category")}</span>
                <div className="flex flex-wrap gap-2">
                  {CHECKLIST_CATEGORIES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
                        category === value
                          ? "bg-accent text-accent-contrast"
                          : "bg-ink/5 text-ink-muted"
                      }`}
                    >
                      {t(`checklistCategories.${value}`)}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  {t("checklist.cancel")}
                </Button>
                <Button fullWidth onClick={handleSubmit}>
                  {t("checklist.saveItem")}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
