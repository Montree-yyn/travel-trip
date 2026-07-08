import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";

import { TRIP_ID } from "./keys";
import {
  readBudgetFromStorage,
  readChecklistFromStorage,
  readFavoritesFromStorage,
  readMemoriesFromStorage,
  readSettingsFromStorage,
  readTranslatorFromStorage,
  readVisitedFromStorage,
  writeBudgetToStorage,
  writeChecklistToStorage,
  writeFavoritesToStorage,
  writeMemoriesToStorage,
  writeSettingsToStorage,
  writeTranslatorToStorage,
  writeVisitedToStorage,
} from "./localStorage";
import { dispatchSettingsSync, registerSettingsSaveHandler } from "./settingsBridge";
import { logSyncEarlyReturn, logSyncFlow, logSyncProviderError, summarizeSyncSnapshot } from "./syncDebugLog";
import type {
  TripBudgetDoc,
  TripChecklistDoc,
  TripFavoritesDoc,
  TripMemoriesDoc,
  TripSettingsDoc,
  TripSyncSnapshot,
  TripTranslatorDoc,
  TripVisitedDoc,
  SyncStatus,
} from "./types";

interface TripSyncContextValue {
  loading: boolean;
  ready: boolean;
  error: string | null;
  status: SyncStatus;
  syncVersion: number;
  retry: () => void;
  saveFavorites: (favorites: TripFavoritesDoc) => Promise<void>;
  saveVisited: (visited: TripVisitedDoc) => Promise<void>;
  saveChecklist: (checklist: TripChecklistDoc) => Promise<void>;
  saveMemories: (memories: TripMemoriesDoc) => Promise<void>;
  saveBudget: (budget: TripBudgetDoc) => Promise<void>;
  saveTranslator: (translator: TripTranslatorDoc) => Promise<void>;
}

const TripSyncContext = createContext<TripSyncContextValue | null>(null);

function loadFirestoreSync() {
  return import("./firestoreSync");
}

function hydrateLocalStorage(snapshot: TripSyncSnapshot) {
  if (snapshot.settings) {
    writeSettingsToStorage(snapshot.settings);
    dispatchSettingsSync(snapshot.settings);
  }

  if (snapshot.favorites) writeFavoritesToStorage(snapshot.favorites);
  if (snapshot.visited) writeVisitedToStorage(snapshot.visited);
  if (snapshot.checklist) writeChecklistToStorage(snapshot.checklist);
  if (snapshot.memories) writeMemoriesToStorage(snapshot.memories);
  if (snapshot.budget) writeBudgetToStorage(snapshot.budget);
  if (snapshot.translator) writeTranslatorToStorage(snapshot.translator);
}

