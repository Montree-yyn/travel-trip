import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import type { TripDay } from "@/types/trip";

export interface TodayPlanCardProps {
  day: TripDay;
}

export function TodayPlanCard({ day }: TodayPlanCardProps) {
  const { t } = useTranslation();
  const items = day.timeline.slice(0, 3);

  return (
    <motion.div variants={riseIn}>
      <Link to={ROUTES.itinerary}>
        <GlassCard interactive padding="md" className="mx-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-strong">
                {t("home.todayCity", { city: day.city })}
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-ink">{day.title}</h3>
            </div>
            <div className="glass-surface flex size-8 shrink-0 items-center justify-center rounded-full">
              <ArrowRight size={15} className="text-ink-muted" />
            </div>
          </div>

          <ol className="space-y-4">
            {items.map((item, index) => (
              <li key={`${item.time}-${item.activity}`} className="flex items-start gap-3">
                <div className="flex w-12 shrink-0 flex-col items-start pt-0.5">
                  <span className={`text-xs font-semibold ${index === 0 ? "text-accent-strong" : "text-ink"}`}>
                    {item.time}
                  </span>
                </div>
                <div className="relative flex flex-col items-center self-stretch">
                  {index === 0 ? (
                    <span className="size-2.5 rounded-full bg-accent-strong ring-2 ring-accent/25" />
                  ) : (
                    <span className="size-2 rounded-full bg-ink/15" />
                  )}
                  {index < items.length - 1 && <span className="mt-1 w-px flex-1 bg-ink/10" />}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-sm font-medium text-ink">{item.activity}</p>
                  {item.location && <p className="mt-0.5 text-xs text-ink-faint">{item.location}</p>}
                </div>
              </li>
            ))}
          </ol>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
