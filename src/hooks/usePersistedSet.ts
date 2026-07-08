import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SYNC_STORAGE_KEYS } from "@/sync/keys";
import { readStringSet, writeStringSet } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";

const EMPTY_FALLBACK: string[] = [];

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export function usePersistedSet(storageKey: string, fallback: string[] = EMPTY_FALLBACK) {
  const { ready, syncVersion, saveVisited } = useTripSync();
  const [items, setItems] = useState<Set<string>>(() => readStringSet(storageKey, fallback));
  const itemsRef = useRef(items);

  useEffect(() => {
    if (!ready) return;
    const stored = readStringSet(storageKey, fallback);
    setItems((prev) => {
      if (setsEqual(prev, stored)) return prev;
      itemsRef.current = stored;
      return stored;
    });
  }, [fallback, ready, storageKey, syncVersion]);

  const persistItems = useCallback((nextItems: Set<string>) => {
    writeStringSet(storageKey, nextItems);

    if (storageKey === SYNC_STORAGE_KEYS.visited) {
      void saveVisited({ ids: [...nextItems] });
    }
  }, [saveVisited, storageKey]);

  const toggle = useCallback((value: string) => {
    const next = new Set(itemsRef.current);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    itemsRef.current = next;
    setItems(next);
    persistItems(next);
  }, [persistItems]);

  return useMemo(() => ({ items, toggle }), [items, toggle]);
}
