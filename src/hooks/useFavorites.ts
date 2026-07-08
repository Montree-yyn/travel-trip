import { useCallback, useEffect, useRef, useState } from "react";

import { readFavoritesFromStorage, writeFavoritesToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type { TripFavoritesDoc } from "@/sync/types";

function readFavoriteSets(defaultRestaurantIds: string[] = []) {
  const stored = readFavoritesFromStorage();
  return {
    places: new Set(stored.places),
    restaurants: new Set(
      stored.restaurants.length > 0 ? stored.restaurants : defaultRestaurantIds,
    ),
  };
}

export function useFavorites(defaultRestaurantIds: string[] = []) {
  const { ready, syncVersion, saveFavorites } = useTripSync();
  const [{ places, restaurants }, setFavoriteSets] = useState(() =>
    readFavoriteSets(defaultRestaurantIds),
  );
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!ready) return;
    skipNextSave.current = true;
    setFavoriteSets(readFavoriteSets(defaultRestaurantIds));
  }, [defaultRestaurantIds, ready, syncVersion]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const doc: TripFavoritesDoc = {
      places: [...places],
      restaurants: [...restaurants],
    };
    writeFavoritesToStorage(doc);
    void saveFavorites(doc);
  }, [places, restaurants, ready, saveFavorites]);

  const addPlaceFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => ({
      ...current,
      places: new Set(current.places).add(id),
    }));
  }, []);

  const removePlaceFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => {
      const nextPlaces = new Set(current.places);
      nextPlaces.delete(id);
      return { ...current, places: nextPlaces };
    });
  }, []);

  const togglePlaceFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => {
      const nextPlaces = new Set(current.places);
      if (nextPlaces.has(id)) nextPlaces.delete(id);
      else nextPlaces.add(id);
      return { ...current, places: nextPlaces };
    });
  }, []);

  const addRestaurantFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => ({
      ...current,
      restaurants: new Set(current.restaurants).add(id),
    }));
  }, []);

  const removeRestaurantFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => {
      const nextRestaurants = new Set(current.restaurants);
      nextRestaurants.delete(id);
      return { ...current, restaurants: nextRestaurants };
    });
  }, []);

  const toggleRestaurantFavorite = useCallback((id: string) => {
    setFavoriteSets((current) => {
      const nextRestaurants = new Set(current.restaurants);
      if (nextRestaurants.has(id)) nextRestaurants.delete(id);
      else nextRestaurants.add(id);
      return { ...current, restaurants: nextRestaurants };
    });
  }, []);

  const isPlaceFavorite = useCallback((id: string) => places.has(id), [places]);
  const isRestaurantFavorite = useCallback((id: string) => restaurants.has(id), [restaurants]);

  return {
    placeFavorites: places,
    restaurantFavorites: restaurants,
    addPlaceFavorite,
    removePlaceFavorite,
    togglePlaceFavorite,
    addRestaurantFavorite,
    removeRestaurantFavorite,
    toggleRestaurantFavorite,
    isPlaceFavorite,
    isRestaurantFavorite,
  };
}
