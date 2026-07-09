import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Hotel,
  MapPin,
  Plane,
  Ticket,
  TrainFront,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { Avatar, EmptyState, GlassCard, ProgressRing, SectionHeader, ThemeToggle, TripImage } from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { sampleTrip, tripSettings } from "@/data/sample-trip";
import { sampleForecast, getTripDayForecast } from "@/data/sample-weather";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateFormatter, useTranslation, type TranslateParams } from "@/i18n";
import { BUDGET_EXPENSE_CATEGORY_ICONS, sortExpensesByDate } from "@/lib/budget";
import {
  getCurrentTripDay,
  getDaysUntilStart,
  getNextActivity,
  getTripProgressPercent,
} from "@/lib/trip-progress";
import { WEATHER_ICONS } from "@/lib/weather";
import { ROUTES } from "@/router/paths";
import type { BudgetCurrency, BudgetExpense, BudgetWalletSummary } from "@/types/budget";
import type { FlightSegment } from "@/types/flight";
import type { HotelData } from "@/types/hotel";
import type { TimelineItem } from "@/types/trip";

import { QuickActionsGrid } from "./components/QuickActionsGrid";
import { TotalBudgetDialog } from "@/pages/Budget/components/TotalBudgetDialog";

function cleanValue(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
}

function parseDate(value?: string) {
  const dateValue = cleanValue(value);
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: string | undefined, formatter: Intl.DateTimeFormat) {
  const parsedDate = parseDate(date);
  return parsedDate ? formatter.format(parsedDate) : "";
}

function formatDateRange(start: string, end: string, formatter: Intl.DateTimeFormat) {
  const formattedStart = formatDate(start, formatter);
  const formattedEnd = formatDate(end, formatter);
  return formattedStart && formattedEnd ? `${formattedStart} / ${formattedEnd}` : "";
}

