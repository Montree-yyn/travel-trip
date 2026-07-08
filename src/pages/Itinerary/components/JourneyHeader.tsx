import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";

import { ThemeToggle } from "@/components/ui";
import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { riseIn } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";
import type { TripDay, TripPlan } from "@/types/trip";

export interface JourneyHeaderProps {
  trip: TripPlan;
  day: TripDay;
  totalDays: number;
}

export function JourneyHeader({ trip, day, totalDays }: JourneyHeaderProps) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const parsedDate = new Date(`${day.date}T00:00:00`);

  return (
    <motion.header variants={riseIn} className="flex items-start justify-between gap-3 px-5 pt-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
          <MapPin size={14} className="shrink-0" />
          {day.city}
        </p>
        <h1 className="mt-1 text-[2rem] font-bold leading-[1.08] tracking-tight text-ink">{trip.title}</h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
            <CalendarDays size={13} />
            {formatDate.format(parsedDate)} · {day.weekday}
          </span>
          <span className="inline-flex items-center rounded-pill glass-surface glass-shadow px-3 py-1 text-xs font-semibold text-ink">
            {t("common.dayOf", {
              current: day.dayNumber === CURRENT_DAY_INDEX ? day.dayNumber : day.dayNumber,
              total: totalDays,
            })}
            {day.dayNumber === CURRENT_DAY_INDEX && (
              <span className="ml-1.5 size-1.5 rounded-full bg-accent-strong" />
            )}
          </span>
        </div>
      </div>
      <ThemeToggle />
    </motion.header>
  );
}
