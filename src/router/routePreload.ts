import { ROUTES } from "./paths";

export const pageImporters = {
  [ROUTES.home]: () => import("@/pages/Home/HomePage"),
  [ROUTES.travelWallet]: () => import("@/pages/TravelWallet/TravelWalletPage"),
  [ROUTES.explore]: () => import("@/pages/Explore/ExplorePage"),
  [ROUTES.itinerary]: () => import("@/pages/Itinerary/ItineraryPage"),
  [ROUTES.map]: () => import("@/pages/Map/MapPage"),
  [ROUTES.food]: () => import("@/pages/Food/FoodPage"),
  [ROUTES.flights]: () => import("@/pages/Flights/FlightsPage"),
  [ROUTES.hotel]: () => import("@/pages/Hotel/HotelPage"),
  [ROUTES.places]: () => import("@/pages/Places/PlacesPage"),
  [ROUTES.transport]: () => import("@/pages/Transport/TransportPage"),
  [ROUTES.budget]: () => import("@/pages/Budget/BudgetPage"),
  [ROUTES.checklist]: () => import("@/pages/Checklist/ChecklistPage"),
  [ROUTES.weather]: () => import("@/pages/Weather/WeatherPage"),
  [ROUTES.currency]: () => import("@/pages/Currency/CurrencyPage"),
  [ROUTES.memories]: () => import("@/pages/Memories/MemoriesPage"),
  [ROUTES.search]: () => import("@/pages/Search/SearchPage"),
  [ROUTES.favorites]: () => import("@/pages/Favorites/FavoritesPage"),
  [ROUTES.more]: () => import("@/pages/More/MorePage"),
  [ROUTES.translator]: () => import("@/pages/Translator/TranslatorPage"),
  [ROUTES.documents]: () => import("@/pages/Documents/DocumentCategoryPage"),
  [ROUTES.legacyDocuments]: () => import("@/pages/Documents/DocumentCategoryPage"),
} as const;

export function preloadRoute(route: string) {
  pageImporters[route as keyof typeof pageImporters]?.();
}
