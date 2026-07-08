import { motion } from "framer-motion";
import { CloudRain, Shirt } from "lucide-react";
import { useMemo, useState } from "react";

import { FilterChips, GlassCard, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { sampleForecast } from "@/data/sample-weather";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import {
  getForecastsByCity,
  getOutfitSuggestionKey,
  getRainAlertKey,
  WEATHER_CITIES,
  type WeatherCity,
} from "@/lib/weather";

import { DailyForecastList } from "./components/DailyForecastList";
import { HourlyForecastRow } from "./components/HourlyForecastRow";
import { WeatherHeroCard } from "./components/WeatherHeroCard";

export function WeatherPage() {
  const { t } = useTranslation();
  const cityFilters = useMemo(
    () => WEATHER_CITIES.map((city) => ({ value: city, label: city })),
    [],
  );
  const [selectedCity, setSelectedCity] = useState<WeatherCity>("Osaka");
  const cityForecasts = useMemo(() => getForecastsByCity(sampleForecast, selectedCity), [selectedCity]);
  const defaultDate = cityForecasts[CURRENT_DAY_INDEX - 1]?.date ?? cityForecasts[0]?.date ?? sampleForecast[0]!.date;
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const forecast = cityForecasts.find((f) => f.date === selectedDate) ?? cityForecasts[0]!;

  return (
    <PageAccent tone="sky">
      <PageLoadingGate>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
          <PageHeader title={t("weather.title")} subtitle={t("weather.subtitle")} actions={<ThemeToggle />} />

          <FilterChips
            options={cityFilters}
            value={selectedCity}
            onChange={(city) => {
              setSelectedCity(city);
              const nextForecasts = getForecastsByCity(sampleForecast, city);
              setSelectedDate(nextForecasts[CURRENT_DAY_INDEX - 1]?.date ?? nextForecasts[0]?.date ?? selectedDate);
            }}
            className="px-5"
          />

          <WeatherHeroCard forecast={forecast} />
          <motion.div variants={riseIn} className="grid grid-cols-2 gap-3 px-5">
            <GlassCard padding="md" className="flex flex-col gap-2">
              <CloudRain size={18} className="text-accent-strong" />
              <p className="text-xs font-medium text-ink-muted">{t("weather.rainAlert")}</p>
              <p className="text-xs leading-relaxed text-ink">{t(getRainAlertKey(forecast))}</p>
            </GlassCard>
            <GlassCard padding="md" className="flex flex-col gap-2">
              <Shirt size={18} className="text-accent-strong" />
              <p className="text-xs font-medium text-ink-muted">{t("weather.outfit")}</p>
              <p className="text-xs leading-relaxed text-ink">{t(getOutfitSuggestionKey(forecast))}</p>
            </GlassCard>
          </motion.div>
          <HourlyForecastRow hourly={forecast.hourly} />
          <DailyForecastList days={cityForecasts} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </motion.div>
      </PageLoadingGate>
    </PageAccent>
  );
}

export default WeatherPage;
