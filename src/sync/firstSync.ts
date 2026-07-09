import {
  saveTripFavorites,
  saveTripMemories,
  saveTripSettings,
  saveTripTranslator,
  saveTripVisited,
} from "./firestoreSync";
import {
  readFavoritesFromStorage,
  readMemoriesFromStorage,
  readSettingsFromStorage,
  readTranslatorFromStorage,
  readVisitedFromStorage,
} from "./localStorage";
import {
  logSyncEarlyReturn,
  logSyncFlow,
  logSyncOperationError,
  summarizeSyncSnapshot,
} from "./syncDebugLog";
import type { TripSyncSnapshot } from "./types";

async function uploadMissingDoc(
  operation: string,
  uid: string,
  upload: () => Promise<void>,
) {
  logSyncFlow(`${operation}.upload.start`, { uid });

  try {
    await upload();
    logSyncFlow(`${operation}.upload.success`, { uid });
  } catch (error) {
    logSyncOperationError({
      operation,
      source: "firstSync",
      uid,
      phase: "performFirstSync",
      error,
    });
    throw error;
  }
}

export async function performFirstSync(uid: string, tripId: string, snapshot: TripSyncSnapshot) {
  logSyncFlow("performFirstSync.enter", {
    uid,
    tripId,
    snapshot: summarizeSyncSnapshot(snapshot),
  });

  const uploads: Promise<void>[] = [];

  if (!snapshot.settings) {
    uploads.push(
      uploadMissingDoc("performFirstSync.settings", uid, () =>
        saveTripSettings(uid, tripId, readSettingsFromStorage()),
      ),
    );
  }

  if (!snapshot.favorites) {
    uploads.push(
      uploadMissingDoc("performFirstSync.favorites", uid, () =>
        saveTripFavorites(uid, tripId, readFavoritesFromStorage()),
      ),
    );
  }

  if (!snapshot.visited) {
    uploads.push(
      uploadMissingDoc("performFirstSync.visited", uid, () =>
        saveTripVisited(uid, tripId, readVisitedFromStorage()),
      ),
    );
  }

  if (!snapshot.memories) {
    uploads.push(
      uploadMissingDoc("performFirstSync.memories", uid, () =>
        saveTripMemories(uid, tripId, readMemoriesFromStorage()),
      ),
    );
  }

  if (!snapshot.translator) {
    uploads.push(
      uploadMissingDoc("performFirstSync.translator", uid, () =>
        saveTripTranslator(uid, tripId, readTranslatorFromStorage()),
      ),
    );
  }

  if (uploads.length === 0) {
    logSyncEarlyReturn("performFirstSync", "all snapshot fields already present — no uploads scheduled", {
      uid,
      tripId,
      snapshot: summarizeSyncSnapshot(snapshot),
    });
    return;
  }

  logSyncFlow("performFirstSync.uploads.scheduled", {
    uid,
    tripId,
    uploadCount: uploads.length,
  });

  await Promise.all(uploads);

  logSyncFlow("performFirstSync.complete", { uid, tripId, uploadCount: uploads.length });
}
