import { motion } from "framer-motion";

import { GlassCard, SectionHeader } from "@/components/ui";
import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { WEATHER_ICONS } from "@/lib/weather";
import type { HourlyForecast } from "@/types/weather";

export function HourlyForecastRow({ hourly }: { hourly: HourlyForecast[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3.5">
      <SectionHeader title={t("weather.hourlyForecast")} />
      <GlassCard padding="md" className="mx-5">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex justify-between gap-2">
          {hourly.map((hour) => {
            const Icon = WEATHER_ICONS[hour.condition];
            return (
              <motion.div key={hour.time} variants={riseIn} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-ink-muted">{hour.time}</span>
                <Icon size={20} className="text-accent-strong" />
                <span className="text-sm font-semibold text-ink">{hour.temp}°</span>
              </motion.div>
            );
          })}
        </motion.div>
      </GlassCard>
    </div>
  );
}