function getFlightDateTime(flight: FlightSegment) {
  const date = cleanValue(flight.departure.date);
  if (!date) return null;
  const parsedDate = new Date(`${date}T${cleanValue(flight.departure.time) || "00:00"}`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime();
}

function getNextFlight(flights: FlightSegment[]) {
  const now = Date.now();
  return [...flights]
    .map((flight) => ({ flight, time: getFlightDateTime(flight) }))
    .filter((item): item is { flight: FlightSegment; time: number } => item.time !== null && item.time >= now)
    .sort((a, b) => a.time - b.time)[0]?.flight ?? flights[0];
}

function getFlightSummary(flight: FlightSegment | undefined, t: (key: string, params?: TranslateParams) => string) {
  const departureCode = cleanValue(flight?.departure.airportCode);
  const arrivalCode = cleanValue(flight?.arrival.airportCode);
  if (!departureCode || !arrivalCode) return t("home.wallet.noUpcomingFlight");
  return `${departureCode} → ${arrivalCode}`;
}

function getHotelSummary(hotel: HotelData) {
  return cleanValue(hotel.name) || "Hotel";
}

function getActivitySummary(activity: TimelineItem | undefined, t: (key: string) => string) {
  return cleanValue(activity?.activity) || t("home.wallet.noActivityToday");
}

function getTrainSummary() {
  const leg = sampleTrip.transportLegs[0];
  if (!leg) return "Train route";
  return `${leg.from} → ${leg.to}`;
}

function tripCountdownText(countdownDays: number, currentDay: number, t: (key: string, params?: TranslateParams) => string) {
  if (countdownDays > 0) return t("home.status.daysToGo", { count: countdownDays });
  return t("home.status.dayNow", { day: currentDay });
}

function TripHeroCard({ tripDates }: { tripDates: string }) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="px-5">
      <Link to={ROUTES.itinerary}>
        <GlassCard interactive padding="none" className="flex overflow-hidden rounded-3xl">
          <TripImage seed="trip-hero" priority className="h-[6.5rem] w-[7rem] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
            <p className="truncate text-[0.6875rem] font-bold uppercase tracking-wide text-accent-strong">
              Osaka · Kyoto · Ine · Kobe
            </p>
            <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-ink">Kansai, Japan</h2>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-ink-muted">
              {tripDates} · {t("home.status.dayCount", { count: sampleTrip.days })}
            </p>
          </div>
          <span className="mr-3 flex items-center text-ink-faint">
            <ChevronRight size={18} />
          </span>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function StatusWeatherCard({
  countdownDays,
  currentDay,
  progressPercent,
}: {
  countdownDays: number;
  currentDay: number;
  progressPercent: number;
}) {
  const { t } = useTranslation();
  const currentDayData = getCurrentTripDay(sampleTrip);
  const forecast = getTripDayForecast(currentDayData.city, currentDayData.date) ?? sampleForecast[0]!;
  const WeatherIcon = WEATHER_ICONS[forecast.condition];

  return (
    <motion.div variants={riseIn} className="px-5">
      <GlassCard padding="md" className="grid grid-cols-[1fr_auto] gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("home.status.title")}</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {tripCountdownText(countdownDays, currentDay, t)}
          </p>
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-pill bg-ink/10">
              <div className="h-full rounded-pill bg-accent-strong" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-semibold text-ink-muted">
              {t("home.status.dayOfTotal", { current: currentDay, total: sampleTrip.days })}
            </p>
          </div>
        </div>
        <Link to={ROUTES.weather} className="min-w-[7.25rem] rounded-2xl bg-accent-soft/70 px-3 py-2.5 text-right">
          <WeatherIcon size={22} className="ml-auto text-accent-strong" />
          <p className="mt-1 text-xs font-bold text-accent-strong">{forecast.city}</p>
          <p className="text-xl font-bold leading-tight text-ink">{forecast.high}°C</p>
          <p className="text-[0.6875rem] font-semibold text-ink-muted">
            {t(`weatherConditions.${forecast.condition}`)}
          </p>
          <p className="text-[0.625rem] text-ink-faint">Feels {forecast.high}°</p>
        </Link>
      </GlassCard>
    </motion.div>
  );
}

function PlanItem({ to, icon: Icon, label, title }: { to: string; icon: LucideIcon; label: string; title: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-white/65 p-2.5 dark:bg-white/8">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.625rem] font-bold uppercase tracking-wide text-accent-strong">{label}</span>
        <span className="mt-0.5 block truncate text-xs font-bold text-ink">{title}</span>
      </span>
    </Link>
  );
}

function TodaysPlanSection({
  flight,
  hotel,
  activity,
}: {
  flight?: FlightSegment;
  hotel: HotelData;
  activity?: TimelineItem;
}) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-2.5">
      <SectionHeader
        title={t("home.todayPlan")}
        action={<Link to={ROUTES.itinerary} className="text-xs font-bold text-accent-strong">{t("common.viewAll")}</Link>}
      />
      <div className="px-5">
        <GlassCard padding="sm" className="grid grid-cols-2 gap-2.5">
          <PlanItem to={ROUTES.flights} icon={Plane} label={t("home.flight")} title={getFlightSummary(flight, t)} />
          <PlanItem to={ROUTES.hotel} icon={Hotel} label={t("home.hotel")} title={getHotelSummary(hotel)} />
          <PlanItem to={ROUTES.itinerary} icon={Ticket} label={t("home.attraction")} title={getActivitySummary(activity, t)} />
          <PlanItem to={ROUTES.transport} icon={TrainFront} label={t("home.trainRoute")} title={getTrainSummary()} />
        </GlassCard>
      </div>
    </motion.div>
  );
}

function CompactWalletCard({ wallet, onEdit }: { wallet: BudgetWalletSummary; onEdit: () => void }) {
  const { t } = useTranslation();
  const isThb = wallet.currency === "THB";

  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="glass-surface glass-shadow min-w-0 cursor-pointer rounded-3xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
      aria-label={`${t("budget.editTotalBudget")} ${wallet.currency}`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-accent-strong">{isThb ? "🇹🇭" : "🇯🇵"} {wallet.currency} Wallet</p>
          <p className="mt-1 truncate text-lg font-bold text-ink">{wallet.remaining.toLocaleString()}</p>
        </div>
        <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.625rem] font-bold text-accent-strong">
          {t("budget.editTotalBudget")}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0 text-[0.625rem] font-semibold leading-relaxed text-ink-muted">
          <p>{t("budget.spent")}: {wallet.totalSpent.toLocaleString()}</p>
          <p>{t("budget.totalBudget")}: {wallet.totalBudget.toLocaleString()}</p>
        </div>
        <ProgressRing value={wallet.spentPercent} size={42} strokeWidth={5}>
          <span className="text-[0.625rem] font-bold text-ink">{wallet.spentPercent}%</span>
        </ProgressRing>
      </div>
    </motion.button>
  );
}

