import { collection, deleteDoc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";

import { sampleTrip, tripSettings } from "@/data/sample-trip";
import { getFirebaseFirestore } from "@/firebase/firestore";
import { buildTripDocumentStoragePath, getFirebaseStorage } from "@/firebase/storage";
import { logSyncOperationError } from "@/sync/syncDebugLog";
import { getActiveTripId, sanitizeFirestoreData, sharedTripCollection, sharedTripSubDoc } from "@/sync/sharedTrip";
import type { DocumentCategory, DocumentCategoryId, TravelDocument, TravelDocumentFile } from "@/types/document";

const STORAGE_KEY = `travel-trip-documents:${sampleTrip.id}:v1`;
const DOCUMENT_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const DEFAULT_DOCUMENT_OWNERS = tripSettings.documentOwners?.length
  ? tripSettings.documentOwners
  : sampleTrip.companions;

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "travel-insurance",
    title: "Travel Insurance",
    description: "Policies, cards, emergency contacts, and claim details.",
  },
  {
    id: "usj-tickets",
    title: "Universal Studios Japan / USJ Ticket",
    description: "Universal Studios Japan entry passes and QR tickets.",
  },
  {
    id: "visit-japan-web",
    title: "Visit Japan Web",
    description: "Immigration, customs, and arrival registration documents.",
  },
  {
    id: "passport-visa",
    title: "Passport / Visa",
    description: "Passport scans, visas, permits, and identity documents.",
  },
  {
    id: "other-documents",
    title: "Other Documents",
    description: "Everything important that does not fit another category.",
  },
];

export function getDocumentCategory(categoryId?: string) {
  return DOCUMENT_CATEGORIES.find((category) => category.id === categoryId);
}

