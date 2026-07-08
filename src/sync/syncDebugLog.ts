/** Temporary sync diagnostics — remove after Cloud Sync issue is resolved. */
const DEBUG_PREFIX = "[TravelTripSync]";

export type SyncErrorSource =
  | "Firestore"
  | "Firebase Storage"
  | "TripSyncProvider"
  | "firstSync"
  | "AuthProvider";

type FirebaseLikeError = {
  code?: string;
  message?: string;
  stack?: string;
};

function toFirebaseLikeError(error: unknown): FirebaseLikeError {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const candidate = error as FirebaseLikeError;
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message:
      typeof candidate.message === "string"
        ? candidate.message
        : error instanceof Error
          ? error.message
          : String(error),
    stack: error instanceof Error ? error.stack : candidate.stack,
  };
}

export function logSyncFlow(message: string, details?: Record<string, unknown>) {
  console.info(`${DEBUG_PREFIX} ${message}`, details ?? {});
}

export function logSyncEarlyReturn(
  functionName: string,
  reason: string,
  details?: Record<string, unknown>,
) {
  console.warn(`${DEBUG_PREFIX} early return`, {
    function: functionName,
    reason,
    ...details,
  });
}

export function logSyncWriteAttempt(params: {
  operation: string;
  uid: string;
  path: string;
  phase: "setDoc" | "beforeSetDoc" | "afterSetDoc" | "writeTripDoc.enter";
  payloadKeys?: string[];
  payloadBytes?: number;
}) {
  console.info(`${DEBUG_PREFIX} write attempt`, params);
}

export function logSyncOperationError(params: {
  operation: string;
  source: SyncErrorSource;
  path?: string;
  uid?: string;
  error: unknown;
  phase?: string;
}) {
  const { code, message, stack } = toFirebaseLikeError(params.error);

  console.error(`${DEBUG_PREFIX} operation failed`, {
    operation: params.operation,
    source: params.source,
    path: params.path,
    uid: params.uid,
    phase: params.phase,
    code: code ?? "unknown",
    message: message ?? "unknown",
    stack,
  });
}

export function logSyncProviderError(params: {
  operation: string;
  source: Extract<SyncErrorSource, "TripSyncProvider">;
  phase: string;
  error?: unknown;
}) {
  if (params.error) {
    logSyncOperationError({
      operation: params.operation,
      source: params.source,
      phase: params.phase,
      error: params.error,
    });
    return;
  }

  console.error(`${DEBUG_PREFIX} sync state set to unavailable`, {
    operation: params.operation,
    source: params.source,
    phase: params.phase,
    code: "sync.unavailable",
    message: "TripSyncProvider marked sync as unavailable (no thrown error)",
  });
}

import type { TripSyncSnapshot } from "./types";

export function summarizeSyncSnapshot(snapshot: TripSyncSnapshot) {
  return Object.fromEntries(
    Object.entries(snapshot).map(([key, value]) => [
      key,
      value === null ? "null (missing in Firestore)" : `present (${typeof value})`,
    ]),
  );
}
