import { sampleTrip } from "@/data/sample-trip";

export const TRIP_ID = sampleTrip.id;

export const SYNC_STORAGE_KEYS = {
  theme: "travel-trip-theme",
  locale: "travel-trip-locale",
  placeFavorites: `travel-trip-place-favorites:${TRIP_ID}`,
  restaurantFavorites: `travel-trip-restaurant-favorites:${TRIP_ID}`,
  visited: `travel-trip-visited:${TRIP_ID}`,
  checklist: `travel-trip-checklist:${TRIP_ID}`,
  memories: `travel-trip-journal:${TRIP_ID}`,
  budget: `travel-trip-budget:${TRIP_ID}`,
  translator: `travel-trip-translator:${TRIP_ID}`,
} as const;
