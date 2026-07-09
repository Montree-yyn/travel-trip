import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Home, MoreHorizontal, Wallet, type LucideIcon } from "lucide-react";

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
  activePaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, labelKey: "nav.home", icon: Home, end: true },
  {
    to: ROUTES.budget,
    labelKey: "nav.travelWallet",
    icon: Wallet,
    activePaths: [ROUTES.travelWallet, ROUTES.flights, ROUTES.hotel, "/travel-wallet/documents", "/more/documents"],
  },
  {
    to: ROUTES.explore,
    labelKey: "nav.explore",
    icon: Compass,
    activePaths: [ROUTES.itinerary, ROUTES.map, ROUTES.food, ROUTES.places],
  },
  { to: ROUTES.more, labelKey: "nav.more", icon: MoreHorizontal },
];

function isNavActive(pathname: string, to: string, end?: boolean, activePaths: string[] = []) {
  if (end) return pathname === to;
  return (
    pathname === to ||
    pathname.startsWith(`${to}/`) ||
    activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
}

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] md:max-w-lg lg:max-w-xl">
      <ul className="glass-surface-strong glass-shadow-lg pointer-events-auto flex items-center gap-0.5 rounded-pill p-1.5">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end, activePaths }) => {
          const isActive = isNavActive(pathname, to, end, activePaths);

          return (
            <motion.li key={to} whileTap={tapScaleFirm} transition={motionEasing.snappySpring}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onFocus={() => preloadRoute(to)}
                onPointerEnter={() => preloadRoute(to)}
                onTouchStart={() => preloadRoute(to)}
                onClick={() => navigate(to)}
                className="relative flex min-w-[4.65rem] flex-col items-center gap-0.5 rounded-pill px-3 py-2.5 focus-visible:outline-none"
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
