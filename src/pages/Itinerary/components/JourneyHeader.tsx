import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, CalendarDays, MapPin, MoreHorizontal, MoveRight } from "lucide-react";
import { useState } from "react";

import { GlassCard, ThemeToggle } from "@/components/ui";
import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { riseIn } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";
import type { TripDay, TripPlan } from "@/types/trip";

export interface JourneyHeaderProps {
  trip: TripPlan;
  day: TripDay;
  totalDays: number;
  onMoveDay?: () => void;
  onSwapDay?: () => void;
}

export function JourneyHeader({ trip, day, totalDays, onMoveDay, onSwapDay }: JourneyHeaderProps) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const parsedDate = new Date(`${day.date}T00:00:00`);
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

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
      <div className="relative flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Open day actions"
          onClick={() => setMenuOpen((open) => !open)}
          className="glass-surface glass-shadow flex size-10 items-center justify-center rounded-full text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
        >
          <MoreHorizontal size={18} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute right-0 top-12 z-30 w-48"
            >
              <GlassCard elevated padding="sm" className="grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onMoveDay?.();
                  }}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-ink transition hover:bg-ink/5 dark:hover:bg-white/5"
                >
                  <MoveRight size={17} className="text-accent-strong" />
                  Move Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onSwapDay?.();
                  }}
                  className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-ink transition hover:bg-ink/5 dark:hover:bg-white/5"
                >
                  <ArrowRightLeft size={17} className="text-accent-strong" />
                  Swap Day
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
