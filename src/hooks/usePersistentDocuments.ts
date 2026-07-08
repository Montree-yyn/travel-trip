import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  deleteDocumentFromFirestore,
  hydrateDocumentsFromFirestore,
  prepareDocumentForSave,
  readDocumentsFromStorage,
  saveDocumentToFirestore,
  uploadDocumentFileToStorage,
  writeDocumentsToStorage,
} from "@/lib/documents";
import type { DocumentCategoryId, TravelDocument } from "@/types/document";

export function usePersistentDocuments() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [documents, setDocuments] = useState(() => readDocumentsFromStorage());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) return;

    let cancelled = false;
    void hydrateDocumentsFromFirestore(uid, readDocumentsFromStorage())
      .then((nextDocuments) => {
        if (!cancelled) setDocuments(nextDocuments);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load document changes. Local documents are still available.");
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const persist = useCallback((nextDocuments: TravelDocument[]) => {
    try {
      writeDocumentsToStorage(nextDocuments);
      setError("");
    } catch {
      setError("Could not save document changes locally. Cloud sync will keep trying when available.");
    }
    setDocuments(nextDocuments);
    return true;
  }, []);

  const saveDocument = useCallback(
    (input: TravelDocument, previousDocumentId = input.id) => {
      const previousDocument = documents.find((item) => item.id === previousDocumentId);
      const document = prepareDocumentForSave(input, documents);
      const nextDocuments = documents.some((item) => item.id === previousDocumentId)
        ? documents.map((item) => (item.id === previousDocumentId ? document : item))
        : [...documents, document];

      if (!persist(nextDocuments)) return false;

      if (uid && isFirebaseConfigured() && navigator.onLine) {
        void uploadDocumentFileToStorage(uid, document)
          .then((uploadedDocument) => {
            const syncedDocuments = nextDocuments.map((item) => (item.id === document.id ? uploadedDocument : item));
            persist(syncedDocuments);
            return saveDocumentToFirestore(uid, uploadedDocument);
          })
          .then(() => {
            if (previousDocument && previousDocument.id !== document.id) {
              return deleteDocumentFromFirestore(uid, previousDocument);
            }
            return undefined;
          })
          .catch(() => {
            setError("Could not save document changes. Please try again.");
          });
      }

      return true;
    },
    [documents, persist, uid],
  );

  const countsByCategory = useMemo(
    () =>
      documents.reduce<Record<DocumentCategoryId, number>>(
        (counts, document) => {
          counts[document.category] += 1;
          return counts;
        },
        {
          "travel-insurance": 0,
          "usj-tickets": 0,
          "visit-japan-web": 0,
          "passport-visa": 0,
          "other-documents": 0,
        },
      ),
    [documents],
  );

  const addDocument = useCallback(
    (document: TravelDocument) => saveDocument(document),
    [saveDocument],
  );

  const updateDocument = useCallback(
    (documentId: string, input: TravelDocument) => saveDocument(input, documentId),
    [saveDocument],
  );

  const deleteDocument = useCallback(
    (documentId: string) => {
      const document = documents.find((item) => item.id === documentId);
      if (!persist(documents.filter((item) => item.id !== documentId))) return false;

      if (uid && document && isFirebaseConfigured() && navigator.onLine) {
        void deleteDocumentFromFirestore(uid, document).catch(() => {
          setError("Could not delete this document.");
        });
      }

      return true;
    },
    [documents, persist, uid],
  );

  return {
    documents,
    countsByCategory,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  };
}
