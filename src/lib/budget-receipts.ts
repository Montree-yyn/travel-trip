import { getDownloadURL, ref, uploadBytesResumable, type UploadTask } from "firebase/storage";

import { isFirebaseConfigured } from "@/firebase/config";
import { buildBudgetReceiptStoragePath, getFirebaseStorage } from "@/firebase/storage";
import { compressFullPhoto } from "@/lib/memory-photos";
import { logSyncOperationError } from "@/sync/syncDebugLog";

export interface ReceiptAttachment {
  url: string;
  storagePath?: string;
}

const MAX_RECEIPT_FILE_BYTES = 12 * 1024 * 1024;

export function createReceiptId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function waitForUpload(task: UploadTask) {
  return new Promise<void>((resolve, reject) => {
    task.on("state_changed", undefined, reject, () => resolve());
  });
}

export async function prepareReceiptAttachment({
  file,
  uid,
  tripId,
}: {
  file: File;
  uid: string | null;
  tripId: string;
}): Promise<ReceiptAttachment> {
  if (!file.type.startsWith("image/")) {
    throw new Error("budget.errors.receiptInvalidType");
  }

  if (!uid || !isFirebaseConfigured() || !navigator.onLine) {
    throw new Error("budget.errors.receiptUploadFailed");
  }

  const receiptId = createReceiptId();
  const fullPhoto = await compressFullPhoto(file, MAX_RECEIPT_FILE_BYTES);
  const storagePath = buildBudgetReceiptStoragePath(tripId, receiptId);
  const storageRef = ref(getFirebaseStorage(), storagePath);
  const task = uploadBytesResumable(storageRef, fullPhoto, { contentType: "image/jpeg" });

  try {
    await waitForUpload(task);
    return {
      url: await getDownloadURL(storageRef),
      storagePath,
    };
  } catch (error) {
    logSyncOperationError({
      operation: "uploadBudgetReceipt",
      source: "Firebase Storage",
      path: storagePath,
      phase: "uploadBytesResumable",
      error,
    });
    throw new Error("budget.errors.receiptUploadFailed");
  }
}
