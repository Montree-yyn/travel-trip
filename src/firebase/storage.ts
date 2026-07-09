import { getStorage, type FirebaseStorage } from "firebase/storage";

import { getFirebaseApp, isFirebaseConfigured } from "@/firebase/config";

let storage: FirebaseStorage | undefined;

export function getFirebaseStorage() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase Storage is not configured.");
  }

  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }

  return storage;
}

export type MemoryPhotoVariant = "full" | "thumbnail";

export function buildMemoryPhotoStoragePath(
  uid: string,
  tripId: string,
  entryId: string,
  photoId: string,
  variant: MemoryPhotoVariant = "full",
) {
  const suffix = variant === "thumbnail" ? "_thumb" : "";
  return `users/${uid}/trips/${tripId}/memories/${entryId}/${photoId}${suffix}.jpg`;
}

export function buildBudgetReceiptStoragePath(tripId: string, receiptId: string) {
  return `trips/${cleanStorageSegment(tripId)}/expenses/receipts/${cleanStorageSegment(receiptId)}.jpg`;
}

export function buildTravelDocumentStoragePath(uid: string, tripId: string, documentId: string, fileName: string) {
  return `users/${uid}/trips/${tripId}/documents/${cleanStorageSegment(documentId)}/${cleanStorageSegment(fileName)}`;
}

function cleanStorageSegment(value: string) {
  return value
    .trim()
    .replace(/[/\\]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.#?[\]*]+/g, "-")
    || "booking";
}

export function buildTripDocumentStoragePath(tripId: string, documentId: string, fileName: string) {
  return `trips/${cleanStorageSegment(tripId)}/documents/${cleanStorageSegment(documentId)}/${cleanStorageSegment(fileName)}`;
}

export function buildFlightBookingPdfStoragePath(tripId: string, bookingId: string, fileName: string) {
  return buildTripDocumentStoragePath(tripId, `flight-${bookingId}`, fileName);
}

export function buildHotelBookingPdfStoragePath(tripId: string, bookingId: string, fileName: string) {
  return buildTripDocumentStoragePath(tripId, `hotel-${bookingId}`, fileName);
}
