import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";

import { GlassCard } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

const FLAGS: Record<string, string> = { THB: "🇹🇭", JPY: "🇯🇵" };

export interface ConverterCardProps {
  fromCode: string;
  toCode: string;
  amount: string;
  result: string;
  onAmountChange: (value: string) => void;
  onSwap: () => void;
}

export function ConverterCard({ fromCode, toCode, amount, result, onAmountChange, onSwap }: ConverterCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div variants={scaleIn} className="relative mx-5">
      <GlassCard padding="lg" className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <span className="text-xl leading-none">{FLAGS[fromCode]}</span> {fromCode}
          </span>
        </div>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          className="w-full bg-transparent text-3xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-faint"
        />

        <div className="my-3 h-px bg-ink/8" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <span className="text-xl leading-none">{FLAGS[toCode]}</span> {toCode}
          </span>
        </div>
        <p className="w-full truncate text-3xl font-semibold tracking-tight text-accent-strong">{result}</p>
      </GlassCard>

      <motion.button
        onClick={onSwap}
        whileTap={{ scale: 0.9, rotate: 180 }}
        aria-label={t("common.swapCurrencies")}
        className="glow-accent absolute right-6 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent-strong text-white"
      >
        <ArrowUpDown size={18} />
      </motion.button>
    </motion.div>
  );
}
