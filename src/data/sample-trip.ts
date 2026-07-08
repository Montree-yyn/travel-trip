import type { BudgetBreakdown, TransportLeg, TripDay, TripPlan, TripSettings } from "@/types/trip";

import { categorySpending } from "./sample-budget";
import { sampleChecklist } from "./sample-checklist";
import { sampleTransportRoutes } from "./sample-transport";
import itineraryData from "./itinerary.json";
import tripSettingsData from "./trip.json";

const fallbackTripSettings: TripSettings = {
  id: "travel-trip",
  tripName: "Travel Trip",
  subtitle: "Local itinerary",
  startDate: "2026-07-13",
  endDate: "2026-07-18",
  travelers: ["Traveler"],
  documentOwners: ["Traveler"],
  currency: "THB",
  totalBudget: 0,
  destination: "Japan",
  accommodation: "Hotel",
  mainTransport: ["Train"],
  tips: [],
};

function normalizeTripSettings(value: unknown): TripSettings {
  if (!value || typeof value !== "object") return fallbackTripSettings;
  const candidate = value as Partial<TripSettings>;
  return {
    ...fallbackTripSettings,
    ...candidate,
    travelers: Array.isArray(candidate.travelers) ? candidate.travelers : fallbackTripSettings.travelers,
    documentOwners: Array.isArray(candidate.documentOwners) ? candidate.documentOwners : candidate.travelers,
    mainTransport: Array.isArray(candidate.mainTransport) ? candidate.mainTransport : fallbackTripSettings.mainTransport,
    tips: Array.isArray(candidate.tips) ? candidate.tips : fallbackTripSettings.tips,
  };
}

function normalizeItinerary(value: unknown): TripDay[] {
  return Array.isArray(value) ? (value as TripDay[]) : [];
}

export const tripSettings = normalizeTripSettings(tripSettingsData);
export const sampleItinerary = normalizeItinerary(itineraryData);

function calculateTripDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

function createBudgetBreakdown(): BudgetBreakdown {
  const categoryTotal = categorySpending.reduce((sum, category) => sum + category.allocated, 0);

  return {
    currency: tripSettings.currency,
    items: categorySpending.map((category) => ({
      label: category.label,
      minAmount: category.spent,
      maxAmount: category.allocated,
    })),
    totalMin: categoryTotal,
    totalMax: tripSettings.totalBudget,
  };
}

function createTransportLegs(): TransportLeg[] {
  return sampleTransportRoutes.map((route) => ({
    from: route.from,
    to: route.to,
    method: route.line ?? route.method,
    estimatedDuration: route.duration,
  }));
}

const tripDays = calculateTripDays(tripSettings.startDate, tripSettings.endDate);
const fallbackItineraryDay: TripDay = {
  dayNumber: 1,
  date: tripSettings.startDate,
  weekday: "Monday",
  title: "No itinerary data",
  theme: "Please update itinerary.json",
  city: tripSettings.destination,
  timeline: [{ time: "09:00", activity: "Add activities in itinerary.json" }],
  highlights: [],
  food: [],
};

export const sampleTrip: TripPlan = {
  id: tripSettings.id,
  title: tripSettings.tripName,
  subtitle: tripSettings.subtitle,
  companions: tripSettings.travelers,
  days: tripDays,
  nights: Math.max(0, tripDays - 1),
  dateRange: { start: tripSettings.startDate, end: tripSettings.endDate },
  accommodation: tripSettings.accommodation,
  mainTransport: tripSettings.mainTransport,
  itinerary: sampleItinerary.length > 0 ? sampleItinerary : [fallbackItineraryDay],
  transportLegs: createTransportLegs(),
  budget: createBudgetBreakdown(),
  checklist: Array.isArray(sampleChecklist) ? sampleChecklist : [],
  tips: tripSettings.tips,
};
