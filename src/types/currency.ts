export interface ExchangeRate {
  base: string;
  quote: string;
  rate: number;
  updatedAt: string;
  changePercent: number;
}

export interface CurrencyData {
  exchangeRate: ExchangeRate;
  quickAmounts: number[];
}
