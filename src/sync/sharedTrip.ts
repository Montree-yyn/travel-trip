import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";

import type { AuthUser } from "@/auth/types";
import { getFirebaseFirestore } from "@/firebase/firestore";

import { TRIP_ID } from "./keys";

export const ACTIVE_TRIP_STORAGE_KEY = "travel-trip-active-trip-id";
export const DEFAULT_ACTIVE_TRIP_ID = TRIP_ID;

export type SharedTripCollection =
  | "documents"
  | "flights"
  | "hotels"
  | "expenses"
  | "budget"
  | "checklist"
  | "itinerary"
  | "places";

export function getActiveTripId() {
  if (typeof window === "undefined") return DEFAULT_ACTIVE_TRIP_ID;
  const stored = window.localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY)?.trim();
  return stored || DEFAULT_ACTIVE_TRIP_ID;
}

export function cacheActiveTripId(tripId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, tripId);
}

export function sharedTripDoc(tripId = getActiveTripId()) {
  return doc(getFirebaseFirestore(), "trips", tripId);
}

export function sharedTripCollection(
  tripId: string,
  collectionName: SharedTripCollection,
): CollectionReference {
  return collection(sharedTripDoc(tripId), collectionName);
}

export function sharedTripSubDoc(
  tripId: string,
  collectionName: SharedTripCollection,
  documentId: string,
): DocumentReference {
  return doc(sharedTripCollection(tripId, collectionName), documentId);
}

export function legacyUserTripSubDoc(
  uid: string,
  tripId: string,
  collectionName: string,
  documentId = "data",
) {
  return doc(getFirebaseFirestore(), "users", uid, "trips", tripId, collectionName, documentId);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeFirestoreData<T>(value: T): T {
  if (value === undefined) return undefined as T;
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    const sanitizedArray: unknown[] = [];
    for (const item of value) {
      const sanitizedItem = sanitizeFirestoreData(item);
      if (sanitizedItem !== undefined) sanitizedArray.push(sanitizedItem);
    }
    return sanitizedArray as T;
  }

  if (!isPlainRecord(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const sanitizedItem = sanitizeFirestoreData(item);
    if (sanitizedItem !== undefined) sanitized[key] = sanitizedItem;
  }
  return sanitized as T;
}

export async function setSharedTripSubDoc(
  tripId: string,
  collectionName: SharedTripCollection,
  documentId: string,
  data: object,
  options: { merge?: boolean } = { merge: true },
) {
  const ref = sharedTripSubDoc(tripId, collectionName, documentId);
  await setDoc(ref, sanitizeFirestoreData(data), { merge: options.merge ?? true });
}

export async function ensureSharedTripMembership(user: AuthUser, tripId = DEFAULT_ACTIVE_TRIP_ID) {
  const db = getFirebaseFirestore();
  const userRef = doc(db, "users", user.uid);
  const tripRef = doc(db, "trips", tripId);
  const memberRef = doc(tripRef, "members", user.uid);

  const [tripSnapshot, memberSnapshot] = await Promise.all([
    getDoc(tripRef),
    getDoc(memberRef),
  ]);
  const role = memberSnapshot.exists()
    ? (memberSnapshot.data().role === "owner" ? "owner" : "editor")
    : (tripSnapshot.exists() ? "editor" : "owner");

  await setDoc(
    userRef,
    sanitizeFirestoreData({
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      activeTripId: tripId,
      joinedTrips: arrayUnion(tripId),
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  );

  if (!tripSnapshot.exists()) {
    await setDoc(
      tripRef,
      sanitizeFirestoreData({
        id: tripId,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true },
    );
  }

  await setDoc(
    memberRef,
    sanitizeFirestoreData({
      uid: user.uid,
      role,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      joinedAt: memberSnapshot.exists() ? undefined : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  );

  await setDoc(
    tripRef,
    sanitizeFirestoreData({
      id: tripId,
      active: true,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  );

  cacheActiveTripId(tripId);
}
