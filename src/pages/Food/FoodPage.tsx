import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";

import { DataErrorState, EmptyState, FilterChips, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { sampleRestaurants } from "@/data/sample-restaurants";
import { staggerContainer } from "@/design-system/motion";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslation } from "@/i18n";
import type { FoodCategory } from "@/types/food";

import { RestaurantCard } from "./components/RestaurantCard";
import { RestaurantCardSkeleton } from "./components/RestaurantCardSkeleton";

export function FoodPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FoodCategory | "all">("all");
  const defaultRestaurantFavorites = useMemo(
    () => sampleRestaurants.filter((restaurant) => restaurant.isFavorite).map((restaurant) => restaurant.id),
    [],
  );
  const { isRestaurantFavorite, toggleRestaurantFavorite } = useFavorites(defaultRestaurantFavorites);

  const filters = useMemo(
    () =>
      [
        { value: "all", label: t("filters.food.all") },
        { value: "restaurant", label: t("filters.food.restaurant") },
        { value: "cafe", label: t("filters.food.cafe") },
        { value: "dessert", label: t("filters.food.dessert") },
        { value: "street-food", label: t("filters.food.street-food") },
      ] as const,
    [t],
  );

  const restaurants = useMemo(
    () => (filter === "all" ? sampleRestaurants : sampleRestaurants.filter((r) => r.category === filter)),
    [filter],
  );

  if (sampleRestaurants.length === 0) {
    return (
      <PageAccent tone="amber">
        <DataErrorState />
      </PageAccent>
    );
  }

  return (
    <PageAccent tone="amber">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5 pb-8">
        <PageHeader
          title={t("food.title")}
          subtitle={t("food.subtitle", { count: restaurants.length })}
          actions={<ThemeToggle />}
        />

        <FilterChips options={[...filters]} value={filter} onChange={setFilter} className="px-5" />

        <PageLoadingGate
          skeleton={
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {restaurants.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title={t("food.noPlacesTitle")}
                description={t("food.noPlacesDescription")}
              />
            ) : (
              restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={isRestaurantFavorite(restaurant.id)}
                  onToggleFavorite={() => toggleRestaurantFavorite(restaurant.id)}
                />
              ))
            )}
          </div>
        </PageLoadingGate>
      </motion.div>
    </PageAccent>
  );
}

export default FoodPage;
