import { motion } from "framer-motion";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { CURRENT_DAY_INDEX } from "@/data/app-state";
import type { DailySpending } from "@/types/budget";

export function DailySpendingChart({ days }: { days: DailySpending[] }) {
  const max = Math.max(...days.map((d) => d.amount));

  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="md" className="mx-5">
        <div className="flex h-36 items-end justify-between gap-2.5 border-b border-ink/8 pb-3">
          {days.map((day) => {
            const height = Math.max(8, (day.amount / max) * 100);
            const isToday = day.day === CURRENT_DAY_INDEX;
            return (
              <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span
                  className={`text-[0.625rem] font-semibold ${isToday ? "text-accent-strong" : "text-ink-faint"}`}
                >
                  {(day.amount / 1000).toFixed(1)}k
                </span>
                <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-ink/[0.06]">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={
                      isToday
                        ? "glow-accent w-full rounded-t-lg bg-gradient-to-t from-accent-strong to-accent"
                        : "w-full rounded-t-lg bg-ink/[0.16]"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2.5">
          {days.map((day) => {
            const isToday = day.day === CURRENT_DAY_INDEX;
            return (
              <span
                key={day.day}
                className={`flex-1 text-center text-[0.625rem] font-semibold ${
                  isToday ? "text-accent-strong" : "text-ink-faint"
                }`}
              >
                {day.label}
              </span>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}
