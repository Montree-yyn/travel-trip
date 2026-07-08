import { motion } from "framer-motion";
import { TrainFront } from "lucide-react";

import { Chip, GlassCard, MapActionButtons, TripImage } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { createMapTarget } from "@/lib/maps";
import type { TransportStation } from "@/types/transport";

export function StationCard({ station }: { station: TransportStation }) {
  return (
    <motion.div variants={riseIn} className="w-56 shrink-0">
      <GlassCard padding="none" className="h-full overflow-hidden">
        <TripImage
          seed="transport-station"
          alt={station.name}
          icon={TrainFront}
          className="h-20 w-full"
          iconClassName="size-8"
        />

        <div className="p-4">
          <p className="text-sm font-semibold text-ink">{station.name}</p>
          <p className="text-xs text-ink-muted">{station.city}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {station.lines.map((line) => (
              <Chip key={line} tone="neutral">
                {line}
              </Chip>
            ))}
          </div>
          <MapActionButtons target={createMapTarget({ name: station.name, city: station.city })} className="mt-3" />
        </div>
      </GlassCard>
    </motion.div>
  );
}
