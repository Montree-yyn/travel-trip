import { TRIP_ID } from "@/sync/keys";
import type { MemoryPhotoCacheEntry } from "@/types/memory";

const cacheKey = `travel-trip-memory-photo-cache:${TRIP_ID}`;

function readCacheMap(): Record<string, MemoryPhotoCacheEntry> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MemoryPhotoCacheEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCacheMap(map: Record<string, MemoryPhotoCacheEntry>) {
  window.localStorage.setItem(cacheKey, JSON.stringify(map));
}

export function readMemoryPhotoCache(): Record<string, MemoryPhotoCacheEntry> {
  return readCacheMap();
}

export function readMemoryPhotoCacheEntry(photoId: string) {
  return readCacheMap()[photoId] ?? null;
}

export function writeMemoryPhotoCacheEntry(entry: MemoryPhotoCacheEntry) {
  const map = readCacheMap();
  map[entry.photoId] = entry;
  writeCacheMap(map);
}

export function removeMemoryPhotoCacheEntry(photoId: string) {
  const map = readCacheMap();
  delete map[photoId];
  writeCacheMap(map);
}

export function listPendingPhotoUploads() {
  return Object.values(readCacheMap()).filter((entry) => entry.pendingUpload);
}
