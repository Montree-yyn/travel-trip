import { motion } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

import { EmptyState, SectionHeader, TripImage } from "@/components/ui";
import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { readMemoryPhotoCache } from "@/lib/memory-photo-cache";
import { isUploadedMemoryPhoto } from "@/lib/memory-photos";
import type { MemoryPhoto } from "@/types/memory";

import { MemoryPhotoImage } from "./MemoryPhotoImage";
import { MemoryPhotoPreview } from "./MemoryPhotoPreview";

export const PhotoGrid = memo(function PhotoGrid({ photos }: { photos: MemoryPhoto[] }) {
  const { t } = useTranslation();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const photoCache = readMemoryPhotoCache();
  const photoSrcById = useMemo(() => {
    const sources = new Map<string, string>();
    for (const photo of photos) {
      const src = photo.downloadUrl || photoCache[photo.id]?.dataUrl;
      if (src) sources.set(photo.id, src);
    }
    return sources;
  }, [photoCache, photos]);

  const galleryPhotos = useMemo(
    () => photos.filter((photo) => isUploadedMemoryPhoto(photo) || photoSrcById.has(photo.id)),
    [photoSrcById, photos],
  );

  const previewPhotos = useMemo(
    () => galleryPhotos.filter((photo) => photoSrcById.has(photo.id)),
    [galleryPhotos, photoSrcById],
  );

  const resolveGallerySrc = useCallback(
    (photo: MemoryPhoto) => photoSrcById.get(photo.id) ?? null,
    [photoSrcById],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <SectionHeader
        title={t("memories.photoGallery")}
        action={
          galleryPhotos.length > 0 ? (
            <span className="text-xs text-ink-muted">{t("memories.photoCount", { count: galleryPhotos.length })}</span>
          ) : undefined
        }
      />
      {galleryPhotos.length === 0 ? (
        <EmptyState
          icon={Images}
          title={t("empty.memoriesPhotos.title")}
          description={t("empty.memoriesPhotos.description")}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-3 gap-1.5 px-5">
          {galleryPhotos.map((photo, index) => {
            const src = resolveGallerySrc(photo);

            return (
              <motion.div key={photo.id} variants={riseIn}>
                {src ? (
                  <button
                    type="button"
                    className="aspect-square w-full overflow-hidden rounded-xl"
                    onClick={() => setPreviewIndex(index)}
                  >
                    <MemoryPhotoImage src={src} alt="" className="size-full" />
                  </button>
                ) : (
                  <TripImage seed={photo.photoSeed ?? photo.id} icon={Camera} className="aspect-square rounded-xl" iconClassName="size-6" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <MemoryPhotoPreview
        open={previewIndex !== null}
        photos={previewPhotos}
        resolveSrc={resolveGallerySrc}
        startIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  );
});
