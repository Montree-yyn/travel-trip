import { sampleTrip } from "@/data/sample-trip";
import type { EditableTimelineItem, TimelineItem, TripDay } from "@/types/trip";

import { readMapItineraryAdditions } from "./mapItineraryAdditions";

const STORAGE_KEY = `travel-trip-itinerary-planner:${sampleTrip.id}:v1`;

export interface EditableTripDay extends Omit<TripDay, "timeline"> {
  timeline: EditableTimelineItem[];
}

function createActivityId(dayNumber: number, item: TimelineItem, index: number) {
  const seed = `${dayNumber}-${item.time}-${item.activity}-${index}`;
  return seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `activity-${dayNumber}-${index}`;
}

function createNewActivityId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeActivity(value: unknown, dayNumber: number, index: number): EditableTimelineItem | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<EditableTimelineItem>;
  if (typeof candidate.time !== "string" || typeof candidate.activity !== "string") return null;

  const item: EditableTimelineItem = {
    ...candidate,
    id: typeof candidate.id === "string" && candidate.id
      ? candidate.id
      : createActivityId(dayNumber, { time: candidate.time, activity: candidate.activity }, index),
    time: candidate.time,
    activity: candidate.activity,
  };

  if (typeof candidate.location === "string" && candidate.location.trim()) item.location = candidate.location;
  if (typeof candidate.notes === "string" && candidate.notes.trim()) item.notes = candidate.notes;
  if (typeof candidate.category === "string" && candidate.category.trim()) item.category = candidate.category;
  if (typeof candidate.duration === "string" && candidate.duration.trim()) item.duration = candidate.duration;
  if (typeof candidate.travelTime === "string" && candidate.travelTime.trim()) item.travelTime = candidate.travelTime;

  return item;
}

function normalizeDay(value: unknown): EditableTripDay | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<EditableTripDay>;
  if (typeof candidate.dayNumber !== "number" || typeof candidate.date !== "string" || typeof candidate.city !== "string") {
    return null;
  }

  return {
    dayNumber: candidate.dayNumber,
    date: candidate.date,
    weekday: candidate.weekday ?? "Monday",
    title: candidate.title ?? `Day ${candidate.dayNumber}`,
    theme: candidate.theme ?? candidate.city,
    city: candidate.city,
    highlights: Array.isArray(candidate.highlights) ? candidate.highlights : [],
    food: Array.isArray(candidate.food) ? candidate.food : [],
    tips: Array.isArray(candidate.tips) ? candidate.tips : undefined,
    timeline: Array.isArray(candidate.timeline)
      ? candidate.timeline
          .map((item, index) => normalizeActivity(item, candidate.dayNumber!, index))
          .filter((item): item is EditableTimelineItem => item !== null)
      : [],
  };
}

function seedDaysFromTrip(days: TripDay[]): EditableTripDay[] {
  return days.map((day) => {
    const mapAdditions = readMapItineraryAdditions(day.dayNumber);
    const timeline = [...day.timeline, ...mapAdditions].map((item, index) => ({
      ...item,
      id: "id" in item && typeof item.id === "string" ? item.id : createActivityId(day.dayNumber, item, index),
    }));

    return {
      ...day,
      timeline,
    };
  });
}

export function readItineraryPlannerDays(fallbackDays: TripDay[] = sampleTrip.itinerary): EditableTripDay[] {
  if (typeof window === "undefined") return seedDaysFromTrip(fallbackDays);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDaysFromTrip(fallbackDays);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedDaysFromTrip(fallbackDays);

    const days = parsed.map(normalizeDay).filter((day): day is EditableTripDay => day !== null);
    return days.length > 0 ? days : seedDaysFromTrip(fallbackDays);
  } catch {
    return seedDaysFromTrip(fallbackDays);
  }
}

export function createBlankActivity(): EditableTimelineItem {
  return {
    id: createNewActivityId(),
    time: "10:00",
    activity: "",
    location: "",
    category: "Activity",
    duration: "60 min",
    notes: "",
    travelTime: "",
  };
}
