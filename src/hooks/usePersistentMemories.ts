import { getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { createMemoryId, createPlaceholderPhotos, normalizeMemoriesData } from "@/lib/memories";
import { readMemoriesFromStorage, writeMemoriesToStorage } from "@/sync/localStorage";
import {
  getActiveTripId,
  legacyUserTripSubDoc,
  sanitizeFirestoreData,
  sharedTripSubDoc,
} from "@/sync/sharedTrip";
import type { MemoriesData, MemoryEntry } from "@/types/memory";

export type MemoryEntryInput = Pick<MemoryEntry, "day" | "date" | "title" | "note" | "location" | "tags">;

const memoriesDocId = "data";

async function migrateLegacyMemoriesIfNeeded(uid: string, tripId: string) {
  const sharedRef = sharedTripSubDoc(tripId, "memories", memoriesDocId);
  const legacySnapshot = await getDoc(legacyUserTripSubDoc(uid, tripId, "memories"));
  const legacyData = legacySnapshot.exists()
    ? normalizeMemoriesData(legacySnapshot.data())
    : readMemoriesFromStorage();

  await runTransaction(sharedRef.firestore, async (transaction) => {
    if ((await transaction.get(sharedRef)).exists()) return;
    transaction.set(
      sharedRef,
      sanitizeFirestoreData({
        ...legacyData,
        tripId,
        migratedFrom: legacySnapshot.exists() ? "legacy-user-trip" : "local-cache",
        initializedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      }),
      { merge: true },
    );
  });
}

export function usePersistentMemories() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<MemoriesData>(() => readMemoriesFromStorage());
  const [error, setError] = useState("");
  const migrationKeyRef = useRef("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setData(readMemoriesFromStorage());
      setError("Cloud sync is not configured. Memory changes may stay on this device.");
      return;
    }

    if (authLoading || !user) return;

    const tripId = getActiveTripId();
    let cancelled = false;
    const unsubscribe = onSnapshot(
      sharedTripSubDoc(tripId, "memories", memoriesDocId),
      (snapshot) => {
        if (snapshot.exists()) {
          const nextData = normalizeMemoriesData(snapshot.data());
          writeMemoriesToStorage(nextData);
          setData(nextData);
          setError("");
          return;
        }

        // Do not treat an empty offline cache as a new shared trip. Wait until
        // Firestore confirms the document is absent before doing the additive migration.
        if (snapshot.metadata.fromCache) return;
        const migrationKey = `${user.uid}:${tripId}:memories`;
        if (migrationKeyRef.current === migrationKey) return;
        migrationKeyRef.current = migrationKey;
        void migrateLegacyMemoriesIfNeeded(user.uid, tripId).catch((migrationError) => {
          console.error("[travel-trip-sync] Could not migrate legacy memories", migrationError);
          if (!cancelled) setError("Could not load shared memories. Please refresh and try again.");
        });
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Memories snapshot failed", snapshotError);
        if (!cancelled) setError("Could not load shared memories. Please refresh and try again.");
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authLoading, user]);

  const persist = useCallback(
    (nextData: MemoriesData) => {
      writeMemoriesToStorage(nextData);
      setData(nextData);

      if (!user || !isFirebaseConfigured()) return;
      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "memories", memoriesDocId),
        sanitizeFirestoreData({
          ...nextData,
          tripId,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Memories save failed", saveError);
        setError("Could not save shared memories. Please try again.");
      });
    },
    [user],
  );

  const addMemory = useCallback((input: MemoryEntryInput) => {
    persist({
      entries: [
        ...data.entries,
        {
          ...input,
          id: createMemoryId(),
          photos: createPlaceholderPhotos(input),
        },
      ],
    });
  }, [data.entries, persist]);

  const updateMemory = useCallback((id: string, input: MemoryEntryInput) => {
    persist({
      entries: data.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...input,
              photos: entry.photos.length > 0 ? entry.photos : createPlaceholderPhotos(input),
            }
          : entry,
      ),
    });
  }, [data.entries, persist]);

  const deleteMemory = useCallback((id: string) => {
    persist({ entries: data.entries.filter((entry) => entry.id !== id) });
  }, [data.entries, persist]);

  const updateEntryPhotos = useCallback((entryId: string, photos: MemoryEntry["photos"]) => {
    persist({
      entries: data.entries.map((entry) => (entry.id === entryId ? { ...entry, photos } : entry)),
    });
  }, [data.entries, persist]);

  return {
    entries: data.entries,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    updateEntryPhotos,
  };
}
