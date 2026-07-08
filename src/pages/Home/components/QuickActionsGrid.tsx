import { motion } from "framer-motion";
import { Camera, ListChecks, Map, Wallet, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";

interface QuickAction {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { to: ROUTES.map, labelKey: "quickActions.map", icon: Map },
  { to: ROUTES.budget, labelKey: "quickActions.budget", icon: Wallet },
  { to: ROUTES.checklist, labelKey: "quickActions.checklist", icon: ListChecks },
  { to: ROUTES.memories, labelKey: "quickActions.memories", icon: Camera },
];

export function QuickActionsGrid() {
  const { t } = useTranslation();

  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-4 gap-2.5 px-5">
      {ACTIONS.map(({ to, labelKey, icon: Icon }) => (
        <motion.div key={to} variants={riseIn}>
          <Link to={to} className="flex flex-col items-center gap-2">
            <span className="glass-surface glass-shadow flex size-[3.75rem] items-center justify-center rounded-2xl text-accent-strong transition-transform active:scale-[0.96]">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <span className="max-w-[4.5rem] text-center text-[0.6875rem] font-medium leading-tight text-ink-muted">
              {t(labelKey)}
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
