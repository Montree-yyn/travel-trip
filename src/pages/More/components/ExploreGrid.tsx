import { motion } from "framer-motion";
import {
  CloudSun,
  Coins,
  Heart,
  Hotel,
  Images,
  Landmark,
  ListChecks,
  Plane,
  Search,
  TrainFront,
  UtensilsCrossed,
  Languages,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";

interface ExploreItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

const ITEMS: ExploreItem[] = [
  { to: ROUTES.search, labelKey: "explore.search", icon: Search },
  { to: ROUTES.favorites, labelKey: "explore.favorites", icon: Heart },
  { to: ROUTES.food, labelKey: "explore.food", icon: UtensilsCrossed },
  { to: ROUTES.flights, labelKey: "explore.flights", icon: Plane },
  { to: ROUTES.hotel, labelKey: "explore.hotel", icon: Hotel },
  { to: ROUTES.places, labelKey: "explore.places", icon: Landmark },
  { to: ROUTES.transport, labelKey: "explore.transport", icon: TrainFront },
  { to: ROUTES.checklist, labelKey: "explore.checklist", icon: ListChecks },
  { to: ROUTES.weather, labelKey: "explore.weather", icon: CloudSun },
  { to: ROUTES.currency, labelKey: "explore.currency", icon: Coins },
  { to: ROUTES.translator, labelKey: "explore.translator", icon: Languages },
  { to: ROUTES.memories, labelKey: "explore.memories", icon: Images },
];

export function ExploreGrid() {
  const { t } = useTranslation();

  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-4 gap-3 px-5">
      {ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <motion.div key={to} variants={riseIn}>
          <Link to={to} className="flex flex-col items-center gap-1.5">
            <motion.span
              whileTap={{ scale: 0.92 }}
              className="glass-surface glass-shadow flex size-12 items-center justify-center rounded-2xl text-accent-strong"
            >
              <Icon size={19} strokeWidth={1.75} />
            </motion.span>
            <span className="text-[0.6875rem] font-medium text-ink-muted">{t(labelKey)}</span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
