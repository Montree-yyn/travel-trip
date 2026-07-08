import { sampleTrip } from "@/data/sample-trip";
import type { TimelineItem } from "@/types/trip";

const STORAGE_KEY = `travel-trip-map-itinerary-additions:${sampleTrip.id}`;

export interface MapItineraryAddition extends TimelineItem {
  id: string;
  dayNumber: number;
}

function readJson(): MapItineraryAddition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isAddition) : [];
  } catch {
    return [];
  }
}

function isAddition(value: unknown): value is MapItineraryAddition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapItineraryAddition>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.dayNumber === "number" &&
    typeof candidate.time === "string" &&
    typeof candidate.activity === "string"
  );
}

function writeJson(items: MapItineraryAddition[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function readMapItineraryAdditions(dayNumber?: number) {
  const items = readJson();
  return typeof dayNumber === "number" ? items.filter((item) => item.dayNumber === dayNumber) : items;
}

export function saveMapItineraryAddition(input: Omit<MapItineraryAddition, "id">) {
  const items = readJson();
  const id = `map-${input.dayNumber}-${input.time}-${input.activity}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const next = [...items.filter((item) => item.id !== id), { ...input, id }].sort((a, b) =>
    a.dayNumber === b.dayNumber ? a.time.localeCompare(b.time) : a.dayNumber - b.dayNumber,
  );
  writeJson(next);
  window.dispatchEvent(new CustomEvent("travel-trip-map-itinerary-additions"));
  return id;
}
