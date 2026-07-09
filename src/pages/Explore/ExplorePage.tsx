import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Landmark,
  Map,
  PiggyBank,
  Route,
  ShoppingBag,
  StickyNote,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageLoadingGate } from "@/components/layout";
import { GlassCard } from "@/components/ui";
import { sampleTrip } from "@/data/sample-trip";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/paths";

interface ExploreCardItem {
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  to?: string;
  featured?: boolean;
}

const EXPLORE_ITEMS: ExploreCardItem[] = [
  {
    titleKey: "explorePage.items.itinerary.title",
    subtitleKey: "explorePage.items.itinerary.subtitle",
    icon: CalendarDays,
    to: ROUTES.itinerary,
    featured: true,
  },
  {
    titleKey: "explorePage.items.map.title",
    subtitleKey: "explorePage.items.map.subtitle",
    icon: Map,
    to: ROUTES.map,
    featured: true,
  },
  {
    titleKey: "explorePage.items.restaurants.title",
    subtitleKey: "explorePage.items.restaurants.subtitle",
    icon: UtensilsCrossed,
    to: ROUTES.food,
    featured: true,
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
    to: ROUTES.memories,
  },
];

function safeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="sm" className="h-full">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold text-ink">{value}</span>
            <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-ink-muted">{label}</span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
            <Icon size={17} />
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ExploreDashboardCard({ item }: { item: ExploreCardItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const disabled = !item.to;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <span className="flex items-center gap-2">
          {disabled && (
            <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.625rem] font-bold text-accent-strong">
              {t("explorePage.soon")}
            </span>
          )}
          {!disabled && <ChevronRight size={19} className="text-ink-faint" />}
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <h2 className="text-base font-bold leading-tight text-ink">{t(item.titleKey)}</h2>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{t(item.subtitleKey)}</p>
      </div>
    </>
  );
  const className = cn(
    "block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
    disabled && "pointer-events-none opacity-70",
  );

  return (
    <motion.div variants={riseIn}>
      {item.to ? (
        <Link to={item.to} className={className}>
          <GlassCard interactive elevated={item.featured} padding="md" className="h-full">
            {content}
          </GlassCard>
        </Link>
      ) : (
        <GlassCard padding="md" className="h-full opacity-80">
          {content}
        </GlassCard>
      )}
    </motion.div>
  );
}

export function ExplorePage() {
  const { t } = useTranslation();
  const { remaining } = usePersistentBudget({
    defaultTotalBudget: sampleTrip.budget.totalMax,
    defaultCurrency: sampleTrip.budget.currency,
  });
  const savedPlaces = safeNumber(sampleTrip.itinerary.reduce((sum, day) => sum + (day.highlights?.length ?? 0), 0));
  const activities = safeNumber(sampleTrip.itinerary.reduce((sum, day) => sum + (day.timeline?.length ?? 0), 0));
  const budgetLeft = safeNumber(remaining);
  const featuredItems = EXPLORE_ITEMS.filter((item) => item.featured);
  const secondaryItems = EXPLORE_ITEMS.filter((item) => !item.featured);

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-4 pb-28">
        <motion.header variants={riseIn} className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("nav.explore")}</p>
          <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-tight text-ink">{t("nav.explore")}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t("explorePage.subtitle")}</p>
        </motion.header>

        <div className="grid grid-cols-2 gap-2.5 px-5">
          <StatCard label={t("explorePage.stats.days")} value={`${sampleTrip.days}`} icon={CalendarDays} />
          <StatCard label={t("explorePage.stats.savedPlaces")} value={`${savedPlaces}`} icon={Landmark} />
          <StatCard label={t("explorePage.stats.activities")} value={`${activities}`} icon={Route} />
          <StatCard label={t("explorePage.stats.budgetLeft")} value={budgetLeft.toLocaleString()} icon={PiggyBank} />
        </div>

        <div className="grid gap-3 px-5">
          {featuredItems.map((item) => (
            <ExploreDashboardCard key={item.titleKey} item={item} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 px-5">
          {secondaryItems.map((item) => (
            <ExploreDashboardCard key={item.titleKey} item={item} />
          ))}
        </div>
      </motion.div>
    </PageLoadingGate>
  );
}

export default ExplorePage;
