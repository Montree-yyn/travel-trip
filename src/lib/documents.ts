import { sampleTrip } from "@/data/sample-trip";
import type { DocumentCategory, DocumentCategoryId, TravelDocument, TravelDocumentFile } from "@/types/document";

const STORAGE_KEY = `travel-trip-documents:${sampleTrip.id}:v1`;
const DOCUMENT_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const DEFAULT_DOCUMENT_OWNERS = ["CAKE", "นุ่มนิ่ม", "ยินดี", "ญาณิน"];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "travel-insurance",
    title: "Travel Insurance",
    description: "Policies, cards, emergency contacts, and claim details.",
  },
  {
    id: "usj-tickets",
    title: "USJ Tickets",
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
