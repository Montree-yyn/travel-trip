import { lazy } from "react";

import { ROUTES } from "./paths";
import { pageImporters } from "./routePreload";

export const HomePage = lazy(pageImporters[ROUTES.home]);
export const TravelWalletPage = lazy(pageImporters[ROUTES.travelWallet]);
export const ExplorePage = lazy(pageImporters[ROUTES.explore]);
export const ItineraryPage = lazy(pageImporters[ROUTES.itinerary]);
export const MapPage = lazy(pageImporters[ROUTES.map]);
export const FoodPage = lazy(pageImporters[ROUTES.food]);
export const FlightsPage = lazy(pageImporters[ROUTES.flights]);
export const HotelPage = lazy(pageImporters[ROUTES.hotel]);
export const PlacesPage = lazy(pageImporters[ROUTES.places]);
export const TransportPage = lazy(pageImporters[ROUTES.transport]);
export const BudgetPage = lazy(pageImporters[ROUTES.budget]);
export const ChecklistPage = lazy(pageImporters[ROUTES.checklist]);
export const WeatherPage = lazy(pageImporters[ROUTES.weather]);
export const CurrencyPage = lazy(pageImporters[ROUTES.currency]);
export const MemoriesPage = lazy(pageImporters[ROUTES.memories]);
export const SearchPage = lazy(pageImporters[ROUTES.search]);
export const FavoritesPage = lazy(pageImporters[ROUTES.favorites]);
export const MorePage = lazy(pageImporters[ROUTES.more]);
export const TranslatorPage = lazy(pageImporters[ROUTES.translator]);
export const DocumentCategoryPage = lazy(pageImporters[ROUTES.documents]);
