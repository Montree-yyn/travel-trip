import { useCallback, useEffect, useRef, useState } from "react";

import { createMemoryId, createPlaceholderPhotos } from "@/lib/memories";
import { readMemoriesFromStorage, writeMemoriesToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type { MemoryEntry } from "@/types/memory";

export type MemoryEntryInput = Pick<MemoryEntry, "day" | "date" | "title" | "note" | "location" | "tags">;

export function usePersistentMemories() {
  const { ready, syncVersion, saveMemories } = useTripSync();
  const [data, setData] = useState(() => readMemoriesFromStorage());
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!ready) return;
    skipNextSave.current = true;
    setData(readMemoriesFromStorage());
  }, [ready, syncVersion]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    writeMemoriesToStorage(data);
    void saveMemories(data);
  }, [data, ready, saveMemories]);

  const entries = data.entries;

  const addMemory = useCallback((input: MemoryEntryInput) => {
    setData((current) => ({
      entries: [
        ...current.entries,
        {
          ...input,
          id: createMemoryId(),
          photos: createPlaceholderPhotos(input),
        },
      ],
    }));
  }, []);

  const updateMemory = useCallback((id: string, input: MemoryEntryInput) => {
    setData((current) => ({
      entries: current.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...input,
              photos:
                entry.photos.length > 0
                  ? entry.photos
                  : createPlaceholderPhotos(input),
            }
          : entry,
      ),
    }));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setData((current) => ({
      entries: current.entries.filter((entry) => entry.id !== id),
    }));
  }, []);

  const updateEntryPhotos = useCallback((entryId: string, photos: MemoryEntry["photos"]) => {
    setData((current) => ({
      entries: current.entries.map((entry) =>
        entry.id === entryId ? { ...entry, photos } : entry,
      ),
    }));
  }, []);

  return {
    entries,
    addMemory,
    updateMemory,
    deleteMemory,
    updateEntryPhotos,
  };
}