function getInitialOnlineStatus() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function TripSyncProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(getInitialOnlineStatus);
  const [syncVersion, setSyncVersion] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const pendingWrites = useRef<Map<string, () => Promise<void>>>(new Map());

  const markSyncError = useCallback((operation: string, phase: string, error?: unknown) => {
    logSyncProviderError({
      operation,
      source: "TripSyncProvider",
      phase,
      error,
    });
    setError("sync.unavailable");
  }, []);

  const queueWrite = useCallback(
    (key: string, write: () => Promise<void>) => {
      logSyncFlow("queueWrite.enter", { key, uid, online: navigator.onLine });

      if (!uid) {
        logSyncEarlyReturn("queueWrite", "missing uid", { key });
        return;
      }

      if (!isFirebaseConfigured()) {
        logSyncEarlyReturn("queueWrite", "firebase not configured", { key, uid });
        return;
      }

      pendingWrites.current.set(key, write);

      if (!navigator.onLine) {
        logSyncEarlyReturn("queueWrite", "offline — write queued but not executed", { key, uid });
        return;
      }

      logSyncFlow("queueWrite.execute", { key, uid });

      void write()
        .then(() => {
          logSyncFlow("queueWrite.success", { key, uid });
          pendingWrites.current.delete(key);
          if (pendingWrites.current.size === 0) {
            setError((current) => (current === "sync.unavailable" ? null : current));
          }
        })
        .catch((error) => {
          markSyncError(`queueWrite.${key}`, "queueWrite", error);
        });
    },
    [markSyncError, uid],
  );

  const flushPendingWrites = useCallback(() => {
    logSyncFlow("flushPendingWrites.enter", {
      uid,
      pendingCount: pendingWrites.current.size,
      online: navigator.onLine,
    });

    for (const [key, write] of pendingWrites.current.entries()) {
      logSyncFlow("flushPendingWrites.execute", { key, uid });
      void write()
        .then(() => {
          logSyncFlow("flushPendingWrites.success", { key, uid });
          pendingWrites.current.delete(key);
          if (pendingWrites.current.size === 0) {
            setError((current) => (current === "sync.unavailable" ? null : current));
          }
        })
        .catch((error) => {
          pendingWrites.current.set(key, write);
          markSyncError(`flushPendingWrites.${key}`, "flushPendingWrites", error);
        });
    }
  }, [markSyncError, uid]);

  const saveSettings = useCallback(
    async (settings: TripSettingsDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveSettings", "missing uid");
        return;
      }
      writeSettingsToStorage(settings);
      queueWrite("settings", async () => {
        const { saveTripSettings } = await loadFirestoreSync();
        return saveTripSettings(uid, TRIP_ID, settings);
      });
    },
    [queueWrite, uid],
  );

  const saveFavorites = useCallback(
    async (favorites: TripFavoritesDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveFavorites", "missing uid");
        return;
      }
      writeFavoritesToStorage(favorites);
      queueWrite("favorites", async () => {
        const { saveTripFavorites } = await loadFirestoreSync();
        return saveTripFavorites(uid, TRIP_ID, favorites);
      });
    },
    [queueWrite, uid],
  );

  const saveVisited = useCallback(
    async (visited: TripVisitedDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveVisited", "missing uid");
        return;
      }
      writeVisitedToStorage(visited);
      queueWrite("visited", async () => {
        const { saveTripVisited } = await loadFirestoreSync();
        return saveTripVisited(uid, TRIP_ID, visited);
      });
    },
    [queueWrite, uid],
  );

  const saveChecklist = useCallback(
    async (checklist: TripChecklistDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveChecklist", "missing uid");
        return;
      }
      writeChecklistToStorage(checklist);
      queueWrite("checklist", async () => {
        const { saveTripChecklist } = await loadFirestoreSync();
        return saveTripChecklist(uid, TRIP_ID, checklist);
      });
    },
    [queueWrite, uid],
  );

  const saveMemories = useCallback(
    async (memories: TripMemoriesDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveMemories", "missing uid");
        return;
      }
      writeMemoriesToStorage(memories);
      queueWrite("memories", async () => {
        const { saveTripMemories } = await loadFirestoreSync();
        return saveTripMemories(uid, TRIP_ID, memories);
      });
    },
    [queueWrite, uid],
  );

  const saveBudget = useCallback(
    async (budget: TripBudgetDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveBudget", "missing uid");
        return;
      }
      writeBudgetToStorage(budget);
      queueWrite("budget", async () => {
        const { saveTripBudget } = await loadFirestoreSync();
        return saveTripBudget(uid, TRIP_ID, budget);
      });
    },
    [queueWrite, uid],
  );

  const saveTranslator = useCallback(
    async (translator: TripTranslatorDoc) => {
      if (!uid) {
        logSyncEarlyReturn("saveTranslator", "missing uid");
        return;
      }
      writeTranslatorToStorage(translator);
      queueWrite("translator", async () => {
        const { saveTripTranslator } = await loadFirestoreSync();
        return saveTripTranslator(uid, TRIP_ID, translator);
      });
    },
    [queueWrite, uid],
  );

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    registerSettingsSaveHandler(uid ? saveSettings : null);
    return () => registerSettingsSaveHandler(null);
  }, [saveSettings, uid]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      flushPendingWrites();
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushPendingWrites]);

  useEffect(() => {
    if (authLoading) {
      logSyncEarlyReturn("bootstrap", "auth still loading");
      return;
    }

    if (!isFirebaseConfigured()) {
      logSyncProviderError({
        operation: "bootstrap.skip",
        source: "TripSyncProvider",
        phase: "firebaseNotConfigured",
      });
      setLoading(false);
      setReady(true);
      setError("sync.unavailable");
      return;
    }

    if (!uid) {
      logSyncEarlyReturn("bootstrap", "no uid — logged out");
      setLoading(false);
      setReady(true);
      setError(null);
      return;
    }

    let cancelled = false;
    const activeUid = uid;

    async function bootstrap() {
      logSyncFlow("bootstrap.start", { uid: activeUid, tripId: TRIP_ID });
      setLoading(true);
      setError(null);

      try {
        const { loadTripSyncSnapshot } = await loadFirestoreSync();
        const snapshot = await loadTripSyncSnapshot(activeUid, TRIP_ID);
        if (cancelled) {
          logSyncEarlyReturn("bootstrap", "cancelled after loadTripSyncSnapshot", { uid: activeUid });
          return;
        }

        logSyncFlow("bootstrap.snapshotLoaded", {
          uid: activeUid,
          tripId: TRIP_ID,
          snapshot: summarizeSyncSnapshot(snapshot),
        });

        hydrateLocalStorage(snapshot);

        logSyncFlow("bootstrap.performFirstSync.calling", { uid: activeUid, tripId: TRIP_ID });

        try {
          const { performFirstSync } = await import("./firstSync");
          await performFirstSync(activeUid, TRIP_ID, snapshot);
          logSyncFlow("bootstrap.performFirstSync.returned", { uid: activeUid, tripId: TRIP_ID });
        } catch (error) {
          if (!cancelled) markSyncError("bootstrap.performFirstSync", "bootstrap", error);
        }

        if (cancelled) {
          logSyncEarlyReturn("bootstrap", "cancelled after performFirstSync", { uid: activeUid });
          return;
        }

        setSyncVersion((value) => value + 1);
        setReady(true);
        logSyncFlow("bootstrap.complete", { uid: activeUid, tripId: TRIP_ID });
      } catch (error) {
        if (cancelled) {
          logSyncEarlyReturn("bootstrap", "cancelled during loadTripSyncSnapshot", { uid: activeUid });
          return;
        }

        readSettingsFromStorage();
        readFavoritesFromStorage();
        readVisitedFromStorage();
        readChecklistFromStorage();
        readMemoriesFromStorage();
        readBudgetFromStorage();
        readTranslatorFromStorage();
        markSyncError("bootstrap.loadTripSyncSnapshot", "bootstrap", error);
        setReady(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      logSyncFlow("bootstrap.cleanup", { uid: activeUid });
    };
  }, [authLoading, markSyncError, reloadToken, uid]);

  const status = useMemo<SyncStatus>(() => {
    if (error) return "error";
    if (!online) return "offline";
    return "synced";
  }, [error, online]);

  const value = useMemo(
    () => ({
      loading,
      ready,
      error,
      status,
      syncVersion,
      retry,
      saveFavorites,
      saveVisited,
      saveChecklist,
      saveMemories,
      saveBudget,
      saveTranslator,
    }),
    [
      loading,
      ready,
      error,
      status,
      syncVersion,
      retry,
      saveFavorites,
      saveVisited,
      saveChecklist,
      saveMemories,
      saveBudget,
      saveTranslator,
    ],
  );

  return <TripSyncContext.Provider value={value}>{children}</TripSyncContext.Provider>;
}

export function useTripSync() {
  const context = useContext(TripSyncContext);
  if (!context) {
    throw new Error("useTripSync must be used within TripSyncProvider");
  }
  return context;
}
