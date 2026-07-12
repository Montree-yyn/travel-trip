import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseFirestore } from "@/firebase/firestore";

import { tripSyncDocPath, type TripSyncCollection } from "./paths";
import {
  logSyncOperationError,
  logSyncWriteAttempt,
} from "./syncDebugLog";
import type {
  TripFavoritesDoc,
  TripSettingsDoc,
  TripSyncSnapshot,
  TripTranslatorDoc,
  TripVisitedDoc,
} from "./types";

function formatFieldPath(parentPath: string, key: string) {
  const segment = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `[${JSON.stringify(key)}]`;
  if (!parentPath) return segment;
  return segment.startsWith("[") ? `${parentPath}${segment}` : `${parentPath}.${segment}`;
}

function findUndefinedFieldPaths(value: unknown, currentPath = ""): string[] {
  if (value === undefined) return [currentPath];
  if (value === null || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUndefinedFieldPaths(item, `${currentPath}[${index}]`));
  }

  return Object.entries(value).flatMap(([key, item]) => {
    return findUndefinedFieldPaths(item, formatFieldPath(currentPath, key));
  });
}

function logUndefinedFirestoreFields({
  operation,
  path,
  payload,
}: {
  operation: string;
  path: string;
  payload: object;
}) {
  const undefinedFields = findUndefinedFieldPaths(payload);
  if (undefinedFields.length === 0) return undefinedFields;

  console.error("[travel-trip-sync] Firestore payload contains undefined field value", {
    operation,
    path,
    undefinedFields,
    payload,
  });

  return undefinedFields;
}

function assertNoUndefinedFirestoreFields({
  operation,
  path,
  payload,
}: {
  operation: string;
  path: string;
  payload: object;
}) {
  const undefinedFields = logUndefinedFirestoreFields({ operation, path, payload });
  if (undefinedFields.length === 0) return;

  throw new Error(
    `Firestore write blocked for ${operation}; undefined field(s): ${undefinedFields.join(", ")}`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeFirestoreData<T>(value: T): T {
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

  if (!isRecord(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const sanitizedItem = sanitizeFirestoreData(item);
    if (sanitizedItem !== undefined) sanitized[key] = sanitizedItem;
  }
  return sanitized as T;
}

async function readTripDoc<T>(uid: string, tripId: string, collection: TripSyncCollection) {
  const path = tripSyncDocPath(uid, tripId, collection);
  const operation = `readTripDoc.${collection}`;

  try {
    const db = getFirebaseFirestore();
    const snapshot = await getDoc(doc(db, path));
    return snapshot.exists() ? (snapshot.data() as T) : null;
  } catch (error) {
    logSyncOperationError({
      operation,
      source: "Firestore",
      path,
      uid,
      phase: "getDoc",
      error,
    });
    throw error;
  }
}

async function writeTripDoc(
  uid: string,
  tripId: string,
  collection: TripSyncCollection,
  data: object,
) {
  const path = tripSyncDocPath(uid, tripId, collection);
  const operation = `writeTripDoc.${collection}`;
  logUndefinedFirestoreFields({ operation, path, payload: data });
  const sanitizedData = sanitizeFirestoreData(data);
  const payloadJson = JSON.stringify(sanitizedData);
  const payloadKeys = Object.keys(sanitizedData);
  const payload = {
    ...sanitizedData,
    updatedAt: serverTimestamp(),
  };

  logSyncWriteAttempt({
    operation,
    uid,
    path,
    phase: "writeTripDoc.enter",
    payloadKeys,
    payloadBytes: payloadJson.length,
  });

  try {
    const db = getFirebaseFirestore();

    assertNoUndefinedFirestoreFields({
      operation,
      path,
      payload,
    });

    logSyncWriteAttempt({
      operation,
      uid,
      path,
      phase: "beforeSetDoc",
      payloadKeys,
      payloadBytes: payloadJson.length,
    });

    await setDoc(
      doc(db, path),
      payload,
      { merge: true },
    );

    logSyncWriteAttempt({
      operation,
      uid,
      path,
      phase: "afterSetDoc",
      payloadKeys,
      payloadBytes: payloadJson.length,
    });
  } catch (error) {
    logSyncOperationError({
      operation,
      source: "Firestore",
      path,
      uid,
      phase: "setDoc",
      error,
    });
    throw error;
  }
}

export async function loadTripSyncSnapshot(uid: string, tripId: string): Promise<TripSyncSnapshot> {
  const [settings, favorites, visited, translator] = await Promise.all([
    readTripDoc<TripSettingsDoc>(uid, tripId, "settings"),
    readTripDoc<TripFavoritesDoc>(uid, tripId, "favorites"),
    readTripDoc<TripVisitedDoc>(uid, tripId, "visited"),
    readTripDoc<TripTranslatorDoc>(uid, tripId, "translator"),
  ]);

  return { settings, favorites, visited, checklist: null, budget: null, translator };
}

export function saveTripSettings(uid: string, tripId: string, settings: TripSettingsDoc) {
  return writeTripDoc(uid, tripId, "settings", settings);
}

export function saveTripFavorites(uid: string, tripId: string, favorites: TripFavoritesDoc) {
  return writeTripDoc(uid, tripId, "favorites", favorites);
}

export function saveTripVisited(uid: string, tripId: string, visited: TripVisitedDoc) {
  return writeTripDoc(uid, tripId, "visited", visited);
}

export function saveTripTranslator(uid: string, tripId: string, translator: TripTranslatorDoc) {
  return writeTripDoc(uid, tripId, "translator", translator);
}
