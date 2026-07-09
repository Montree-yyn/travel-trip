import { SYNC_DOC_ID } from "./types";

export type TripSyncCollection =
  | "settings"
  | "favorites"
  | "visited"
  | "memories"
  | "translator";

export function tripSyncDocPath(uid: string, tripId: string, collection: TripSyncCollection) {
  return `users/${uid}/trips/${tripId}/${collection}/${SYNC_DOC_ID}`;
}
