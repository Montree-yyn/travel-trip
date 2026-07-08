import type { Place } from "@/types/place";

import placesData from "./places.json";

function normalizePlaces(value: unknown): Place[] {
  return Array.isArray(value) ? (value as Place[]) : [];
}

export const samplePlaces = normalizePlaces(placesData);
