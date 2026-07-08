import { motion } from "framer-motion";
import { Heart, MapPin, UtensilsCrossed } from "lucide-react";

import { Chip, GlassCard, MapActionButtons, RatingStars, TripImage } from "@/components/ui";
import { riseIn, tapScale } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { createMapTarget } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types/food";

const PRICE_SYMBOL = ["", "$", "$$", "$$$", "$$$$"];

export interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }: RestaurantCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="none" interactive className="mx-5 overflow-hidden">
        <div className="relative">
          <TripImage
            seed={restaurant.photoSeed}
            alt={restaurant.name}
            icon={UtensilsCrossed}
            className="h-40 w-full"
            iconClassName="size-12"
          />

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            whileTap={tapScale}
            aria-label={isFavorite ? t("common.removeFromFavorites") : t("common.addToFavorites")}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/30 backdrop-blur-md ring-1 ring-white/25 transition-colors"
          >
            <motion.span
              key={isFavorite ? "on" : "off"}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Heart size={17} className={cn(isFavorite ? "fill-rose-500 text-rose-500" : "text-white")} />
            </motion.span>
          </motion.button>

          <span className="absolute left-3 top-3 rounded-pill bg-white/30 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {PRICE_SYMBOL[restaurant.priceLevel]}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-ink">{restaurant.name}</h3>
              <p className="text-xs text-ink-muted">{restaurant.cuisine}</p>
            </div>
            <RatingStars rating={restaurant.rating} className="shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {restaurant.tags.map((tag) => (
              <Chip key={tag} tone="neutral">
                {tag}
              </Chip>
            ))}
          </div>

          {restaurant.distanceLabel && (
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              <MapPin size={12} /> {restaurant.distanceLabel} · {restaurant.city}
            </span>
          )}

          <MapActionButtons
            target={createMapTarget({ name: restaurant.name, city: restaurant.city })}
            className="pt-1"
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}
