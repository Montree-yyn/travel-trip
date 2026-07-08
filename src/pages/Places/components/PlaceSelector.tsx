import { motion } from "framer-motion";

import { TripImage } from "@/components/ui";
import { tapScaleSubtle } from "@/design-system/motion";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/place";

export function PlaceSelector({
  places,
  selectedId,
  onSelect,
}: {
  places: Place[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
      {places.map((place) => {
        const isActive = place.id === selectedId;
        return (
          <motion.button
            key={place.id}
            onClick={() => onSelect(place.id)}
            whileTap={tapScaleSubtle}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="relative">
              <TripImage
                seed={place.photoSeed}
                alt={place.name}
                className={cn(
                  "size-16 rounded-2xl transition-all",
                  isActive ? "ring-[3px] ring-accent-strong ring-offset-2 ring-offset-bg" : "opacity-70",
                )}
              />
              {isActive && (
                <motion.span
                  layoutId="place-selector-dot"
                  className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent-strong"
                />
              )}
            </span>
            <span className={cn("max-w-16 truncate text-[0.6875rem] font-medium", isActive ? "text-accent-strong" : "text-ink-muted")}>
              {place.name.split(" ")[0]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
