import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { MapActionButtons } from "@/components/ui";
import { createMapTarget } from "@/lib/maps";
import type { Place } from "@/types/place";

export function PlaceCallout({ place }: { place: Place }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="glass-surface-strong glass-shadow rounded-3xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{place.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <Star size={11} className="fill-accent-strong text-accent-strong" />
            {place.rating.toFixed(1)} · {place.category}
          </div>
        </div>
      </div>
      <MapActionButtons
        target={createMapTarget({ name: place.name, address: place.address, city: place.city })}
        className="mt-3"
      />
    </motion.div>
  );
}
