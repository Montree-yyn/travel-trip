import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/ui";
import { useTranslation } from "@/i18n";
import type { MemoryPhoto } from "@/types/memory";

import { MemoryPhotoImage } from "./MemoryPhotoImage";

export function MemoryPhotoPreview({
  open,
  photos,
  resolveSrc,
  startIndex,
  onClose,
}: {
  open: boolean;
  photos: MemoryPhoto[];
  resolveSrc: (photo: MemoryPhoto) => string | null;
  startIndex: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const current = photos[index];
  const src = current ? resolveSrc(current) : null;

  function showPrevious() {
    setIndex((value) => (value > 0 ? value - 1 : photos.length - 1));
  }

  function showNext() {
    setIndex((value) => (value < photos.length - 1 ? value + 1 : 0));
  }

  return (
    <AnimatePresence>
      {open && current && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <IconButton variant="ghost" aria-label={t("memories.photos.closePreview")} onClick={onClose}>
              <X size={18} className="text-white" />
            </IconButton>
            <span className="text-sm font-medium text-white/80">
              {index + 1} / {photos.length}
            </span>
            <span className="size-9" />
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4">
            <IconButton
              variant="ghost"
              aria-label={t("memories.photos.previousPhoto")}
              className="absolute left-3 z-10"
              onClick={showPrevious}
            >
              <ChevronLeft size={22} className="text-white" />
            </IconButton>

            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-h-[70dvh] w-full max-w-md overflow-hidden rounded-2xl"
            >
              <MemoryPhotoImage src={src} alt="" className="aspect-[3/4] w-full" priority />
            </motion.div>

            <IconButton
              variant="ghost"
              aria-label={t("memories.photos.nextPhoto")}
              className="absolute right-3 z-10"
              onClick={showNext}
            >
              <ChevronRight size={22} className="text-white" />
            </IconButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
