import { deleteDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { sanitizeFirestoreData, sharedTripSubDoc } from "@/sync/sharedTrip";

export interface TripDocumentInput {
  id: string;
  tripId: string;
  owner: string;
  category: string;
  title: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  downloadUrl: string;
  storagePath: string;
  notes?: string;
  createdBy: string;
  updatedBy: string;
}

export async function saveTripDocument(input: TripDocumentInput) {
  const ref = sharedTripSubDoc(input.tripId, "documents", input.id);
  const snapshot = await getDoc(ref);
  await setDoc(
    ref,
    sanitizeFirestoreData({
      ...input,
      createdAt: snapshot.exists() ? undefined : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  );
}

export async function deleteTripDocument(tripId: string, documentId: string) {
  await deleteDoc(sharedTripSubDoc(tripId, "documents", documentId));
}

export function parseTripDocumentStoragePath(storagePath: string) {
  const match = /^trips\/([^/]+)\/documents\/([^/]+)\//.exec(storagePath);
  if (!match) return null;
  return {
    tripId: decodeURIComponent(match[1] ?? ""),
    documentId: decodeURIComponent(match[2] ?? ""),
  };
}
