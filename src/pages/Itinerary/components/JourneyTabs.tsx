import { motion } from "framer-motion";

import { motionEasing } from "@/design-system/tokens";
import { tapScaleSubtle } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

export type JourneyTab = "itinerary" | "tickets" | "budget" | "checklist";

const TAB_KEYS: { value: JourneyTab; labelKey: string }[] = [
  { value: "itinerary", labelKey: "itinerary.title" },
  { value: "tickets", labelKey: "flights.title" },
  { value: "budget", labelKey: "budget.title" },
  { value: "checklist", labelKey: "checklist.title" },
];

export interface JourneyTabsProps {
  value: JourneyTab;
  onChange: (tab: JourneyTab) => void;
}

export function JourneyTabs({ value, onChange }: JourneyTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
      {TAB_KEYS.map(({ value: tabValue, labelKey }) => {
        const isActive = value === tabValue;
        return (
          <motion.button
            key={tabValue}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tabValue)}
            whileTap={tapScaleSubtle}
            transition={motionEasing.snappySpring}
            className={cn(
              "relative shrink-0 rounded-pill px-4 py-2 text-sm font-semibold",
              isActive ? "text-accent-contrast" : "glass-surface glass-shadow text-ink-muted",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="journey-tab-active"
                className="pill-glow absolute inset-0 rounded-pill bg-gradient-to-b from-accent to-accent-strong"
                transition={motionEasing.snappySpring}
              />
            )}
            <span className="relative z-10">{t(labelKey)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
