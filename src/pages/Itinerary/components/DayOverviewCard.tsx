import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Chip, GlassCard, TripImage } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import type { TripDay } from "@/types/trip";

export function DayOverviewCard({ day }: { day: TripDay }) {
  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="none" elevated className="mx-5 overflow-hidden">
        <div className="relative">
          <TripImage
            seed={`${day.city}-${day.dayNumber}`}
            icon={Sparkles}
            className="h-32 w-full"
            iconClassName="size-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
        <div className="p-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-strong">{day.city}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-ink">{day.title}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{day.theme}</p>
          {day.highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {day.highlights.map((highlight) => (
                <Chip key={highlight.name} tone="neutral">
                  {highlight.name}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
