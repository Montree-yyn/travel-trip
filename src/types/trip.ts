/**
 * Domain types for a trip plan.
 *
 * These model the shape of the sample Osaka/Kyoto/Ine/Kobe itinerary
 * (see `src/data/sample-trip.ts`) so pages can be built against a stable
 * contract later. No business logic consumes these yet — this phase only
 * establishes the data shape.
 */

export type Weekday =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface TimelineItem {
  /** 24h time, e.g. "09:30". */
  time: string;
  activity: string;
  location?: string;
  notes?: string;
  category?: string;
  duration?: string;
  travelTime?: string;
}

export interface EditableTimelineItem extends TimelineItem {
  id: string;
}

export interface Highlight {
  name: string;
  imageUrl?: string;
}

export interface FoodRecommendation {
  name: string;
  category: "restaurant" | "cafe" | "dessert" | "street-food";
}

export interface TripDay {
  dayNumber: number;
  date: string;
  weekday: Weekday;
  title: string;
  theme: string;
  city: string;
  timeline: TimelineItem[];
  highlights: Highlight[];
  food: FoodRecommendation[];
  tips?: string[];
}

export interface BudgetLineItem {
  label: string;
  minAmount: number;
  maxAmount: number;
}

export interface BudgetBreakdown {
  currency: string;
  items: BudgetLineItem[];
  totalMin: number;
  totalMax: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: "documents" | "packing" | "electronics" | "money" | "health";
}

export interface TransportLeg {
  from: string;
  to: string;
  method: string;
  estimatedDuration?: string;
}

export interface TripSettings {
  id: string;
  tripName: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  currency: string;
  totalBudget: number;
  destination: string;
  accommodation: string;
  mainTransport: string[];
  tips: string[];
}

export interface TripPlan {
  id: string;
  title: string;
  subtitle: string;
  companions: string[];
  days: number;
  nights: number;
  dateRange: {
    start: string;
    end: string;
  };
  accommodation: string;
  mainTransport: string[];
  itinerary: TripDay[];
  transportLegs: TransportLeg[];
  budget: BudgetBreakdown;
  checklist: ChecklistItem[];
  tips: string[];
}
