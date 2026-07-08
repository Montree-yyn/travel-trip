import { motion, Reorder } from "framer-motion";
import { Camera, GripVertical, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";

import { IconButton, TripImage } from "@/components/ui";
import { useMemoryPhotoManager } from "@/hooks/useMemoryPhotoManager";
import { useTranslation } from "@/i18n";
import { readMemoryPhotoCache } from "@/lib/memory-photo-cache";
import {
  isUploadedMemoryPhoto,
  MAX_PHOTOS_PER_MEMORY,
} from "@/lib/memory-photos";
import { tapScaleSubtle } from "@/design-system/motion";
import type { MemoryPhoto } from "@/types/memory";

import { MemoryPhotoDeleteDialog } from "./MemoryPhotoDeleteDialog";
import { MemoryPhotoImage } from "./MemoryPhotoImage";
import { MemoryPhotoPreview } from "./MemoryPhotoPreview";

export const MemoryPhotoManager = memo(function MemoryPhotoManager({
  entryId,
  photos,
  onPhotosChange,
}: {
  entryId: string;
  photos: MemoryPhoto[];
  onPhotosChange: (photos: MemoryPhoto[]) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const { uploadStates, addPhotos, retryUpload, deletePhoto, reorderPhotos } = useMemoryPhotoManager({
    entryId,
    photos,
    onPhotosChange,
  });

  const photoCache = readMemoryPhotoCache();
  const resolvePhotoSrc = useCallback(
    (photo: MemoryPhoto) => photo.downloadUrl || photoCache[photo.id]?.dataUrl || null,
    [photoCache],
  );

  const userPhotos = useMemo(
    () =>
      photos.filter(
        (photo) =>
          isUploadedMemoryPhoto(photo) ||
          Boolean(uploadStates[photo.id]) ||
          Boolean(photoCache[photo.id]) ||
          (!photo.photoSeed && !photo.downloadUrl),
      ),
    [photoCache, photos, uploadStates],
  );

  const previewPhotos = useMemo(
    () => userPhotos.filter((photo) => resolvePhotoSrc(photo)),
    [resolvePhotoSrc, userPhotos],
  );
  const canAddMore = userPhotos.length < MAX_PHOTOS_PER_MEMORY;

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    try {
      await addPhotos(fileList);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "memories.photos.errors.uploadFailed";
      setError(t(message));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openPreview(photoId: string) {
    const index = previewPhotos.findIndex((photo) => photo.id === photoId);
    if (index >= 0) setPreviewIndex(index);
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-ink/8 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("memories.fields.photos")}
        </span>
        <span className="text-xs font-medium text-ink-muted">
          {t("memories.photos.count", { count: userPhotos.length, max: MAX_PHOTOS_PER_MEMORY })}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFilesSelected(event.target.files)}
      />

      {userPhotos.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent/35 bg-accent-soft/30 px-4 py-6 transition-colors hover:bg-accent-soft/50"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-contrast">
            <Camera size={20} strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-ink">{t("memories.photos.addPhotos")}</p>
          <p className="text-center text-xs text-ink-muted">{t("memories.photos.emptyHint")}</p>
        </button>
      ) : (
        <Reorder.Group
          axis="x"
          values={userPhotos}
          onReorder={reorderPhotos}
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        >
          {userPhotos.map((photo) => {
            const src = resolvePhotoSrc(photo);
            const uploadState = uploadStates[photo.id];

            return (
              <Reorder.Item
                key={photo.id}
                value={photo}
                dragListener
                className="relative shrink-0 touch-manipulation"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                  {src ? (
                    <button type="button" className="size-full" onClick={() => openPreview(photo.id)}>
                      <MemoryPhotoImage src={src} alt="" className="size-full" />
                    </button>
                  ) : (
                    <TripImage
                      seed={photo.photoSeed ?? photo.id}
                      icon={Camera}
                      className="size-full"
                      iconClassName="size-4"
                    />
                  )}

                  {uploadState?.status === "uploading" && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1">
                      <div className="h-1 overflow-hidden rounded-pill bg-white/25">
                        <div
                          className="h-full rounded-pill bg-accent transition-all"
                          style={{ width: `${uploadState.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadState?.status === "failed" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 p-1">
                      <button
                        type="button"
                        onClick={() => void retryUpload(photo.id)}
                        className="inline-flex items-center gap-1 rounded-pill bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink"
                      >
                        <RotateCcw size={10} />
                        {t("memories.photos.retry")}
                      </button>
                    </div>
                  )}

                  <div className="absolute right-1 top-1 flex items-center gap-0.5">
                    <span className="rounded-md bg-black/45 p-0.5 text-white/90">
                      <GripVertical size={11} />
                    </span>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      aria-label={t("memories.photos.deletePhoto")}
                      className="size-6 bg-black/45 text-white hover:bg-black/60"
                      onClick={() => setDeleteTarget(photo.id)}
                    >
                      <Trash2 size={12} />
                    </IconButton>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {canAddMore && userPhotos.length > 0 && (
        <motion.button
          type="button"
          whileTap={tapScaleSubtle}
          onClick={openFilePicker}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-accent to-accent-strong px-4 py-3 text-sm font-semibold text-accent-contrast shadow-sm"
        >
          <Upload size={16} strokeWidth={2.25} />
          {t("memories.photos.addPhotos")}
        </motion.button>
      )}

      {canAddMore && userPhotos.length === 0 && (
        <motion.button
          type="button"
          whileTap={tapScaleSubtle}
          onClick={openFilePicker}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-accent to-accent-strong px-4 py-3 text-sm font-semibold text-accent-contrast shadow-sm"
        >
          <Plus size={16} strokeWidth={2.25} />
          {t("memories.photos.addPhotos")}
        </motion.button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <MemoryPhotoDeleteDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deletePhoto(deleteTarget);
        }}
      />

      <MemoryPhotoPreview
        open={previewIndex !== null}
        photos={previewPhotos}
        resolveSrc={resolvePhotoSrc}
        startIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  );
});
