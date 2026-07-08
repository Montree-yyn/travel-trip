import type { DailyForecast } from "@/types/weather";

import weatherData from "./weather.json";

export const sampleForecast = weatherData as DailyForecast[];

function resolveWeatherCity(city: string) {
  if (city.includes("Osaka")) return "Osaka";
  if (city.includes("Kobe")) return "Kobe";
  if (city.includes("Kyoto") || city.includes("Ine") || city.includes("Uji")) return "Kyoto";
  return "Osaka";
}

export function getTripDayForecast(city: string, date: string) {
  const weatherCity = resolveWeatherCity(city);

  return (
    sampleForecast.find((forecast) => forecast.city === weatherCity && forecast.date === date) ??
    sampleForecast.find((forecast) => forecast.date === date) ??
    sampleForecast[0]
  );
}
