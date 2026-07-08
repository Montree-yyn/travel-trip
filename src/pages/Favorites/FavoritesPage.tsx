import { motion } from "framer-motion";
import { Heart, Landmark, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { EmptyState, GlassCard, TripImage, SectionHeader, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { samplePlaces } from "@/data/sample-places";
import { sampleRestaurants } from "@/data/sample-restaurants";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";

export function FavoritesPage() {
  const { t } = useTranslation();
  const defaultRestaurantFavorites = useMemo(
    () => sampleRestaurants.filter((restaurant) => restaurant.isFavorite).map((restaurant) => restaurant.id),
    [],
  );
  const {
    placeFavorites,
    restaurantFavorites,
    removePlaceFavorite,
    removeRestaurantFavorite,
  } = useFavorites(defaultRestaurantFavorites);

  const favoritePlaces = useMemo(
    () => samplePlaces.filter((place) => placeFavorites.has(place.id)),
    [placeFavorites],
  );
  const favoriteRestaurants = useMemo(
    () => sampleRestaurants.filter((restaurant) => restaurantFavorites.has(restaurant.id)),
    [restaurantFavorites],
  );
  const totalCount = favoritePlaces.length + favoriteRestaurants.length;

  return (
    <PageLoadingGate>
      <PageAccent tone="pink">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
        <PageHeader
          title={t("favorites.title")}
          subtitle={t("favorites.subtitle", { count: totalCount })}
          actions={<ThemeToggle />}
        />

        {totalCount === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("empty.favorites.title")}
            description={t("empty.favorites.description")}
          />
        ) : (
          <>
            {favoritePlaces.length > 0 && (
              <div className="flex flex-col gap-3.5">
                <SectionHeader
                  title={t("favorites.placesSection")}
                  action={
                    <Link to={ROUTES.places} className="text-xs font-semibold text-accent-strong">
                      {t("common.viewAll")}
                    </Link>
                  }
                />
                <div className="flex flex-col gap-3">
                  {favoritePlaces.map((place) => (
                    <motion.div key={place.id} variants={riseIn}>
                      <GlassCard padding="md" className="mx-5 flex items-center gap-3">
                        <TripImage seed={place.photoSeed} icon={Landmark} className="size-14 shrink-0 rounded-xl" iconClassName="size-5" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{place.name}</p>
                          <p className="truncate text-xs text-ink-muted">{place.city} · {place.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePlaceFavorite(place.id)}
                          className="rounded-pill bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong"
                        >
                          {t("common.remove")}
                        </button>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {favoriteRestaurants.length > 0 && (
              <div className="flex flex-col gap-3.5">
                <SectionHeader
                  title={t("favorites.restaurantsSection")}
                  action={
                    <Link to={ROUTES.food} className="text-xs font-semibold text-accent-strong">
                      {t("common.viewAll")}
                    </Link>
                  }
                />
                <div className="flex flex-col gap-3">
                  {favoriteRestaurants.map((restaurant) => (
                    <motion.div key={restaurant.id} variants={riseIn}>
                      <GlassCard padding="md" className="mx-5 flex items-center gap-3">
                        <TripImage seed={restaurant.photoSeed} icon={UtensilsCrossed} className="size-14 shrink-0 rounded-xl" iconClassName="size-5" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{restaurant.name}</p>
                          <p className="truncate text-xs text-ink-muted">{restaurant.city} · {restaurant.cuisine}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRestaurantFavorite(restaurant.id)}
                          className="rounded-pill bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong"
                        >
                          {t("common.remove")}
                        </button>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </PageAccent>
    </PageLoadingGate>
  );
}

export default FavoritesPage;