function DualWalletSection({ wallets, onEdit }: { wallets: BudgetWalletSummary[]; onEdit: () => void }) {
  const { t } = useTranslation();
  const safeWallets = wallets.length > 0 ? wallets : ["THB", "JPY"].map((currency) => ({
    currency: currency as BudgetCurrency,
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    spentPercent: 0,
  }));

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-2.5">
      <SectionHeader title={t("budget.tripWallet")} action={<Link to={ROUTES.budget} className="text-xs font-bold text-accent-strong">{t("common.viewAll")}</Link>} />
      <div className="grid grid-cols-2 gap-2.5 px-5">
        {safeWallets.map((wallet) => (
          <CompactWalletCard key={wallet.currency} wallet={wallet} onEdit={onEdit} />
        ))}
      </div>
    </motion.div>
  );
}

function ExpenseRow({ expense }: { expense: BudgetExpense }) {
  const { t } = useTranslation();
  const formatDateShort = useLocaleDateFormatter();
  const Icon = BUDGET_EXPENSE_CATEGORY_ICONS[expense.category];

  return (
    <Link to={ROUTES.budget} className="flex items-center gap-3 rounded-2xl bg-white/65 p-2.5 dark:bg-white/8">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{expense.merchant || expense.title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">
          {t(`budget.categories.${expense.category}`)} · {formatDate(expense.date, formatDateShort)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.625rem] font-bold text-accent-strong">
          {expense.currency}
        </span>
        <span className="mt-1 block text-sm font-bold text-ink">{expense.amount.toLocaleString()}</span>
      </span>
    </Link>
  );
}

function LatestExpensesSection({ expenses }: { expenses: BudgetExpense[] }) {
  const { t } = useTranslation();
  const latestExpenses = sortExpensesByDate(expenses).slice(0, 3);

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-2.5">
      <SectionHeader
        title={t("home.latestExpenses")}
        action={<Link to={ROUTES.budget} className="text-xs font-bold text-accent-strong">{t("common.viewAll")}</Link>}
      />
      <div className="px-5">
        <GlassCard padding="sm" className="flex flex-col gap-2">
          {latestExpenses.length > 0 ? (
            latestExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={t("empty.budget.title")}
              description={t("empty.budget.description")}
            />
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const formatDateShort = useLocaleDateFormatter();
  const { bookings } = usePersistentBookings();
  const {
    currencyBudgets,
    expenses,
    walletSummaries,
    updateBudgetSettings,
  } = usePersistentBudget({
    defaultTotalBudget: sampleTrip.budget.totalMax,
    defaultCurrency: sampleTrip.budget.currency,
  });
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const currentDay = getCurrentTripDay(sampleTrip);
  const currentDayIndex = currentDay.dayNumber;
  const countdownDays = getDaysUntilStart(sampleTrip);
  const progressPercent = countdownDays > 0 ? 0 : getTripProgressPercent(currentDayIndex, sampleTrip.days);
  const nextFlight = getNextFlight(bookings.flights.segments);
  const nextActivity = currentDay.timeline.length > 0 ? getNextActivity(currentDay) : undefined;
  const tripDates = useMemo(
    () => formatDateRange(sampleTrip.dateRange.start, sampleTrip.dateRange.end, formatDateShort),
    [formatDateShort],
  );

  return (
    <PageLoadingGate>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 pb-8"
      >
        <motion.header variants={riseIn} className="flex items-center justify-between px-5 pt-4">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("home.greeting.morning")}</p>
            <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">{sampleTrip.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <MapPin size={13} className="shrink-0 text-accent-strong" />
              <span className="truncate">{tripSettings.destination}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link to={ROUTES.more}>
              <Avatar
                name={sampleTrip.companions[0] ?? t("common.traveler")}
                size="md"
                className="ring-2 ring-accent/30"
              />
            </Link>
          </div>
        </motion.header>

        <TripHeroCard tripDates={tripDates} />

        <StatusWeatherCard
          countdownDays={countdownDays}
          currentDay={currentDayIndex}
          progressPercent={progressPercent}
        />

        <TodaysPlanSection
          flight={nextFlight}
          hotel={bookings.hotel}
          activity={nextActivity}
        />

        <DualWalletSection wallets={walletSummaries} onEdit={() => setBudgetDialogOpen(true)} />

        <div className="flex flex-col gap-2.5">
          <SectionHeader title={t("home.quickActions")} />
          <QuickActionsGrid />
        </div>

        <LatestExpensesSection expenses={expenses} />

        <TotalBudgetDialog
          open={budgetDialogOpen}
          budgets={currencyBudgets}
          onClose={() => setBudgetDialogOpen(false)}
          onSave={updateBudgetSettings}
        />
      </motion.div>
    </PageLoadingGate>
  );
}

export default HomePage;
