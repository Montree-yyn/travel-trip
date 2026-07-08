import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { RatingStars, TripImage } from "@/components/ui";
import { tapScaleSubtle } from "@/design-system/motion";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/place";

export function NearbyPlaceRow({ place, isActive, onSelect }: { place: Place; isActive: boolean; onSelect: () => void }) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={tapScaleSubtle}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
        isActive ? "bg-accent-soft" : "active:bg-ink/5",
      )}
    >
      <TripImage seed={place.photoSeed} className="size-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{place.name}</p>
        <p className="truncate text-xs text-ink-muted">{place.category}</p>
        <RatingStars rating={place.rating} size={10} className="mt-1" />
      </div>
      <ChevronRight size={16} className={cn("shrink-0", isActive ? "text-accent-strong" : "text-ink-faint")} />
    </motion.button>
  );
}
