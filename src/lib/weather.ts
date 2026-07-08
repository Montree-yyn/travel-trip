import { Cloud, CloudRain, CloudSun, Moon, Sun, Zap } from "lucide-react";

import type { WeatherCondition } from "@/types/weather";
import type { DailyForecast } from "@/types/weather";

export const WEATHER_ICONS: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: Zap,
  "clear-night": Moon,
};

export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  "partly-cloudy": "Partly Cloudy",
  cloudy: "Cloudy",
  rainy: "Rainy",
  stormy: "Stormy",
  "clear-night": "Clear",
};

export const WEATHER_GRADIENTS: Record<WeatherCondition, string> = {
  sunny: "from-[#7EC8F2] via-[#A9DFF5] to-[#FFE7A8]",
  "partly-cloudy": "from-[#8FB8E0] via-[#B7D3EC] to-[#E8EEF3]",
  cloudy: "from-[#9AA7B4] via-[#BFC9D1] to-[#DCE2E6]",
  rainy: "from-[#5B7290] via-[#7C93AC] to-[#A9BCCF]",
  stormy: "from-[#3E4A63] via-[#5A6684] to-[#7C87A3]",
  "clear-night": "from-[#1B2140] via-[#3B3C74] to-[#6C5B9E]",
};

export function getRainAlertKey(forecast: DailyForecast) {
  if (forecast.precipitation >= 60 || forecast.condition === "rainy" || forecast.condition === "stormy") {
    return "weatherAlerts.high";
  }
  if (forecast.precipitation >= 30) {
    return "weatherAlerts.medium";
  }
  return "weatherAlerts.low";
}

export function getOutfitSuggestionKey(forecast: DailyForecast) {
  if (forecast.high >= 32) return "weatherOutfits.hot";
  if (forecast.condition === "rainy" || forecast.precipitation >= 50) return "weatherOutfits.rainy";
  if (forecast.low <= 18) return "weatherOutfits.cool";
  return "weatherOutfits.default";
}

/** @deprecated Use getRainAlertKey with t() */
export function getRainAlert(forecast: DailyForecast) {
  return getRainAlertKey(forecast);
}

/** @deprecated Use getOutfitSuggestionKey with t() */
export function getOutfitSuggestion(forecast: DailyForecast) {
  return getOutfitSuggestionKey(forecast);
}

export const WEATHER_CITIES = ["Osaka", "Kyoto", "Kobe"] as const;

export type WeatherCity = (typeof WEATHER_CITIES)[number];

export function getLocalWeatherFallback(forecasts: DailyForecast[]) {
  return forecasts.length > 0 ? forecasts : [];
}

export function getForecastsByCity(forecasts: DailyForecast[], city: WeatherCity) {
  return forecasts
    .filter((forecast) => forecast.city === city)
    .sort((a, b) => a.date.localeCompare(b.date));
}
