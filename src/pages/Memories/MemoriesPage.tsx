import { motion } from "framer-motion";
import { BookHeart, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  DataErrorState,
  EmptyState,
  GenericPageSkeleton,
  IconButton,
  SectionHeader,
  ThemeToggle,
} from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { sampleTrip } from "@/data/sample-trip";
import { staggerContainer } from "@/design-system/motion";
import { usePersistentMemories } from "@/hooks/usePersistentMemories";
import { useTranslation } from "@/i18n";
import { getCurrentTripDay } from "@/lib/trip-progress";
import { groupMemoriesByDay } from "@/lib/memories";
import { useTripSync } from "@/sync";
import type { MemoryEntry } from "@/types/memory";

import { MemoryDaySection } from "./components/MemoryDaySection";
import { MemoryDeleteDialog } from "./components/MemoryDeleteDialog";
import { MemoryFormDialog } from "./components/MemoryFormDialog";
import { PhotoGrid } from "./components/PhotoGrid";

export function MemoriesPage() {
  const { t } = useTranslation();
  const { ready, error, retry } = useTripSync();
  const {
    entries,
    error: memoriesSyncError,
    addMemory,
    updateMemory,
    deleteMemory,
    updateEntryPhotos,
  } = usePersistentMemories();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeEntry, setActiveEntry] = useState<MemoryEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemoryEntry | null>(null);

  const defaultDay = useMemo(() => getCurrentTripDay(sampleTrip).dayNumber, []);
  const allPhotos = useMemo(() => entries.flatMap((entry) => entry.photos), [entries]);
  const journaledCount = useMemo(
    () => entries.filter((entry) => entry.note.trim().length > 0).length,
    [entries],
  );

  const grouped = useMemo(() => groupMemoriesByDay(entries), [entries]);

  const openAddDialog = useCallback(() => {
    setFormMode("add");
    setActiveEntry(null);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((entry: MemoryEntry) => {
    setFormMode("edit");
    setActiveEntry(entry);
    setFormOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => setFormOpen(false), []);
  const closeDeleteDialog = useCallback(() => setDeleteTarget(null), []);

  const handleSave = useCallback(
    (input: Parameters<typeof addMemory>[0]) => {
      if (formMode === "edit" && activeEntry) {
        updateMemory(activeEntry.id, input);
        return;
      }
      addMemory(input);
    },
    [activeEntry, addMemory, formMode, updateMemory],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMemory(deleteTarget.id);
  }, [deleteMemory, deleteTarget]);

  if (!ready) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
        <GenericPageSkeleton />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-28">
        <PageHeader
          title={t("memories.title")}
          subtitle={t("memories.subtitle", { journaled: journaledCount, total: entries.length })}
          actions={<ThemeToggle />}
        />

        {(error || memoriesSyncError) && (
          <div className="px-5">
            <DataErrorState
              titleKey="memories.syncErrorTitle"
              descriptionKey="sync.unavailable"
              onRetry={retry}
            />
          </div>
        )}

        <PhotoGrid photos={allPhotos} />

        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("memories.tripJournal")} />
          {entries.length === 0 ? (
            <EmptyState
              icon={BookHeart}
              title={t("empty.memories.title")}
              description={t("empty.memories.description")}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {grouped.map(({ day, date, entries: dayEntries }) => (
                <MemoryDaySection
                  key={day}
                  day={day}
                  date={date}
                  entries={dayEntries}
                  onEdit={openEditDialog}
                  onDelete={setDeleteTarget}
                  onPhotosChange={updateEntryPhotos}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-md justify-end px-5 md:max-w-lg lg:max-w-xl">
        <IconButton
          variant="solid"
          size="lg"
          aria-label={t("memories.addMemory")}
          className="pointer-events-auto glow-accent shadow-lg"
          onClick={openAddDialog}
        >
          <Plus size={22} strokeWidth={2.25} />
        </IconButton>
      </div>

      <MemoryFormDialog
        open={formOpen}
        mode={formMode}
        initialEntry={activeEntry ?? undefined}
        defaultDay={activeEntry?.day ?? defaultDay}
        onClose={closeFormDialog}
        onSave={handleSave}
      />

      <MemoryDeleteDialog
        open={deleteTarget !== null}
        entry={deleteTarget}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default MemoriesPage;
