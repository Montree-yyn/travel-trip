import { motion } from "framer-motion";

import { staggerContainer, riseIn } from "@/design-system/motion";

export function QuickAmountChips({ amounts, onSelect }: { amounts: number[]; onSelect: (value: number) => void }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-wrap gap-2 px-5">
      {amounts.map((amount) => (
        <motion.button
          key={amount}
          variants={riseIn}
          onClick={() => onSelect(amount)}
          className="glass-surface glass-shadow rounded-pill px-4 py-2 text-sm font-medium text-ink transition-colors active:bg-accent-soft"
        >
          {amount.toLocaleString()}
        </motion.button>
      ))}
    </motion.div>
  );
}
