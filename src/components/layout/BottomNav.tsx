import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Home, Map, Wallet, MoreHorizontal, type LucideIcon } from "lucide-react";

import { motionEasing } from "@/design-system/tokens";
import { tapScaleFirm } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import { preloadRoute } from "@/router/routePreload";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, labelKey: "nav.home", icon: Home, end: true },
  { to: ROUTES.itinerary, labelKey: "nav.itinerary", icon: CalendarDays },
  { to: ROUTES.map, labelKey: "nav.map", icon: Map },
  { to: ROUTES.budget, labelKey: "nav.budget", icon: Wallet },
  { to: ROUTES.more, labelKey: "nav.more", icon: MoreHorizontal },
];

function isNavActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] pointer-events-auto">
      <ul className="glass-surface-strong glass-shadow-lg pointer-events-auto flex items-center gap-0.5 rounded-pill p-1.5">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => {
          const isActive = isNavActive(pathname, to, end);

          return (
            <motion.li key={to} whileTap={tapScaleFirm} transition={motionEasing.snappySpring}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onFocus={() => preloadRoute(to)}
                onPointerEnter={() => preloadRoute(to)}
                onTouchStart={() => preloadRoute(to)}
                onClick={() => navigate(to)}
                className="relative flex flex-col items-center gap-0.5 rounded-pill px-4 py-2.5 focus-visible:outline-none"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="pill-glow absolute inset-0 rounded-pill bg-gradient-to-b from-accent to-accent-strong"
                    transition={motionEasing.snappySpring}
                  />
                )}
                <motion.span
                  className="relative z-10"
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={motionEasing.snappySpring}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={isActive ? "text-accent-contrast" : "text-ink-muted"}
                  />
                </motion.span>
                <span
                  className={`relative z-10 text-[0.6875rem] font-semibold leading-none transition-colors duration-200 ${
                    isActive ? "text-accent-contrast" : "text-ink-muted/75"
                  }`}
                >
                  {t(labelKey)}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
