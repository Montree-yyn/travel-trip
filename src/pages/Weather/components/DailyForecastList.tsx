import { motion } from "framer-motion";

import { GlassCard, SectionHeader } from "@/components/ui";
import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { WEATHER_ICONS } from "@/lib/weather";
import type { DailyForecast } from "@/types/weather";

export function DailyForecastList({
  days,
  selectedDate,
  onSelect,
}: {
  days: DailyForecast[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const { t } = useTranslation();
  const globalLow = Math.min(...days.map((d) => d.low));
  const globalHigh = Math.max(...days.map((d) => d.high));
  const range = globalHigh - globalLow || 1;

  return (
    <div className="flex flex-col gap-3.5">
      <SectionHeader title={t("weather.sixDayForecast")} />
      <GlassCard padding="sm" className="mx-5 flex flex-col">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {days.map((day) => {
            const Icon = WEATHER_ICONS[day.condition];
            const isActive = day.date === selectedDate;
            const leftPct = ((day.low - globalLow) / range) * 100;
            const widthPct = ((day.high - day.low) / range) * 100;

            return (
              <motion.button
                key={day.date}
                variants={riseIn}
                onClick={() => onSelect(day.date)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                  isActive && "bg-accent-soft",
                )}
              >
                <span className="w-10 shrink-0 text-sm font-medium text-ink">{day.weekday}</span>
                <Icon size={18} className="shrink-0 text-accent-strong" />
                <span className="w-8 shrink-0 text-right text-xs text-ink-faint">{day.low}°</span>
                <span className="relative h-1.5 flex-1 rounded-pill bg-ink/8">
                  <span
                    className="absolute h-full rounded-pill bg-gradient-to-r from-accent to-accent-strong"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-sm font-semibold text-ink">{day.high}°</span>
              </motion.button>
            );
          })}
        </motion.div>
      </GlassCard>
    </div>
  );
}
