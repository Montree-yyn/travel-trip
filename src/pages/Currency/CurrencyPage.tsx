import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { quickAmounts, sampleExchangeRate } from "@/data/sample-currency";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

import { ConverterCard } from "./components/ConverterCard";
import { ExchangeRateCard } from "./components/ExchangeRateCard";
import { QuickAmountChips } from "./components/QuickAmountChips";

function formatNumber(value: number, maximumFractionDigits: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits });
}

const LAST_AMOUNT_KEY = "travel-trip-currency-last-amount";

function getStoredAmount() {
  if (typeof window === "undefined") return "1000";
  return window.localStorage.getItem(LAST_AMOUNT_KEY) ?? "1000";
}

export function CurrencyPage() {
  const { t } = useTranslation();
  const [base, setBase] = useState<"THB" | "JPY">("THB");
  const [amount, setAmount] = useState(getStoredAmount);

  const toCode = base === "THB" ? "JPY" : "THB";
  const numericAmount = Number.parseFloat(amount) || 0;

  const result = useMemo(() => {
    const value =
      base === "THB" ? numericAmount * sampleExchangeRate.rate : numericAmount / sampleExchangeRate.rate;
    return formatNumber(value, toCode === "JPY" ? 0 : 2);
  }, [base, numericAmount, toCode]);

  useEffect(() => {
    window.localStorage.setItem(LAST_AMOUNT_KEY, amount);
  }, [amount]);

  function handleSwap() {
    setAmount(result.replace(/,/g, ""));
    setBase(toCode);
  }

  return (
    <PageAccent tone="teal">
      <PageLoadingGate>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
          <PageHeader title={t("currency.title")} subtitle={t("currency.subtitle")} actions={<ThemeToggle />} />

          <ExchangeRateCard rate={sampleExchangeRate} />

          <div className="flex flex-col gap-3.5">
            <SectionHeader title={t("currency.convert")} />
            <ConverterCard
              fromCode={base}
              toCode={toCode}
              amount={amount}
              result={result}
              onAmountChange={setAmount}
              onSwap={handleSwap}
            />
          </div>

          <div className="flex flex-col gap-3.5">
            <SectionHeader title={t("currency.quickAmounts")} />
            <QuickAmountChips amounts={quickAmounts} onSelect={(value) => setAmount(String(value))} />
          </div>

          <motion.div variants={riseIn} className="glass-shadow mx-5 flex gap-3 rounded-2xl bg-accent-soft p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-accent-strong" />
            <p className="text-xs leading-relaxed text-accent-strong">{t("currency.offlineNotice")}</p>
          </motion.div>
        </motion.div>
      </PageLoadingGate>
    </PageAccent>
  );
}

export default CurrencyPage;
