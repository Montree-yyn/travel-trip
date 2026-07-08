import { motion } from "framer-motion";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { memo } from "react";

import { Chip, GlassCard, IconButton } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { MemoryEntry, MemoryPhoto } from "@/types/memory";

import { MemoryPhotoManager } from "./MemoryPhotoManager";

export const JournalCard = memo(function JournalCard({
  entry,
  onEdit,
  onDelete,
  onPhotosChange,
}: {
  entry: MemoryEntry;
  onEdit: () => void;
  onDelete: () => void;
  onPhotosChange: (photos: MemoryPhoto[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="md" className="mx-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-ink">{entry.title}</h3>
            {entry.location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                <MapPin size={11} className="text-accent-strong" /> {entry.location}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <IconButton size="sm" variant="ghost" aria-label={t("memories.editMemory")} onClick={onEdit}>
              <Pencil size={15} />
            </IconButton>
            <IconButton size="sm" variant="ghost" aria-label={t("memories.deleteMemory")} onClick={onDelete}>
              <Trash2 size={15} className="text-red-500" />
            </IconButton>
          </div>
        </div>

        {entry.note.trim().length > 0 ? (
          <p className="text-sm leading-relaxed text-ink-muted">{entry.note}</p>
        ) : (
          <p className="text-sm italic text-ink-faint">{t("memories.noNoteYet")}</p>
        )}

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Chip key={tag} tone="neutral">
                {tag}
              </Chip>
            ))}
          </div>
        )}

        <MemoryPhotoManager
          entryId={entry.id}
          photos={entry.photos}
          onPhotosChange={onPhotosChange}
        />
      </GlassCard>
    </motion.div>
  );
});
