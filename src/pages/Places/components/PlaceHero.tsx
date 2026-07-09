import { motion } from "framer-motion";
import { Landmark, MapPin, Star } from "lucide-react";

import { TripImage } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import type { Place } from "@/types/place";

export function PlaceHero({ place }: { place: Place }) {
  return (
    <motion.div variants={scaleIn} className="glass-shadow-lg relative mx-5 overflow-hidden rounded-4xl">
      <TripImage
        seed={place.photoSeed}
        alt={place.name}
        icon={Landmark}
        className="h-56 w-full"
        iconClassName="size-16"
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1 rounded-pill bg-white/25 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/30">
        <Star size={12} className="fill-white text-white" />
        <span className="text-xs font-semibold text-white">{place.rating.toFixed(1)}</span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <span className="mb-1.5 inline-block rounded-pill bg-white/25 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-white backdrop-blur-md ring-1 ring-white/30">
          {place.category}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">{place.name}</h2>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/85">
          <MapPin size={11} className="shrink-0" /> {place.address}
        </p>
      </div>
    </motion.div>
  );
}
