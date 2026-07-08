import { buildJournalEntries } from "@/data/sample-memories";
import { sampleTrip } from "@/data/sample-trip";
import type { LegacyMemoriesDoc, MemoriesData, MemoryEntry, MemoryPhoto } from "@/types/memory";

export function createMemoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMemoryPhotoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSeedMemories(): MemoryEntry[] {
  return buildJournalEntries(sampleTrip);
}

function normalizePhoto(value: unknown): MemoryPhoto | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MemoryPhoto>;
  if (typeof candidate.id !== "string") return null;

  const downloadUrl = typeof candidate.downloadUrl === "string" ? candidate.downloadUrl.trim() : "";
  const photoSeed = typeof candidate.photoSeed === "string" ? candidate.photoSeed.trim() : "";

  if (!downloadUrl && !photoSeed) {
    return { id: candidate.id };
  }

  const normalized: MemoryPhoto = { id: candidate.id };
  if (photoSeed) normalized.photoSeed = photoSeed;
  if (downloadUrl) normalized.downloadUrl = downloadUrl;

  const storagePath = typeof candidate.storagePath === "string" ? candidate.storagePath.trim() : "";
  const caption = typeof candidate.caption === "string" ? candidate.caption.trim() : "";
  if (storagePath) normalized.storagePath = storagePath;
  if (caption) normalized.caption = caption;

  const thumbnailUrl = typeof candidate.thumbnailUrl === "string" ? candidate.thumbnailUrl.trim() : "";
  const thumbnailPath = typeof candidate.thumbnailPath === "string" ? candidate.thumbnailPath.trim() : "";
  if (thumbnailUrl) normalized.thumbnailUrl = thumbnailUrl;
  if (thumbnailPath) normalized.thumbnailPath = thumbnailPath;

  return normalized;
}

function placeholderPhotos(entry: Pick<MemoryEntry, "id" | "location" | "title">): MemoryPhoto[] {
  return [
    {
      id: createMemoryPhotoId(),
      photoSeed: entry.location?.trim() || entry.title.trim() || entry.id,
    },
  ];
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeEntry(value: unknown): MemoryEntry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MemoryEntry>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.day !== "number" ||
    typeof candidate.date !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.note !== "string"
  ) {
    return null;
  }

  const photos = Array.isArray(candidate.photos)
    ? candidate.photos.map(normalizePhoto).filter((photo): photo is MemoryPhoto => photo !== null)
    : [];

  const entry: MemoryEntry = {
    id: candidate.id,
    day: candidate.day,
    date: candidate.date,
    title: candidate.title.trim(),
    note: candidate.note,
    tags: normalizeTags(candidate.tags),
    photos,
  };

  const location = typeof candidate.location === "string" ? candidate.location.trim() : "";
  if (location) entry.location = location;

  if (photos.length === 0 && !Array.isArray(candidate.photos)) {
    entry.photos = placeholderPhotos(candidate as MemoryEntry);
  }

  return entry;
}

function isLegacyMemoriesDoc(value: unknown): value is LegacyMemoriesDoc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if ("entries" in value) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

function migrateLegacyMemories(legacy: LegacyMemoriesDoc, seedEntries: MemoryEntry[]): MemoriesData {
  return {
    entries: seedEntries.map((entry) => ({
      ...entry,
      note: legacy[entry.id] ?? entry.note,
    })),
  };
}

export function normalizeMemoriesData(
  value: unknown,
  seedEntries: MemoryEntry[] = buildSeedMemories(),
): MemoriesData {
  if (!value || typeof value !== "object") {
    return { entries: seedEntries.map((entry) => ({ ...entry, tags: [...entry.tags] })) };
  }

  if (isLegacyMemoriesDoc(value)) {
    return migrateLegacyMemories(value, seedEntries);
  }

  const candidate = value as MemoriesData;
  if (Array.isArray(candidate.entries)) {
    return {
      entries: candidate.entries
        .map(normalizeEntry)
        .filter((entry): entry is MemoryEntry => entry !== null),
    };
  }

  return { entries: seedEntries.map((entry) => ({ ...entry, tags: [...entry.tags] })) };
}

export function groupMemoriesByDay(entries: MemoryEntry[]) {
  const groups = new Map<number, MemoryEntry[]>();

  for (const entry of entries) {
    const dayEntries = groups.get(entry.day) ?? [];
    dayEntries.push(entry);
    groups.set(entry.day, dayEntries);
  }

  return [...groups.entries()]
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([day, dayEntries]) => ({
      day,
      date: dayEntries[0]?.date ?? "",
      entries: [...dayEntries].sort((left, right) => left.title.localeCompare(right.title)),
    }));
}

export function parseTagsInput(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagsInput(tags: string[]) {
  return tags.join(", ");
}

export function createPlaceholderPhotos(input: Pick<MemoryEntry, "location" | "title">) {
  return placeholderPhotos({ id: "placeholder", ...input });
}
