import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { Chip, GlassCard, TripImage } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import type { TimelineItem } from "@/types/trip";

export function UpcomingActivityCard({ item, seed }: { item: TimelineItem; seed: string }) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="px-5">
      <Link to={ROUTES.itinerary}>
        <GlassCard interactive padding="none" className="flex overflow-hidden">
          <TripImage seed={seed} className="size-[5.5rem] shrink-0" />
          <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-accent-strong">
                {t("home.upcomingActivity")}
              </p>
              <Chip tone="accent" className="mt-1.5 w-fit">
                <Clock size={11} /> {t("home.nextUp", { time: item.time })}
              </Chip>
              <p className="mt-1.5 truncate text-base font-semibold text-ink">{item.activity}</p>
              {item.notes && <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{item.notes}</p>}
            </div>
            <span className="glass-surface flex size-9 shrink-0 items-center justify-center rounded-full">
              <ArrowRight size={16} className="text-ink-muted" />
            </span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
