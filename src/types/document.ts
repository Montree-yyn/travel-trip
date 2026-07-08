export type DocumentCategoryId =
  | "travel-insurance"
  | "usj-tickets"
  | "visit-japan-web"
  | "passport-visa"
  | "other-documents";

export interface TravelDocumentFile {
  fileName: string;
  fileType: string;
  dataUrl: string;
  updatedAt: string;
}

export interface TravelDocument {
  id: string;
  owner: string;
  title: string;
  category: DocumentCategoryId;
  notes?: string;
  file?: TravelDocumentFile;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategory {
  id: DocumentCategoryId;
  title: string;
  description: string;
}
