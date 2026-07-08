import { motion } from "framer-motion";
import { Clock, Sunrise, Ticket } from "lucide-react";
import { useMemo } from "react";

import { GlassCard } from "@/components/ui";
import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { Place } from "@/types/place";

export function InfoStatGrid({ place }: { place: Place }) {
  const { t } = useTranslation();

  const stats = useMemo(
    () => [
      { icon: Ticket, label: t("places.ticket"), value: place.ticketPrice },
      { icon: Sunrise, label: t("places.bestTime"), value: place.bestTimeToVisit },
      { icon: Clock, label: t("places.duration"), value: place.visitDuration },
    ],
    [place.bestTimeToVisit, place.ticketPrice, place.visitDuration, t],
  );

  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-3 px-5">
      {stats.map(({ icon: Icon, label, value }) => (
        <motion.div key={label} variants={riseIn}>
          <GlassCard padding="sm" className="flex h-full flex-col items-start gap-1.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <Icon size={15} />
            </span>
            <span className="text-[0.6875rem] text-ink-muted">{label}</span>
            <span className="text-xs font-semibold leading-tight text-ink">{value}</span>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
