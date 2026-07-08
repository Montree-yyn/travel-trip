export interface MemoryPhoto {
  id: string;
  photoSeed?: string;
  downloadUrl?: string;
  storagePath?: string;
  // Optional compressed thumbnail used in grids/lists. Older photos without
  // these fall back to downloadUrl/storagePath for both display and deletion.
  thumbnailUrl?: string;
  thumbnailPath?: string;
  caption?: string;
}

export type MemoryPhotoUploadStatus = "pending" | "uploading" | "done" | "failed";

export interface MemoryEntry {
  id: string;
  day: number;
  date: string;
  title: string;
  note: string;
  location?: string;
  tags: string[];
  photos: MemoryPhoto[];
}

export interface MemoriesData {
  entries: MemoryEntry[];
}

/** @deprecated Legacy Firestore/localStorage shape — migrated on read. */
export type LegacyMemoriesDoc = Record<string, string>;

export interface MemoryPhotoCacheEntry {
  photoId: string;
  entryId: string;
  dataUrl: string;
  pendingUpload: boolean;
}

export interface MemoryPhotoUploadState {
  photoId: string;
  status: MemoryPhotoUploadStatus;
  progress: number;
  error?: string;
}
