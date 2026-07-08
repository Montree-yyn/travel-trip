import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseApp, getFirebaseAuth } from "./config";

let firestore: Firestore | undefined;

export function getFirebaseFirestore() {
  if (!firestore) {
    // Ensure Auth is registered on the app before Firestore so requests carry the ID token.
    getFirebaseAuth();
    firestore = getFirestore(getFirebaseApp());
  }

  return firestore;
}
