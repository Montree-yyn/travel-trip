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

export function buildBudgetReceiptStoragePath(uid: string, tripId: string, receiptId: string) {
  return `users/${uid}/trips/${tripId}/budget/receipts/${receiptId}.jpg`;
}

function cleanStorageSegment(value: string) {
  return value
    .trim()
    .replace(/[/\\]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.#?[\]*]+/g, "-")
    || "booking";
}

export function buildFlightBookingPdfStoragePath(uid: string, bookingId: string, fileName: string) {
  return `users/${uid}/bookings/flights/${cleanStorageSegment(bookingId)}/${cleanStorageSegment(fileName)}`;
}

export function buildHotelBookingPdfStoragePath(uid: string, bookingId: string, fileName: string) {
  return `users/${uid}/bookings/hotels/${cleanStorageSegment(bookingId)}/${cleanStorageSegment(fileName)}`;
}
