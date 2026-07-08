import { useCallback, useMemo, useState } from "react";

import { readDocumentsFromStorage, writeDocumentsToStorage } from "@/lib/documents";
import type { DocumentCategoryId, TravelDocument } from "@/types/document";

export function usePersistentDocuments() {
  const [documents, setDocuments] = useState(() => readDocumentsFromStorage());
  const [error, setError] = useState("");

  const persist = useCallback((nextDocuments: TravelDocument[]) => {
    try {
      writeDocumentsToStorage(nextDocuments);
      setDocuments(nextDocuments);
      setError("");
      return true;
    } catch {
      setError("Could not save document changes. Please try again.");
      return false;
    }
  }, []);

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
    (document: TravelDocument) => persist([...documents, document]),
    [documents, persist],
  );

  const updateDocument = useCallback(
    (documentId: string, input: TravelDocument) =>
      persist(documents.map((document) => (document.id === documentId ? input : document))),
    [documents, persist],
  );

  const deleteDocument = useCallback(
    (documentId: string) => persist(documents.filter((document) => document.id !== documentId)),
    [documents, persist],
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
