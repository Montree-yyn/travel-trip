import type { EditableTimelineItem, TimelineItem } from "@/types/trip";

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return 0;
  return parsedHours * 60 + parsedMinutes;
}

function parseMinutes(value?: string, fallback = 0) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  const minuteMatch = normalized.match(/(\d+)\s*(m|min|mins|minute|minutes)/);
  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) * 60 : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.max(0, Math.round(hours + minutes));
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : fallback;
}

function formatClock(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

export function getActivityId(dayNumber: number, item: TimelineItem) {
  return "id" in item && typeof item.id === "string" ? item.id : `${dayNumber}:${item.time}:${item.activity}`;
}

export function getTravelTimeLabel(items: TimelineItem[], index: number) {
  if (index <= 0) return null;
  const previous = items[index - 1];
  const current = items[index];
  if (!previous || !current) return null;

  const diff = minutesFromTime(current.time) - minutesFromTime(previous.time);
  if (diff <= 0 || diff > 240) return null;
  return `${diff} min`;
}

export interface SmartTimelineItem {
  item: EditableTimelineItem;
  startMinutes: number;
  durationMinutes: number;
  travelMinutes: number;
  endMinutes: number;
  leaveMinutes: number;
  arrivalMinutes: number;
  startTime: string;
  durationLabel: string;
  travelLabel: string;
  endTime: string;
  leaveTime: string;
  arrivalTime: string;
  gapAfterMinutes: number | null;
  gapAfterLabel: string | null;
  conflict: boolean;
}

export function buildSmartTimeline(items: EditableTimelineItem[]): SmartTimelineItem[] {
  const computed = items.map((item) => {
    const startMinutes = minutesFromTime(item.time);
    const durationMinutes = parseMinutes(item.duration, 60);
    const travelMinutes = parseMinutes(item.travelTime, 0);
    const endMinutes = startMinutes + durationMinutes;
    const leaveMinutes = endMinutes + travelMinutes;

    return {
      item,
      startMinutes,
      durationMinutes,
      travelMinutes,
      endMinutes,
      leaveMinutes,
      arrivalMinutes: leaveMinutes,
      startTime: formatClock(startMinutes),
      durationLabel: formatDuration(durationMinutes),
      travelLabel: formatDuration(travelMinutes),
      endTime: formatClock(endMinutes),
      leaveTime: formatClock(leaveMinutes),
      arrivalTime: formatClock(leaveMinutes),
      gapAfterMinutes: null,
      gapAfterLabel: null,
      conflict: false,
    } satisfies SmartTimelineItem;
  });

  return computed.map((entry, index) => {
    const next = computed[index + 1];
    if (!next) return entry;

    const gapAfterMinutes = next.startMinutes - entry.arrivalMinutes;
    const conflict = gapAfterMinutes < 0;

    return {
      ...entry,
      conflict,
      gapAfterMinutes: conflict ? null : gapAfterMinutes,
      gapAfterLabel: conflict ? null : formatDuration(gapAfterMinutes),
    };
  }).map((entry, index, entries) => {
    const previous = entries[index - 1];
    return {
      ...entry,
      conflict: entry.conflict || Boolean(previous?.conflict && previous.arrivalMinutes > entry.startMinutes),
    };
  });
}

type CategoryKey =
  | "explore.hotel"
  | "transport.title"
  | "food.title"
  | "filters.food.street-food"
  | "filters.map.attractions";

export function inferCategoryKey(activity: string, notes?: string, category?: string): CategoryKey {
  const text = `${activity} ${notes ?? ""} ${category ?? ""}`.toLowerCase();
  if (/hotel|check.?in|check.?out|luggage|rest at hotel/.test(text)) return "explore.hotel";
  if (/airport|flight|express|train|depart|travel to|back to hotel/.test(text)) return "transport.title";
  if (/food|restaurant|cafe|coffee|tea|noodle|sushi|matcha|arabica|enjoy usj/.test(text)) return "food.title";
  if (/shop|market|street|mall|donki|don quijote/.test(text)) return "filters.food.street-food";
  return "filters.map.attractions";
}
