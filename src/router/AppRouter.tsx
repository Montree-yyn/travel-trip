import { Suspense, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { GenericPageSkeleton } from "@/components/ui/GenericPageSkeleton";
import { AppShell } from "@/components/layout/AppShell";

import {
  BudgetPage,
  ChecklistPage,
  CurrencyPage,
  DocumentCategoryPage,
  ExplorePage,
  FavoritesPage,
  FlightsPage,
  FoodPage,
  HomePage,
  HotelPage,
  ItineraryPage,
  MapPage,
  MemoriesPage,
  MorePage,
  PlacesPage,
  SearchPage,
  TransportPage,
  TranslatorPage,
  TravelWalletPage,
  WeatherPage,
} from "./lazyPages";
import { ROUTES } from "./paths";
import { RouteErrorFallback } from "./RouteErrorFallback";

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<GenericPageSkeleton />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: ROUTES.home, element: <LazyRoute><HomePage /></LazyRoute> },
      { path: ROUTES.travelWallet, element: <LazyRoute><TravelWalletPage /></LazyRoute> },
      { path: ROUTES.explore, element: <LazyRoute><ExplorePage /></LazyRoute> },
      { path: ROUTES.itinerary, element: <LazyRoute><ItineraryPage /></LazyRoute> },
      { path: ROUTES.map, element: <LazyRoute><MapPage /></LazyRoute> },
      { path: ROUTES.food, element: <LazyRoute><FoodPage /></LazyRoute> },
      { path: ROUTES.flights, element: <LazyRoute><FlightsPage /></LazyRoute> },
      { path: ROUTES.hotel, element: <LazyRoute><HotelPage /></LazyRoute> },
      { path: ROUTES.places, element: <LazyRoute><PlacesPage /></LazyRoute> },
      { path: ROUTES.transport, element: <LazyRoute><TransportPage /></LazyRoute> },
      { path: ROUTES.budget, element: <LazyRoute><BudgetPage /></LazyRoute> },
      { path: ROUTES.checklist, element: <LazyRoute><ChecklistPage /></LazyRoute> },
      { path: ROUTES.weather, element: <LazyRoute><WeatherPage /></LazyRoute> },
      { path: ROUTES.currency, element: <LazyRoute><CurrencyPage /></LazyRoute> },
      { path: ROUTES.memories, element: <LazyRoute><MemoriesPage /></LazyRoute> },
      { path: ROUTES.search, element: <LazyRoute><SearchPage /></LazyRoute> },
      { path: ROUTES.favorites, element: <LazyRoute><FavoritesPage /></LazyRoute> },
      { path: ROUTES.translator, element: <LazyRoute><TranslatorPage /></LazyRoute> },
      { path: ROUTES.more, element: <LazyRoute><MorePage /></LazyRoute> },
      { path: ROUTES.documents, element: <LazyRoute><DocumentCategoryPage /></LazyRoute> },
      { path: ROUTES.legacyDocuments, element: <LazyRoute><DocumentCategoryPage /></LazyRoute> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
