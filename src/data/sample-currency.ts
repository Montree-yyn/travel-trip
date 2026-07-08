import type { CurrencyData } from "@/types/currency";

import currencyDataJson from "./currency.json";

const currencyData = currencyDataJson as CurrencyData;

export const sampleExchangeRate = currencyData.exchangeRate;
export const quickAmounts = currencyData.quickAmounts;
