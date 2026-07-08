export type WeatherCondition =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "clear-night";

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  date: string;
  weekday: string;
  city: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  precipitation: number;
  humidity: number;
  hourly: HourlyForecast[];
}
