import { useCallback, useEffect, useRef, useState } from "react";

import { createChecklistItemId } from "@/lib/checklist";
import { readChecklistFromStorage, writeChecklistToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type { ChecklistItem } from "@/types/trip";

export type ChecklistItemInput = Omit<ChecklistItem, "id" | "checked">;

export function usePersistentChecklist() {
  const { ready, syncVersion, saveChecklist } = useTripSync();
  const [data, setData] = useState(() => readChecklistFromStorage());
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!ready) return;
    skipNextSave.current = true;
    setData(readChecklistFromStorage());
  }, [ready, syncVersion]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    writeChecklistToStorage(data);
    void saveChecklist(data);
  }, [data, ready, saveChecklist]);

  const items = data.items;

  const addItem = useCallback((input: ChecklistItemInput) => {
    setData((current) => ({
      items: [...current.items, { ...input, id: createChecklistItemId(), checked: false }],
    }));
  }, []);

  const updateItem = useCallback((id: string, input: ChecklistItemInput) => {
    setData((current) => ({
      items: current.items.map((item) => (item.id === id ? { ...item, ...input } : item)),
    }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setData((current) => ({
      items: current.items.filter((item) => item.id !== id),
    }));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setData((current) => ({
      items: current.items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    }));
  }, []);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
  };
}
