import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { WEATHER_GRADIENTS, WEATHER_ICONS } from "@/lib/weather";
import { ROUTES } from "@/router/paths";
import type { DailyForecast } from "@/types/weather";

export function WeatherMiniCard({ forecast }: { forecast: DailyForecast }) {
  const { t } = useTranslation();
  const Icon = WEATHER_ICONS[forecast.condition];

  return (
    <motion.div variants={riseIn} className="w-full">
      <Link to={ROUTES.weather}>
        <GlassCard interactive padding="none" className="relative h-full overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-br opacity-[0.16] ${WEATHER_GRADIENTS[forecast.condition]}`}
          />
          <div className="relative flex h-full flex-col p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">{forecast.city}</span>
              <Icon size={18} className="text-accent-strong" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight text-ink">{forecast.high}°</span>
              <span className="text-sm text-ink-faint">/{forecast.low}°</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{t(`weatherConditions.${forecast.condition}`)}</p>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
