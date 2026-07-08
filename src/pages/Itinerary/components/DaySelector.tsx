import { motion } from "framer-motion";

import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { motionEasing } from "@/design-system/tokens";
import { tapScaleSubtle } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { TripDay } from "@/types/trip";

export interface DaySelectorProps {
  days: TripDay[];
  selected: number;
  onSelect: (dayNumber: number) => void;
}

export function DaySelector({ days, selected, onSelect }: DaySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
      {days.map((day) => {
        const isActive = day.dayNumber === selected;
        const isToday = day.dayNumber === CURRENT_DAY_INDEX;
        return (
          <motion.button
            key={day.dayNumber}
            type="button"
            onClick={() => onSelect(day.dayNumber)}
            whileTap={tapScaleSubtle}
            transition={motionEasing.snappySpring}
            className={cn(
              "relative shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold",
              isActive ? "text-accent-contrast" : "glass-surface glass-shadow text-ink-muted",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="day-selector-active"
                className="pill-glow absolute inset-0 rounded-2xl bg-gradient-to-b from-accent to-accent-strong"
                transition={motionEasing.snappySpring}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {t("common.day", { day: day.dayNumber })}
              {isToday && (
                <span className={cn("size-1.5 rounded-full", isActive ? "bg-white" : "bg-accent-strong")} />
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
