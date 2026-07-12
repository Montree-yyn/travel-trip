import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { deleteMemoryPhotoFile, uploadMemoryPhoto } from "@/lib/memory-photo-upload";
import {
  listPendingPhotoUploads,
  readMemoryPhotoCacheEntry,
  removeMemoryPhotoCacheEntry,
  writeMemoryPhotoCacheEntry,
} from "@/lib/memory-photo-cache";
import { createMemoryPhotoId } from "@/lib/memories";
import {
  blobToDataUrl,
  compressFullPhoto,
  compressImageFile,
  countUploadablePhotos,
  createThumbnail,
  dataUrlToBlob,
  isUploadedMemoryPhoto,
  MAX_PHOTOS_PER_MEMORY,
} from "@/lib/memory-photos";
import { getActiveTripId } from "@/sync/sharedTrip";
import type { MemoryPhoto, MemoryPhotoUploadState } from "@/types/memory";

export function useMemoryPhotoManager({
  entryId,
  photos,
  onPhotosChange,
}: {
  entryId: string;
  photos: MemoryPhoto[];
  onPhotosChange: (photos: MemoryPhoto[]) => void;
}) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [uploadStates, setUploadStates] = useState<Record<string, MemoryPhotoUploadState>>({});
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const setUploadState = useCallback((photoId: string, patch: Partial<MemoryPhotoUploadState>) => {
    setUploadStates((current) => ({
      ...current,
      [photoId]: {
        ...(current[photoId] ?? { photoId, status: "pending", progress: 0 }),
        ...patch,
        photoId,
      },
    }));
  }, []);

  const runUpload = useCallback(
    async (photoId: string, blob: Blob) => {
      if (!uid || !isFirebaseConfigured()) {
        setUploadState(photoId, {
          status: "failed",
          progress: 0,
          error: "memories.photos.errors.offlinePending",
        });
        return;
      }

      setUploadState(photoId, { status: "uploading", progress: 0, error: undefined });

      // Optimized path: upload a compressed full image (≤1600px) plus a small
      // thumbnail (≤400px). If anything in this path fails we fall back to the
      // original single-upload flow so an upload still completes.
      try {
        const thumbnailBlob = await createThumbnail(blob);

        const full = await uploadMemoryPhoto({
          uid,
          tripId: getActiveTripId(),
          entryId,
          photoId,
          blob,
          variant: "full",
          onProgress: (progress) => setUploadState(photoId, { status: "uploading", progress }),
        });

        const thumbnail = await uploadMemoryPhoto({
          uid,
          tripId: getActiveTripId(),
          entryId,
          photoId,
          blob: thumbnailBlob,
          variant: "thumbnail",
        });

        const nextPhotos = photosRef.current.map((photo) =>
          photo.id === photoId
            ? {
                id: photo.id,
                downloadUrl: full.downloadUrl,
                storagePath: full.storagePath,
                thumbnailUrl: thumbnail.downloadUrl,
                thumbnailPath: thumbnail.storagePath,
              }
            : photo,
        );
        onPhotosChange(nextPhotos);
        removeMemoryPhotoCacheEntry(photoId);
        setUploadState(photoId, { status: "done", progress: 100, error: undefined });
        return;
      } catch {
        // Fall through to the single-upload fallback below.
      }

      try {
        const fallbackBlob = await compressImageFile(blob);
        const { downloadUrl, storagePath } = await uploadMemoryPhoto({
          uid,
          tripId: getActiveTripId(),
          entryId,
          photoId,
          blob: fallbackBlob,
          variant: "full",
          onProgress: (progress) => setUploadState(photoId, { status: "uploading", progress }),
        });

        const nextPhotos = photosRef.current.map((photo) =>
          photo.id === photoId ? { id: photo.id, downloadUrl, storagePath } : photo,
        );
        onPhotosChange(nextPhotos);
        removeMemoryPhotoCacheEntry(photoId);
        setUploadState(photoId, { status: "done", progress: 100, error: undefined });
      } catch {
        setUploadState(photoId, {
          status: "failed",
          progress: 0,
          error: "memories.photos.errors.uploadFailed",
        });
      }
    },
    [entryId, onPhotosChange, setUploadState, uid],
  );

  const addPhotos = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = [...files];
      const uploadableCount = countUploadablePhotos(photosRef.current);
      const remaining = MAX_PHOTOS_PER_MEMORY - uploadableCount;

      if (remaining <= 0) {
        throw new Error("memories.photos.errors.limitReached");
      }

      const selected = fileArray.slice(0, remaining);

      for (const file of selected) {
        const blob = await compressFullPhoto(file);
        const dataUrl = await blobToDataUrl(blob);
        const photoId = createMemoryPhotoId();
        const nextPhoto: MemoryPhoto = { id: photoId };

        writeMemoryPhotoCacheEntry({
          photoId,
          entryId,
          dataUrl,
          pendingUpload: true,
        });

        const nextPhotos = [...photosRef.current, nextPhoto].filter(
          (photo) => isUploadedMemoryPhoto(photo) || !photo.photoSeed,
        );
        onPhotosChange(nextPhotos);
        setUploadState(photoId, { status: "pending", progress: 0 });

        if (navigator.onLine) {
          void runUpload(photoId, blob);
        } else {
          setUploadState(photoId, {
            status: "failed",
            progress: 0,
            error: "memories.photos.errors.offlinePending",
          });
        }
      }
    },
    [entryId, onPhotosChange, runUpload, setUploadState],
  );

  const retryUpload = useCallback(
    async (photoId: string) => {
      const cacheEntry = readMemoryPhotoCacheEntry(photoId);
      if (!cacheEntry) {
        setUploadState(photoId, {
          status: "failed",
          progress: 0,
          error: "memories.photos.errors.uploadFailed",
        });
        return;
      }

      const blob = dataUrlToBlob(cacheEntry.dataUrl);
      await runUpload(photoId, blob);
    },
    [runUpload, setUploadState],
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      const target = photosRef.current.find((photo) => photo.id === photoId);
      if (uid && isFirebaseConfigured()) {
        // Delete both the full image and the thumbnail when their paths exist.
        const paths = [target?.storagePath, target?.thumbnailPath].filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        );
        for (const path of paths) {
          try {
            await deleteMemoryPhotoFile(path);
          } catch {
            // Local removal still proceeds if a cloud delete fails offline.
          }
        }
      }

      removeMemoryPhotoCacheEntry(photoId);
      setUploadStates((current) => {
        const next = { ...current };
        delete next[photoId];
        return next;
      });
      onPhotosChange(photosRef.current.filter((photo) => photo.id !== photoId));
    },
    [onPhotosChange, uid],
  );

  const reorderPhotos = useCallback(
    (nextOrder: MemoryPhoto[]) => {
      onPhotosChange(nextOrder);
    },
    [onPhotosChange],
  );

  useEffect(() => {
    function flushPendingUploads() {
      if (!uid || !navigator.onLine) return;

      for (const pending of listPendingPhotoUploads()) {
        if (pending.entryId !== entryId) continue;
        const photo = photosRef.current.find((item) => item.id === pending.photoId);
        if (!photo || photo.downloadUrl) continue;

        void runUpload(pending.photoId, dataUrlToBlob(pending.dataUrl));
      }
    }

    window.addEventListener("online", flushPendingUploads);
    flushPendingUploads();
    return () => window.removeEventListener("online", flushPendingUploads);
  }, [entryId, runUpload, uid]);

  return {
    uploadStates,
    addPhotos,
    retryUpload,
    deletePhoto,
    reorderPhotos,
    getLocalPreview: readMemoryPhotoCacheEntry,
  };
}
