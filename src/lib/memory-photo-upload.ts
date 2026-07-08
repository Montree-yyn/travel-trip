import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";

import {
  buildMemoryPhotoStoragePath,
  getFirebaseStorage,
  type MemoryPhotoVariant,
} from "@/firebase/storage";
import { logSyncOperationError } from "@/sync/syncDebugLog";

export async function uploadMemoryPhoto({
  uid,
  tripId,
  entryId,
  photoId,
  blob,
  variant = "full",
  onProgress,
}: {
  uid: string;
  tripId: string;
  entryId: string;
  photoId: string;
  blob: Blob;
  variant?: MemoryPhotoVariant;
  onProgress?: (progress: number) => void;
}) {
  const storagePath = buildMemoryPhotoStoragePath(uid, tripId, entryId, photoId, variant);
  const storageRef = ref(getFirebaseStorage(), storagePath);
  const task = uploadBytesResumable(storageRef, blob, { contentType: "image/jpeg" });

  try {
    await waitForUpload(task, onProgress);

    const downloadUrl = await getDownloadURL(storageRef);
    return { downloadUrl, storagePath };
  } catch (error) {
    logSyncOperationError({
      operation: "uploadMemoryPhoto",
      source: "Firebase Storage",
      path: storagePath,
      phase: "uploadBytesResumable",
      error,
    });
    throw error;
  }
}

function waitForUpload(task: UploadTask, onProgress?: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (!snapshot.totalBytes) return;
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(progress);
      },
      reject,
      () => resolve(),
    );
  });
}

export async function deleteMemoryPhotoFile(storagePath: string) {
  try {
    await deleteObject(ref(getFirebaseStorage(), storagePath));
  } catch (error) {
    logSyncOperationError({
      operation: "deleteMemoryPhotoFile",
      source: "Firebase Storage",
      path: storagePath,
      phase: "deleteObject",
      error,
    });
    throw error;
  }
}
