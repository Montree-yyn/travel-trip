import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import { sampleTrip } from "@/data/sample-trip";
import type { MemoryEntryInput } from "@/hooks/usePersistentMemories";
import { useTranslation } from "@/i18n";
import { formatTagsInput, parseTagsInput } from "@/lib/memories";
import type { MemoryEntry } from "@/types/memory";

export function MemoryFormDialog({
  open,
  mode,
  initialEntry,
  defaultDay,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initialEntry?: MemoryEntry;
  defaultDay: number;
  onClose: () => void;
  onSave: (input: MemoryEntryInput) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(initialEntry?.title ?? "");
    setDay(initialEntry?.day ?? defaultDay);
    setDate(initialEntry?.date ?? sampleTrip.itinerary.find((tripDay) => tripDay.dayNumber === defaultDay)?.date ?? "");
    setLocation(initialEntry?.location ?? "");
    setNote(initialEntry?.note ?? "");
    setTagsInput(initialEntry ? formatTagsInput(initialEntry.tags) : "");
    setError(null);
  }, [defaultDay, initialEntry, open]);

  function handleDayChange(nextDay: number) {
    setDay(nextDay);
    const tripDay = sampleTrip.itinerary.find((item) => item.dayNumber === nextDay);
    if (tripDay) setDate(tripDay.date);
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError(t("memories.errors.titleRequired"));
      return;
    }
    if (!date) {
      setError(t("memories.errors.dateRequired"));
      return;
    }

    const trimmedLocation = location.trim();

    onSave({
      title: title.trim(),
      day,
      date,
      note: note.trim(),
      tags: parseTagsInput(tagsInput),
      ...(trimmedLocation ? { location: trimmedLocation } : {}),
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
            <GlassCard elevated padding="lg" className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">
                  {mode === "add" ? t("memories.addMemory") : t("memories.editMemory")}
                </h2>
                <IconButton size="sm" variant="ghost" aria-label={t("memories.closeDialog")} onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("memories.fields.title")}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("memories.fields.titlePlaceholder")}
                  className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-muted">{t("memories.fields.day")}</span>
                  <select
                    value={day}
                    onChange={(event) => handleDayChange(Number(event.target.value))}
                    className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none"
                  >
                    {sampleTrip.itinerary.map((tripDay) => (
                      <option key={tripDay.dayNumber} value={tripDay.dayNumber}>
                        {t("common.day", { day: tripDay.dayNumber })}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-muted">{t("memories.fields.date")}</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("memories.fields.location")}</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={t("memories.fields.locationPlaceholder")}
                  className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("memories.fields.note")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("memories.journalPlaceholder")}
                  rows={4}
                  className="resize-none rounded-xl bg-ink/5 px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">{t("memories.fields.tags")}</span>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder={t("memories.fields.tagsPlaceholder")}
                  className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
                />
              </label>

              <p className="text-xs leading-relaxed text-ink-muted">{t("memories.photos.manageOnCard")}</p>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  {t("memories.cancel")}
                </Button>
                <Button fullWidth onClick={handleSubmit}>
                  {t("memories.saveMemory")}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
