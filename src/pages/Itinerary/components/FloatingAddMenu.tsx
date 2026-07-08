import { AnimatePresence, motion } from "framer-motion";
import {
  Hotel,
  Landmark,
  Plane,
  Plus,
  ShoppingBag,
  StickyNote,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { IconButton } from "@/components/ui";
import { tapScaleSubtle } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";

interface MenuItem {
  labelKey: string;
  icon: LucideIcon;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { labelKey: "filters.map.attractions", icon: Landmark, route: ROUTES.places },
  { labelKey: "food.title", icon: Utensils, route: ROUTES.food },
  { labelKey: "explore.hotel", icon: Hotel, route: ROUTES.hotel },
  { labelKey: "explore.flights", icon: Plane, route: ROUTES.flights },
  { labelKey: "filters.food.street-food", icon: ShoppingBag, route: ROUTES.food },
  { labelKey: "budget.fields.note", icon: StickyNote, route: ROUTES.memories },
];

export interface FloatingAddMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FloatingAddMenu({ open, onOpenChange }: FloatingAddMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleSelect(route: string) {
    onOpenChange(false);
    navigate(route);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-md justify-end px-5 md:max-w-lg lg:max-w-xl">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        <AnimatePresence>
          {open &&
            MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.labelKey}
                  type="button"
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ delay: index * 0.04, duration: 0.18 }}
                  whileTap={tapScaleSubtle}
                  onClick={() => handleSelect(item.route)}
                  className="glass-surface-strong glass-shadow flex items-center gap-2.5 rounded-pill py-2 pl-3 pr-4"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-semibold text-ink">{t(item.labelKey)}</span>
                </motion.button>
              );
            })}
        </AnimatePresence>

        <IconButton
          variant="solid"
          size="lg"
          aria-label={open ? t("budget.closeDialog") : t("budget.addExpense")}
          className="glow-accent"
          onClick={() => onOpenChange(!open)}
        >
          {open ? <X size={22} strokeWidth={2.25} /> : <Plus size={22} strokeWidth={2.25} />}
        </IconButton>
      </div>
    </div>
  );
}
