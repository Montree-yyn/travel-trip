export const ROUTES = {
  home: "/",
  itinerary: "/itinerary",
  map: "/map",
  food: "/food",
  flights: "/flights",
  hotel: "/hotel",
  places: "/places",
  transport: "/transport",
  budget: "/budget",
  checklist: "/checklist",
  weather: "/weather",
  currency: "/currency",
  memories: "/memories",
  search: "/search",
  favorites: "/favorites",
  translator: "/translator",
  more: "/more",
} as const;

export type RouteKey = keyof typeof ROUTES;
