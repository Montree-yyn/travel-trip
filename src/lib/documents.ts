import { deleteDoc, doc, getDocs, collection, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";

import { sampleTrip, tripSettings } from "@/data/sample-trip";
import { getFirebaseFirestore } from "@/firebase/firestore";
import { buildTravelDocumentStoragePath, getFirebaseStorage } from "@/firebase/storage";
import { TRIP_ID } from "@/sync/keys";
import { logSyncOperationError } from "@/sync/syncDebugLog";
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

function documentsCollectionPath(uid: string, tripId: string) {
  return `users/${uid}/trips/${tripId}/documents`;
}

function documentPath(uid: string, tripId: string, documentId: string) {
  return `${documentsCollectionPath(uid, tripId)}/${documentId}`;
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

function serializeDocumentForFirestore(document: TravelDocument) {
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
    syncedAt: serverTimestamp(),
  };
}

function normalizeFirestoreDocument(documentId: string, value: unknown) {
  const document = normalizeDocument({ ...(value as object), id: (value as Partial<TravelDocument>)?.id ?? documentId });
  if (!document) return null;
  return { ...document, id: document.id || documentId };
}

function mergeDocuments(localDocuments: TravelDocument[], remoteDocuments: TravelDocument[]) {
  const documentsById = new Map<string, TravelDocument>();
  for (const document of localDocuments) documentsById.set(document.id, document);
  for (const document of remoteDocuments) documentsById.set(document.id, document);
  return Array.from(documentsById.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function loadDocumentsFromFirestore(uid: string, tripId = TRIP_ID) {
  const path = documentsCollectionPath(uid, tripId);
  try {
    const snapshot = await getDocs(collection(getFirebaseFirestore(), path));
    return snapshot.docs
      .map((item) => normalizeFirestoreDocument(item.id, item.data()))
      .filter((document): document is TravelDocument => document !== null);
  } catch (error) {
    logSyncOperationError({
      operation: "loadDocumentsFromFirestore",
      source: "Firestore",
      path,
      uid,
      phase: "getDocs",
      error,
    });
    throw error;
  }
}

export async function hydrateDocumentsFromFirestore(uid: string, localDocuments: TravelDocument[], tripId = TRIP_ID) {
  const remoteDocuments = await loadDocumentsFromFirestore(uid, tripId);
  const mergedDocuments = mergeDocuments(localDocuments, remoteDocuments);
  writeDocumentsToStorage(mergedDocuments);

  if (remoteDocuments.length === 0 && localDocuments.length > 0) {
    await Promise.all(
      localDocuments.map(async (document) => {
        const uploadedDocument = await uploadDocumentFileToStorage(uid, document, tripId);
        await saveDocumentToFirestore(uid, uploadedDocument, tripId);
      }),
    );
  }

  return mergedDocuments;
}

export async function uploadDocumentFileToStorage(uid: string, document: TravelDocument, tripId = TRIP_ID) {
  if (!document.file) return document;

  const storagePath = buildTravelDocumentStoragePath(uid, tripId, document.id, document.file.fileName);
  if (document.file.storagePath === storagePath && document.file.downloadUrl) return document;

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

export async function saveDocumentToFirestore(uid: string, document: TravelDocument, tripId = TRIP_ID) {
  const path = documentPath(uid, tripId, document.id);
  try {
    await setDoc(doc(getFirebaseFirestore(), path), serializeDocumentForFirestore(document), { merge: true });
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

export async function deleteDocumentFromFirestore(uid: string, document: TravelDocument, tripId = TRIP_ID) {
  const path = documentPath(uid, tripId, document.id);
  try {
    await deleteDoc(doc(getFirebaseFirestore(), path));
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
