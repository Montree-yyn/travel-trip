import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Landmark,
  Map,
  MapPin,
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
import { useTranslation } from "@/i18n";
import { getCurrentTripDay, getNextActivity } from "@/lib/trip-progress";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/paths";

interface ExploreCardItem {
  titleKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  to: string;
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
    to: ROUTES.search,
  },
  {
    titleKey: "explorePage.items.attractions.title",
    subtitleKey: "explorePage.items.attractions.subtitle",
    icon: Landmark,
    to: ROUTES.places,
  },
  {
    titleKey: "explorePage.items.documents.title",
    subtitleKey: "explorePage.items.documents.subtitle",
    icon: FileText,
    to: "/travel-wallet/documents/visit-japan-web",
  },
  {
    titleKey: "explorePage.items.notes.title",
    subtitleKey: "explorePage.items.notes.subtitle",
    icon: StickyNote,
    to: ROUTES.memories,
  },
];

function cleanValue(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
}

function TodayHighlightCard() {
  const { t } = useTranslation();
  const currentDay = getCurrentTripDay(sampleTrip);
  const activity = currentDay.timeline.length > 0 ? getNextActivity(currentDay) ?? currentDay.timeline[0] : undefined;
  const title = cleanValue(activity?.activity) || currentDay.title || t("explorePage.todayHighlight.fallbackTitle");
  const time = cleanValue(activity?.time) || t("explorePage.todayHighlight.anytime");
  const location = cleanValue(activity?.location) || currentDay.city || t("explorePage.todayHighlight.noLocation");
  const note = cleanValue(activity?.notes) || currentDay.theme || t("explorePage.todayHighlight.fallbackNote");

  return (
    <motion.div variants={riseIn} className="px-5">
      <Link to={ROUTES.itinerary} className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45">
        <GlassCard interactive padding="md" className="overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">
                {t("explorePage.todayHighlight.label")} · {t("budget.filters.dayOption", { day: currentDay.dayNumber })}
              </p>
              <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-ink">{title}</h2>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
              <CalendarDays size={20} />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 rounded-2xl bg-white/65 p-3 text-xs font-semibold text-ink-muted dark:bg-white/8">
            <Clock size={14} className="text-accent-strong" />
            <span className="truncate">{time}</span>
            <MapPin size={14} className="text-accent-strong" />
            <span className="truncate">{location}</span>
          </div>

          <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-ink-muted">{note}</p>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function ExploreDashboardCard({ item }: { item: ExploreCardItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const className = cn(
    "block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
  );

  return (
    <motion.div variants={riseIn}>
      <Link to={item.to} className={className}>
        <GlassCard interactive padding="sm" className="flex h-full min-h-[9.25rem] flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-white text-accent-strong dark:to-white/10">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-faint" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight text-ink">{t(item.titleKey)}</h2>
            <p className="mt-1 line-clamp-2 text-[0.6875rem] font-semibold leading-relaxed text-ink-muted">{t(item.subtitleKey)}</p>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function RecentActivitySection() {
  const { t } = useTranslation();
  const activities = sampleTrip.itinerary
    .flatMap((day) => day.timeline.map((item) => ({ ...item, dayNumber: day.dayNumber, city: day.city })))
    .slice(0, 3);

  return (
    <motion.section variants={riseIn} className="px-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">{t("explorePage.recentActivity")}</h2>
        <Link to={ROUTES.itinerary} className="text-xs font-bold text-accent-strong">
          {t("common.viewAll")}
        </Link>
      </div>
      <GlassCard padding="sm" className="flex flex-col gap-2">
        {activities.map((activity, index) => (
          <Link
            key={`${activity.dayNumber}-${activity.time}-${index}`}
            to={ROUTES.itinerary}
            className="flex items-center gap-3 rounded-2xl bg-white/65 p-2.5 transition hover:bg-white/85 active:scale-[0.99] dark:bg-white/8"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <Route size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-ink">{activity.activity}</span>
              <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-ink-muted">
                {activity.city} · {t("budget.filters.dayOption", { day: activity.dayNumber })}
              </span>
            </span>
            <ChevronRight size={16} className="text-ink-faint" />
          </Link>
        ))}
      </GlassCard>
    </motion.section>
  );
}

export function ExplorePage() {
  const { t } = useTranslation();

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-4 pb-28">
        <motion.header variants={riseIn} className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("nav.explore")}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink">{t("explorePage.title")}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t("explorePage.subtitle")}</p>
        </motion.header>

        <TodayHighlightCard />

        <div className="grid grid-cols-2 gap-3 px-5">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreDashboardCard key={item.titleKey} item={item} />
          ))}
        </div>

        <RecentActivitySection />
      </motion.div>
    </PageLoadingGate>
  );
}

export default ExplorePage;