export function createDocumentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `document-${crypto.randomUUID()}`;
  }
  return `document-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeDocument(value: unknown): TravelDocument | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TravelDocument>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.owner !== "string" ||
    typeof candidate.title !== "string" ||
    !DOCUMENT_CATEGORIES.some((category) => category.id === candidate.category)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    owner: candidate.owner,
    title: candidate.title,
    category: candidate.category as DocumentCategoryId,
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    file:
      candidate.file &&
      typeof candidate.file.fileName === "string" &&
      typeof candidate.file.fileType === "string" &&
      typeof candidate.file.dataUrl === "string"
        ? candidate.file
        : undefined,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

export function readDocumentsFromStorage(): TravelDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeDocument).filter((document): document is TravelDocument => document !== null)
      : [];
  } catch {
    return [];
  }
}

export function writeDocumentsToStorage(documents: TravelDocument[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

function uniqueDocumentId(document: TravelDocument, existingDocuments: TravelDocument[]) {
  const existingIds = new Set(existingDocuments.map((item) => item.id));
  if (document.id && document.id !== document.owner && !existingIds.has(document.id)) return document.id;

  let nextId = createDocumentId();
  while (existingIds.has(nextId)) nextId = createDocumentId();
  return nextId;
}

export function prepareDocumentForSave(document: TravelDocument, existingDocuments: TravelDocument[] = []) {
  return {
    ...document,
    id: uniqueDocumentId(document, existingDocuments.filter((item) => item.id !== document.id)),
  };
}

function serializeDocumentForFirestore(document: TravelDocument, uid: string, isNew: boolean) {
  const file = document.file
    ? {
        fileName: document.file.fileName,
        fileType: document.file.fileType,
        dataUrl: document.file.downloadUrl ?? document.file.dataUrl,
        ...(document.file.downloadUrl ? { downloadUrl: document.file.downloadUrl } : {}),
        ...(document.file.storagePath ? { storagePath: document.file.storagePath } : {}),
        updatedAt: document.file.updatedAt,
      }
    : null;

  return {
    id: document.id,
    owner: document.owner,
    title: document.title,
    category: document.category,
    notes: document.notes ?? "",
    file,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    createdBy: isNew ? uid : undefined,
    updatedBy: uid,
    syncedAt: serverTimestamp(),
  };
}

function normalizeFirestoreDocument(documentId: string, value: unknown) {
  const document = normalizeDocument({ ...(value as object), id: (value as Partial<TravelDocument>)?.id ?? documentId });
  if (!document) return null;
  return { ...document, id: document.id || documentId };
}

function sortDocuments(documents: TravelDocument[]) {
  return [...documents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function legacyDocumentsCollection(uid: string, tripId: string) {
  return collection(getFirebaseFirestore(), "users", uid, "trips", tripId, "documents");
}

export async function migrateLegacyDocumentsIfNeeded(uid: string, localDocuments: TravelDocument[], tripId = getActiveTripId()) {
  const sharedDocuments = sharedTripCollection(tripId, "documents");
  try {
    const [sharedSnapshot, legacySnapshot] = await Promise.all([
      getDocs(sharedDocuments),
      getDocs(legacyDocumentsCollection(uid, tripId)),
    ]);
    const existingIds = new Set(sharedSnapshot.docs.map((item) => item.id));
    const legacyDocuments = legacySnapshot.docs
      .map((item) => normalizeFirestoreDocument(item.id, item.data()))
      .filter((document): document is TravelDocument => document !== null);
    const candidates = [...legacyDocuments, ...localDocuments].filter((document, index, documents) =>
      !existingIds.has(document.id) && documents.findIndex((item) => item.id === document.id) === index,
    );

    if (!candidates.length) return;

    const batch = writeBatch(sharedDocuments.firestore);
    for (const document of candidates) {
      batch.set(
        sharedTripSubDoc(tripId, "documents", document.id),
        sanitizeFirestoreData(serializeDocumentForFirestore(document, uid, true)),
        { merge: true },
      );
    }
    await batch.commit();
  } catch (error) {
    logSyncOperationError({
      operation: "migrateLegacyDocumentsIfNeeded",
      source: "Firestore",
      path: `trips/${tripId}/documents`,
      uid,
      phase: "migrate",
      error,
    });
    throw error;
  }
}

export function subscribeToSharedDocuments(
  tripId: string,
  onDocuments: (documents: TravelDocument[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    sharedTripCollection(tripId, "documents"),
    (snapshot) => {
      onDocuments(sortDocuments(
        snapshot.docs
          .map((item) => normalizeFirestoreDocument(item.id, item.data()))
          .filter((document): document is TravelDocument => document !== null),
      ));
    },
    (error) => onError(error),
  );
}

export async function uploadDocumentFileToStorage(uid: string, document: TravelDocument, tripId = getActiveTripId()) {
  if (!document.file) return document;

  void uid;
  const storagePath = buildTripDocumentStoragePath(tripId, document.id, document.file.fileName);
  // Legacy documents keep their existing Storage object and download URL. Only a new
  // data URL (from add/replace) is uploaded to the shared trip Storage path.
  if (document.file.storagePath && document.file.downloadUrl) return document;

  try {
    const storageRef = ref(getFirebaseStorage(), storagePath);
    await uploadString(storageRef, document.file.dataUrl, "data_url", { contentType: document.file.fileType });
    return {
      ...document,
      file: {
        ...document.file,
        downloadUrl: await getDownloadURL(storageRef),
        storagePath,
      },
    };
  } catch (error) {
    logSyncOperationError({
      operation: "uploadDocumentFileToStorage",
      source: "Firebase Storage",
      path: storagePath,
      uid,
      phase: "uploadString",
      error,
    });
    throw error;
  }
}

export async function saveDocumentToFirestore(uid: string, document: TravelDocument, tripId = getActiveTripId()) {
  const documentRef = sharedTripSubDoc(tripId, "documents", document.id);
  const path = documentRef.path;
  try {
    const existing = await getDoc(documentRef);
    await setDoc(documentRef, sanitizeFirestoreData(serializeDocumentForFirestore(document, uid, !existing.exists())), { merge: true });
  } catch (error) {
    logSyncOperationError({
      operation: "saveDocumentToFirestore",
      source: "Firestore",
      path,
      uid,
      phase: "setDoc",
      error,
    });
    throw error;
  }
}

export async function deleteDocumentFromFirestore(uid: string, document: TravelDocument, tripId = getActiveTripId()) {
  const documentRef = sharedTripSubDoc(tripId, "documents", document.id);
  const path = documentRef.path;
  try {
    await deleteDoc(documentRef);
    if (document.file?.storagePath) {
      await deleteObject(ref(getFirebaseStorage(), document.file.storagePath));
    }
  } catch (error) {
    logSyncOperationError({
      operation: "deleteDocumentFromFirestore",
      source: "Firestore",
      path,
      uid,
      phase: "deleteDoc",
      error,
    });
    throw error;
  }
}

export function validateDocumentFile(file: File) {
  if (!DOCUMENT_FILE_TYPES.has(file.type)) {
    throw new Error("Please choose a PDF, JPG, PNG, or WebP document.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error("Document file must be 10MB or smaller.");
  }
}

export function readDocumentFile(file: File): Promise<TravelDocumentFile> {
  validateDocumentFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read this document file."));
        return;
      }

      resolve({
        fileName: file.name,
        fileType: file.type,
        dataUrl: reader.result,
        updatedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => reject(new Error("Could not read this document file."));
    reader.readAsDataURL(file);
  });
}

export function isImageDocument(file?: TravelDocumentFile) {
  return Boolean(file?.fileType.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file?.fileName ?? ""));
}

export function documentPreviewUrl(file?: TravelDocumentFile) {
  if (!file) return "";
  if (isImageDocument(file)) return file.dataUrl;
  return `${file.dataUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}
