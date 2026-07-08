import type { TimelineItem, TripDay, TripPlan } from "@/types/trip";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseTripDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / DAY_MS);
}

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function getCurrentTripDay(trip: TripPlan, now = new Date()): TripDay {
  const firstDay = trip.itinerary[0]!;
  const lastDay = trip.itinerary[trip.itinerary.length - 1] ?? firstDay;
  const startDate = parseTripDate(trip.dateRange.start);
  const daysFromStart = daysBetween(startDate, now);
  const clampedDayNumber = Math.min(Math.max(daysFromStart + 1, 1), trip.days);

  return trip.itinerary.find((day) => day.dayNumber === clampedDayNumber) ?? lastDay;
}

export function getNextActivity(day: TripDay, now = new Date()): TimelineItem {
  const fallback = day.timeline[0]!;
  const todayKey = toLocalDateKey(now);

  if (day.date !== todayKey) return fallback;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return day.timeline.find((item) => minutesFromTime(item.time) >= nowMinutes) ?? day.timeline[day.timeline.length - 1] ?? fallback;
}

export function getTripProgressPercent(currentDay: number, totalDays: number) {
  if (totalDays <= 0) return 0;
  return Math.round((currentDay / totalDays) * 100);
}

export function getDaysUntilStart(trip: TripPlan, now = new Date()) {
  return Math.max(0, daysBetween(now, parseTripDate(trip.dateRange.start)));
}

export function getRemainingTripDays(trip: TripPlan, now = new Date()) {
  const startDate = parseTripDate(trip.dateRange.start);
  if (daysBetween(now, startDate) > 0) return trip.days;

  const endDate = parseTripDate(trip.dateRange.end);
  return Math.max(0, daysBetween(now, endDate) + 1);
}
