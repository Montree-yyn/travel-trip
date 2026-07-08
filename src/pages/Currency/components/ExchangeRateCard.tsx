import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";
import type { ExchangeRate } from "@/types/currency";

export function ExchangeRateCard({ rate }: { rate: ExchangeRate }) {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();
  const updated = new Date(rate.updatedAt);

  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="md" className="mx-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-muted">{t("currency.exchangeRate")}</p>
          <p className="mt-0.5 text-base font-semibold text-ink">
            {t("currency.rateLine", {
              base: rate.base,
              rate: rate.rate.toFixed(2),
              quote: rate.quote,
            })}
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-ink-faint">
            {t("currency.rateUpdated", { date: formatDate.format(updated) })}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-pill bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp size={12} /> {rate.changePercent}%
        </span>
      </GlassCard>
    </motion.div>
  );
}
