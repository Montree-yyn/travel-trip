import { motion } from "framer-motion";
import { Droplets, CloudRain } from "lucide-react";

import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { WEATHER_GRADIENTS, WEATHER_ICONS } from "@/lib/weather";
import type { DailyForecast } from "@/types/weather";

export function WeatherHeroCard({ forecast }: { forecast: DailyForecast }) {
  const { t } = useTranslation();
  const Icon = WEATHER_ICONS[forecast.condition];
  const isDark = forecast.condition === "clear-night" || forecast.condition === "stormy";

  return (
    <motion.div
      variants={scaleIn}
      className={cn(
        "glass-shadow-glow relative mx-5 overflow-hidden rounded-4xl bg-gradient-to-br p-6",
        WEATHER_GRADIENTS[forecast.condition],
      )}
    >
      <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/15 blur-2xl animate-float" />
      <div className="absolute -bottom-8 -left-6 size-28 rounded-full bg-white/10 blur-2xl animate-float" style={{ animationDelay: "-3s" }} />

      <div className={cn("relative flex items-center justify-between", isDark ? "text-white" : "text-white")}>
        <div>
          <p className="text-sm font-medium opacity-90">{forecast.city}</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">{forecast.high}°</p>
          <p className="mt-1 text-sm opacity-90">
            {t(`weatherConditions.${forecast.condition}`)} · {t("weather.lowTemp", { temp: forecast.low })}
          </p>
        </div>
        <Icon size={64} strokeWidth={1.25} className="opacity-90" />
      </div>

      <div className="relative mt-6 flex gap-4 border-t border-white/20 pt-4 text-white/90">
        <span className="flex items-center gap-1.5 text-xs">
          <Droplets size={13} /> {t("weather.humidity", { percent: forecast.humidity })}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <CloudRain size={13} /> {t("weather.rainChance", { percent: forecast.precipitation })}
        </span>
      </div>
    </motion.div>
  );
}
