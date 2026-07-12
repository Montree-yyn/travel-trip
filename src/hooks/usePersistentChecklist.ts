import {
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { createChecklistItemId, normalizeChecklistData } from "@/lib/checklist";
import { readChecklistFromStorage } from "@/sync/localStorage";
import {
  getActiveTripId,
  legacyUserTripSubDoc,
  sanitizeFirestoreData,
  sharedTripCollection,
  sharedTripSubDoc,
} from "@/sync/sharedTrip";
import type { ChecklistItem } from "@/types/trip";

export type ChecklistItemInput = Omit<ChecklistItem, "id" | "checked">;

const metadataDocId = "__meta";

function normalizeChecklistItemDoc(snapshot: QueryDocumentSnapshot): ChecklistItem | null {
  if (snapshot.id === metadataDocId) return null;
  const normalized = normalizeChecklistData({ items: [{ ...snapshot.data(), id: snapshot.id }] });
  return normalized.items[0] ?? null;
}

function serializeChecklistItem({
  item,
  tripId,
  uid,
  isCreate,
}: {
  item: ChecklistItem;
  tripId: string;
  uid: string;
  isCreate?: boolean;
}) {
  return sanitizeFirestoreData({
    ...item,
    tripId,
    createdAt: isCreate ? serverTimestamp() : undefined,
    updatedAt: serverTimestamp(),
    createdBy: isCreate ? uid : undefined,
    updatedBy: uid,
  });
}

async function migrateLegacyChecklistIfNeeded(uid: string, tripId: string) {
  const checklistRef = sharedTripCollection(tripId, "checklist");
  const existing = await getDocs(checklistRef);
  if (!existing.empty) return;

  const legacySnapshot = await getDoc(legacyUserTripSubDoc(uid, tripId, "checklist"));
  const checklist = legacySnapshot.exists()
    ? normalizeChecklistData(legacySnapshot.data())
    : normalizeChecklistData(readChecklistFromStorage());

  const batch = writeBatch(checklistRef.firestore);
  batch.set(
    sharedTripSubDoc(tripId, "checklist", metadataDocId),
    sanitizeFirestoreData({
      kind: "metadata",
      tripId,
      initializedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    }),
    { merge: true },
  );

  for (const item of checklist.items) {
    batch.set(
      sharedTripSubDoc(tripId, "checklist", item.id),
      serializeChecklistItem({ item, tripId, uid, isCreate: true }),
      { merge: true },
    );
  }
  await batch.commit();
}

export function usePersistentChecklist() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState(() => normalizeChecklistData(null).items);
  const [error, setError] = useState("");
  const migrationKeyRef = useRef("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setItems(normalizeChecklistData(readChecklistFromStorage()).items);
      setError("Cloud sync is not configured. Checklist changes may stay on this device.");
      return;
    }

    if (authLoading || !user) return;

    const tripId = getActiveTripId();
    return onSnapshot(
      sharedTripCollection(tripId, "checklist"),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map(normalizeChecklistItemDoc)
          .filter((item): item is ChecklistItem => item !== null);
        setItems(snapshot.empty ? normalizeChecklistData(null).items : nextItems);

        const migrationKey = `${user.uid}:${tripId}:checklist`;
        if (snapshot.empty && !snapshot.metadata.fromCache && migrationKeyRef.current !== migrationKey) {
          migrationKeyRef.current = migrationKey;
          void migrateLegacyChecklistIfNeeded(user.uid, tripId).catch((migrationError) => {
            console.error("[travel-trip-sync] Could not migrate legacy checklist data", migrationError);
          });
        }
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Checklist snapshot failed", snapshotError);
        setError("Could not load the shared checklist. Please refresh and try again.");
      },
    );
  }, [authLoading, user]);

  const persistItem = useCallback(
    (item: ChecklistItem, isCreate?: boolean) => {
      if (!user || !isFirebaseConfigured()) return;
      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "checklist", item.id),
        serializeChecklistItem({ item, tripId, uid: user.uid, isCreate }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Checklist save failed", saveError);
        setError("Could not save this checklist item to the shared trip. Please try again.");
      });
    },
    [user],
  );

  const addItem = useCallback((input: ChecklistItemInput) => {
    const item = { ...input, id: createChecklistItemId(), checked: false };
    setItems((current) => [...current, item]);
    persistItem(item, true);
  }, [persistItem]);

  const updateItem = useCallback((id: string, input: ChecklistItemInput) => {
    setItems((current) => {
      const nextItems = current.map((item) => (item.id === id ? { ...item, ...input } : item));
      const nextItem = nextItems.find((item) => item.id === id);
      if (nextItem) persistItem(nextItem);
      return nextItems;
    });
  }, [persistItem]);

  const deleteItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (!user || !isFirebaseConfigured()) return;
    const tripId = getActiveTripId();
    void deleteDoc(sharedTripSubDoc(tripId, "checklist", id)).catch((deleteError) => {
      console.error("[travel-trip-sync] Checklist delete failed", deleteError);
      setError("Could not delete this checklist item from the shared trip. Please try again.");
    });
  }, [user]);

  const toggleItem = useCallback((id: string) => {
    setItems((current) => {
      const nextItems = current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      const nextItem = nextItems.find((item) => item.id === id);
      if (nextItem) persistItem(nextItem);
      return nextItems;
    });
  }, [persistItem]);

  return {
    items,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
  };
}
