import { motion } from "framer-motion";
import { Navigation } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { NearbyPlace } from "@/types/place";

export function NearbyPlacesRow({ nearby }: { nearby: NearbyPlace[] }) {
  const { t } = useTranslation();

  if (nearby.length === 0) return null;

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-3">
      <SectionHeader title={t("places.nearby")} />
      <div className="flex flex-col gap-2 px-5">
        {nearby.map((place) => (
          <GlassCard key={place.name} padding="sm" interactive className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <Navigation size={15} />
            </span>
            <span className="flex-1 text-sm font-medium text-ink">{place.name}</span>
            <span className="text-xs text-ink-muted">{place.distanceLabel}</span>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
