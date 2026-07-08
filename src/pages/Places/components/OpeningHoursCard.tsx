import { motion } from "framer-motion";
import { Info } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { Place } from "@/types/place";

export function OpeningHoursCard({ place }: { place: Place }) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-3.5">
      <SectionHeader title={t("places.openingHours")} />
      <GlassCard padding="md" className="mx-5 flex flex-col gap-2.5">
        {place.openingHours.map((entry) => (
          <div key={entry.day} className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">{entry.day}</span>
            <span className="font-medium text-ink">{entry.hours}</span>
          </div>
        ))}
      </GlassCard>

      <div className="glass-shadow mx-5 flex gap-3 rounded-2xl bg-accent-soft p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-accent-strong" />
        <p className="text-xs leading-relaxed text-accent-strong">{place.description}</p>
      </div>
    </motion.div>
  );
}
