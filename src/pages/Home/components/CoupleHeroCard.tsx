import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";

import { GlassCard, ProgressBar } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { TripPlan } from "@/types/trip";

export interface CoupleHeroCardProps {
  trip: TripPlan;
  currentDay: number;
  countdownDays: number;
  remainingDays: number;
  progressPercent: number;
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${startDate.toLocaleDateString("en-US", opts)} – ${endDate.toLocaleDateString("en-US", opts)}, ${endDate.getFullYear()}`;
}

export function CoupleHeroCard({
  trip,
  currentDay,
  countdownDays,
  remainingDays,
  progressPercent,
}: CoupleHeroCardProps) {
  const { t } = useTranslation();
  const completedDayDots = countdownDays > 0 ? 0 : currentDay;

  return (
    <motion.div variants={scaleIn} className="px-5">
      <GlassCard elevated padding="lg" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-soft/90 via-white/20 to-accent/5 dark:from-accent-soft/40 dark:via-transparent dark:to-accent/10"
        />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/55 px-3 py-1 text-[0.6875rem] font-semibold text-accent-strong ring-1 ring-white/70 backdrop-blur-sm dark:bg-white/10 dark:ring-white/15">
              <MapPin size={11} />
              {trip.companions.length > 1 ? t("home.coupleHero.tripTogether") : t("home.coupleHero.soloTrip")}
            </span>
            <span className="inline-flex items-center rounded-pill bg-accent/10 px-3 py-1 text-[0.6875rem] font-semibold text-accent-strong">
              {countdownDays > 0
                ? t("home.coupleHero.daysToGo", { count: countdownDays })
                : t("home.coupleHero.daysLeft", { count: remainingDays })}
            </span>
          </div>

          <div>
            <h2 className="text-[1.625rem] font-bold leading-tight tracking-tight text-ink">{trip.title}</h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
              <CalendarDays size={14} className="shrink-0 text-accent-strong" />
              {formatDateRange(trip.dateRange.start, trip.dateRange.end)}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: trip.days }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${
                    index < completedDayDots ? "bg-accent-strong" : "bg-ink/10 dark:bg-white/15"
                  }`}
                />
              ))}
            </div>

            <ProgressBar value={progressPercent} />

            <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
              <span>{t("home.coupleHero.dayProgress", { current: currentDay, total: trip.days })}</span>
              <span>{t("home.coupleHero.percentComplete", { percent: progressPercent })}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
