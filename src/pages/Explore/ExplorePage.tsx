import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Landmark,
  Map,
  ShoppingBag,
  StickyNote,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageLoadingGate } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/paths";

interface ExploreCardItem {
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  to?: string;
}

const EXPLORE_ITEMS: ExploreCardItem[] = [
  {
    titleKey: "explorePage.items.itinerary.title",
    subtitleKey: "explorePage.items.itinerary.subtitle",
    icon: CalendarDays,
    to: ROUTES.itinerary,
  },
  {
    titleKey: "explorePage.items.map.title",
    subtitleKey: "explorePage.items.map.subtitle",
    icon: Map,
    to: ROUTES.map,
  },
  {
    titleKey: "explorePage.items.restaurants.title",
    subtitleKey: "explorePage.items.restaurants.subtitle",
    icon: UtensilsCrossed,
    to: ROUTES.food,
  },
  {
    titleKey: "explorePage.items.shopping.title",
    subtitleKey: "explorePage.items.shopping.subtitle",
    icon: ShoppingBag,
  },
  {
    titleKey: "explorePage.items.attractions.title",
    subtitleKey: "explorePage.items.attractions.subtitle",
    icon: Landmark,
    to: ROUTES.places,
  },
  {
    titleKey: "explorePage.items.notes.title",
    subtitleKey: "explorePage.items.notes.subtitle",
    icon: StickyNote,
  },
];

function ExploreMenuCard({ item }: { item: ExploreCardItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const content = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block text-base font-bold leading-tight text-ink">{t(item.titleKey)}</span>
          {!item.to && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-bold text-accent-strong">
              {t("explorePage.soon")}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{t(item.subtitleKey)}</span>
      </span>
      {item.to && <ChevronRight size={20} className="shrink-0 text-ink-faint" />}
    </>
  );
  const className = cn(
    "flex items-center gap-4 rounded-[1.65rem] border border-white/70 bg-white/86 p-4",
    "shadow-[0_18px_48px_-34px_rgba(217,79,120,0.7)] transition active:scale-[0.99]",
    "dark:border-white/10 dark:bg-white/8",
    !item.to && "opacity-70",
  );

  return (
    <motion.div variants={riseIn}>
      {item.to ? (
        <Link to={item.to} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </motion.div>
  );
}

export function ExplorePage() {
  const { t } = useTranslation();

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5 pb-8">
        <header className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("nav.explore")}</p>
          <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-tight text-ink">{t("explorePage.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {t("explorePage.subtitle")}
          </p>
        </header>

        <div className="grid gap-3 px-5">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreMenuCard key={item.titleKey} item={item} />
          ))}
        </div>
      </motion.div>
    </PageLoadingGate>
  );
}

export default ExplorePage;
