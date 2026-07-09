import { motion } from "framer-motion";
import { FileText, Hotel, ListChecks, Plane, Route, type LucideIcon } from "lucide-react";
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
  { to: ROUTES.travelWallet, labelKey: "quickActions.documents", icon: FileText },
  { to: ROUTES.flights, labelKey: "quickActions.flightFiles", icon: Plane },
  { to: ROUTES.hotel, labelKey: "quickActions.hotel", icon: Hotel },
  { to: ROUTES.itinerary, labelKey: "quickActions.itinerary", icon: Route },
  { to: ROUTES.checklist, labelKey: "quickActions.checklist", icon: ListChecks },
];

export function QuickActionsGrid() {
  const { t } = useTranslation();

  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-5 gap-2 px-5">
      {ACTIONS.map(({ to, labelKey, icon: Icon }) => (
        <motion.div key={to} variants={riseIn}>
          <Link to={to} className="flex flex-col items-center gap-2">
            <span className="glass-surface glass-shadow flex size-12 items-center justify-center rounded-2xl text-accent-strong transition-transform active:scale-[0.96]">
              <Icon size={19} strokeWidth={1.85} />
            </span>
            <span className="max-w-[3.9rem] text-center text-[0.625rem] font-semibold leading-tight text-ink-muted">
              {t(labelKey)}
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
