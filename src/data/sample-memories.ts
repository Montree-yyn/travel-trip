import type { MemoryEntry } from "@/types/memory";
import type { TripPlan } from "@/types/trip";

import memoriesData from "./memories.json";

export const sampleMemories = (Array.isArray(memoriesData) ? memoriesData : []).map((entry) => ({
  ...entry,
  tags: Array.isArray((entry as MemoryEntry).tags) ? (entry as MemoryEntry).tags : [],
})) as MemoryEntry[];

export function buildJournalEntries(trip: TripPlan, memories: MemoryEntry[] = sampleMemories): MemoryEntry[] {
  return trip.itinerary.map((day) => {
    const existing = memories.find((entry) => entry.day === day.dayNumber);

    if (existing) return existing;

    return {
      id: `mem-day-${day.dayNumber}`,
      day: day.dayNumber,
      date: day.date,
      title: day.title,
      note: "",
      location: day.city,
      tags: [],
      photos: [{ id: `photo-day-${day.dayNumber}`, photoSeed: `${day.city}-${day.dayNumber}` }],
    };
  });
}
