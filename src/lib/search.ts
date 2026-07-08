import { flightSegments } from "@/data/flights";
import { hotelData } from "@/data/hotel";
import { samplePlaces } from "@/data/sample-places";
import { sampleRestaurants } from "@/data/sample-restaurants";
import { sampleTransportRoutes, sampleTransportStations } from "@/data/sample-transport";
import { sampleTrip } from "@/data/sample-trip";
import { ROUTES } from "@/router/paths";

export type SearchCategory =
  | "itinerary"
  | "places"
  | "restaurants"
  | "hotel"
  | "flights"
  | "transport";

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  route: string;
  keywords: string[];
}

export const SEARCH_CATEGORY_KEYS: Record<SearchCategory, string> = {
  itinerary: "searchCategories.itinerary",
  places: "searchCategories.places",
  restaurants: "searchCategories.restaurants",
  hotel: "searchCategories.hotel",
  flights: "searchCategories.flights",
  transport: "searchCategories.transport",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(result: SearchResult, query: string) {
  const normalized = normalize(query);
  if (!normalized) return true;

  const haystack = [result.title, result.subtitle ?? "", ...result.keywords].join(" ").toLowerCase();
  return normalized.split(/\s+/).every((term) => haystack.includes(term));
}

export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const day of sampleTrip.itinerary) {
    for (const item of day.timeline) {
      results.push({
        id: `itinerary-${day.dayNumber}-${item.time}-${item.activity}`,
        category: "itinerary",
        title: item.activity,
        subtitle: `Day ${day.dayNumber} · ${item.time}${item.location ? ` · ${item.location}` : ""}`,
        route: ROUTES.itinerary,
        keywords: [day.city, day.title, day.theme, item.notes ?? "", item.location ?? ""],
      });
    }
  }

  for (const place of samplePlaces) {
    results.push({
      id: `place-${place.id}`,
      category: "places",
      title: place.name,
      subtitle: `${place.city} · ${place.category}`,
      route: ROUTES.places,
      keywords: [place.description, place.address, place.category],
    });
  }

  for (const restaurant of sampleRestaurants) {
    results.push({
      id: `restaurant-${restaurant.id}`,
      category: "restaurants",
      title: restaurant.name,
      subtitle: `${restaurant.city} · ${restaurant.cuisine}`,
      route: ROUTES.food,
      keywords: [restaurant.category, ...restaurant.tags],
    });
  }

  results.push({
    id: "hotel-main",
    category: "hotel",
    title: hotelData.name,
    subtitle: hotelData.address,
    route: ROUTES.hotel,
    keywords: [hotelData.roomType, hotelData.confirmationNo, ...hotelData.amenities],
  });

  for (const flight of flightSegments) {
    results.push({
      id: `flight-${flight.id}`,
      category: "flights",
      title: `${flight.label}: ${flight.flightNumber}`,
      subtitle: `${flight.departure.airportCode} → ${flight.arrival.airportCode} · ${flight.departure.date}`,
      route: ROUTES.flights,
      keywords: [
        flight.airline,
        flight.departure.airport,
        flight.arrival.airport,
        flight.departure.city,
        flight.arrival.city,
      ],
    });
  }

  for (const route of sampleTransportRoutes) {
    results.push({
      id: `transport-route-${route.id}`,
      category: "transport",
      title: `${route.from} → ${route.to}`,
      subtitle: `${route.method}${route.line ? ` · ${route.line}` : ""} · ${route.duration}`,
      route: ROUTES.transport,
      keywords: [route.line ?? "", route.cost ?? "", route.departureTime ?? ""],
    });
  }

  for (const station of sampleTransportStations) {
    results.push({
      id: `transport-station-${station.id}`,
      category: "transport",
      title: station.name,
      subtitle: `${station.city} · ${station.lines.join(", ")}`,
      route: ROUTES.transport,
      keywords: station.lines,
    });
  }

  return results;
}

export function searchAll(query: string, index: SearchResult[] = buildSearchIndex()) {
  return index.filter((result) => matchesQuery(result, query));
}
