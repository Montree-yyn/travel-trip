import { motion } from "framer-motion";
import { memo } from "react";

import { Chip } from "@/components/ui";
import { staggerContainer } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";
import type { MemoryEntry, MemoryPhoto } from "@/types/memory";

import { JournalCard } from "./JournalCard";

export const MemoryDaySection = memo(function MemoryDaySection({
  day,
  date,
  entries,
  onEdit,
  onDelete,
  onPhotosChange,
}: {
  day: number;
  date: string;
  entries: MemoryEntry[];
  onEdit: (entry: MemoryEntry) => void;
  onDelete: (entry: MemoryEntry) => void;
  onPhotosChange: (entryId: string, photos: MemoryPhoto[]) => void;
}) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-5">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Chip tone="accent">{t("common.day", { day })}</Chip>
          <span>{formatDate.format(new Date(date))}</span>
        </span>
        <span className="text-xs font-medium text-ink-muted">
          {t("memories.memoryCount", { count: entries.length })}
        </span>
      </div>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {entries.map((entry) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry)}
            onPhotosChange={(photos) => onPhotosChange(entry.id, photos)}
          />
        ))}
      </motion.div>
    </div>
  );
});
