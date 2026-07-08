import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock, Hotel, MapPin, Plane, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { TripBudgetCard } from "@/components/trip/TripBudgetCard";
import { Avatar, Chip, GlassCard, ProgressBar, SectionHeader, ThemeToggle } from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { sampleTrip, tripSettings } from "@/data/sample-trip";
import { sampleForecast, getTripDayForecast } from "@/data/sample-weather";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateFormatter, useTranslation, type TranslateParams } from "@/i18n";
import {
  getCurrentTripDay,
  getDaysUntilStart,
  getNextActivity,
  getRemainingTripDays,
  getTripProgressPercent,
} from "@/lib/trip-progress";
import { ROUTES } from "@/router/paths";
import type { FlightSegment } from "@/types/flight";
import type { HotelData } from "@/types/hotel";
import type { TimelineItem } from "@/types/trip";

import { QuickActionsGrid } from "./components/QuickActionsGrid";
import { WeatherMiniCard } from "./components/WeatherMiniCard";

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
  return formattedStart && formattedEnd ? `${formattedStart} → ${formattedEnd}` : "";
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
    .sort((a, b) => a.time - b.time)[0]?.flight;
}

function getFlightSummary(flight: FlightSegment | undefined, t: (key: string, params?: TranslateParams) => string) {
  const departureCode = cleanValue(flight?.departure.airportCode);
  const arrivalCode = cleanValue(flight?.arrival.airportCode);
  if (!departureCode || !arrivalCode) {
    return {
      title: t("home.wallet.noUpcomingFlight"),
      subtitle: "",
      meta: "",
    };
  }

  const airline = cleanValue(flight?.airline);
  const flightNumber = cleanValue(flight?.flightNumber);
  const departureTime = cleanValue(flight?.departure.time);
  const arrivalTime = cleanValue(flight?.arrival.time);

  return {
    title: `${departureCode} → ${arrivalCode}`,
    subtitle: [airline, flightNumber].filter(Boolean).join(" "),
    meta: departureTime && arrivalTime ? `${departureTime} → ${arrivalTime}` : "",
  };
}

function getHotelSummary(hotel: HotelData, formatter: Intl.DateTimeFormat) {
  return {
    title: cleanValue(hotel.name),
    subtitle: formatDateRange(hotel.checkIn.date, hotel.checkOut.date, formatter),
  };
}

function getActivitySummary(activity: TimelineItem | undefined, t: (key: string) => string) {
  const title = cleanValue(activity?.activity);
  return {
    title: title || t("home.wallet.noActivityToday"),
    subtitle: title && cleanValue(activity?.time) ? cleanValue(activity?.time) : "",
  };
}

function tripStatusText(
  countdownDays: number,
  remainingDays: number,
  currentDay: number,
  t: (key: string, params?: TranslateParams) => string,
) {
  if (countdownDays > 0) return t("home.status.daysToGo", { count: countdownDays });
  if (remainingDays <= 0) return t("home.status.complete");
  return t("home.status.dayNow", { day: currentDay });
}

function CountdownStatusCard({
  countdownDays,
  remainingDays,
  currentDay,
  progressPercent,
  t,
}: {
  countdownDays: number;
  remainingDays: number;
  currentDay: number;
  progressPercent: number;
  t: (key: string, params?: TranslateParams) => string;
}) {
  return (
    <motion.div variants={riseIn} className="px-5">
      <GlassCard elevated padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("home.status.title")}</p>
            <h2 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight text-ink">
              {tripStatusText(countdownDays, remainingDays, currentDay, t)}
            </h2>
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-contrast">
            <Clock size={22} />
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={progressPercent} />
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-ink-muted">
            <span>{t("home.status.dayOfTotal", { current: currentDay, total: sampleTrip.days })}</span>
            <span>{t("home.status.percentComplete", { percent: progressPercent })}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function WalletSummaryRow({
  to,
  icon: Icon,
  label,
  title,
  subtitle,
  meta,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 transition active:scale-[0.99] dark:bg-white/8">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] font-bold uppercase tracking-wide text-accent-strong">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-bold text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs font-semibold text-ink-muted">{subtitle}</span>}
        {meta && <span className="mt-0.5 block truncate text-xs text-ink-muted">{meta}</span>}
      </span>
      <ChevronRight size={17} className="shrink-0 text-ink-faint" />
    </Link>
  );
}

function TodaysTripCard({
  flight,
  hotel,
  activity,
  formatDateShort,
  t,
}: {
  flight?: FlightSegment;
  hotel: HotelData;
  activity?: TimelineItem;
  formatDateShort: Intl.DateTimeFormat;
  t: (key: string, params?: TranslateParams) => string;
}) {
  const flightSummary = getFlightSummary(flight, t);
  const hotelSummary = getHotelSummary(hotel, formatDateShort);
  const activitySummary = getActivitySummary(activity, t);

  return (
    <motion.div variants={riseIn} className="px-5">
      <GlassCard padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("home.wallet.title")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("home.wallet.subtitle")}</p>
          </div>
          <Link to={ROUTES.travelWallet}>
            <Chip tone="accent">{t("nav.travelWallet")}</Chip>
          </Link>
        </div>

        <WalletSummaryRow
          to={ROUTES.flights}
          icon={Plane}
          label={t("home.wallet.nextFlight")}
          title={flightSummary.title}
          subtitle={flightSummary.subtitle}
          meta={flightSummary.meta}
        />

        {hotelSummary.title && (
          <WalletSummaryRow
            to={ROUTES.hotel}
            icon={Hotel}
            label={t("home.wallet.hotel")}
            title={hotelSummary.title}
            subtitle={hotelSummary.subtitle}
          />
        )}

        <WalletSummaryRow
          to={ROUTES.itinerary}
          icon={Clock}
          label={t("home.wallet.nextActivity")}
          title={activitySummary.title}
          subtitle={activitySummary.subtitle}
        />
      </GlassCard>
    </motion.div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const formatDateShort = useLocaleDateFormatter();
  const { bookings } = usePersistentBookings();
  const {
    totalBudget,
    spent,
    remaining,
    currency,
    lastUpdated,
  } = usePersistentBudget({
    defaultTotalBudget: sampleTrip.budget.totalMax,
    defaultCurrency: sampleTrip.budget.currency,
  });
  const currentDay = getCurrentTripDay(sampleTrip);
  const currentDayIndex = currentDay.dayNumber;
  const forecast = getTripDayForecast(currentDay.city, currentDay.date) ?? sampleForecast[0]!;
  const countdownDays = getDaysUntilStart(sampleTrip);
  const remainingDays = getRemainingTripDays(sampleTrip);
  const progressPercent = countdownDays > 0 ? 0 : getTripProgressPercent(currentDayIndex, sampleTrip.days);
  const nextFlight = getNextFlight(bookings.flights.segments);
  const nextActivity = currentDay.timeline.length > 0 ? getNextActivity(currentDay) : undefined;
  const tripDates = formatDateRange(sampleTrip.dateRange.start, sampleTrip.dateRange.end, formatDateShort);

  return (
    <PageLoadingGate>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5 pb-8"
      >
        <motion.header variants={riseIn} className="flex items-start justify-between px-5 pt-4">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">Home</p>
            <h1 className="mt-1 text-[1.9rem] font-bold leading-tight tracking-tight text-ink">{sampleTrip.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin size={14} className="shrink-0 text-accent-strong" />
              <span className="truncate">{tripSettings.destination}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <CalendarDays size={14} className="shrink-0 text-accent-strong" />
              <span>{tripDates} · {t("home.status.dayCount", { count: sampleTrip.days })}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
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

        <CountdownStatusCard
          countdownDays={countdownDays}
          remainingDays={remainingDays}
          currentDay={currentDayIndex}
          progressPercent={progressPercent}
          t={t}
        />

        <motion.div variants={riseIn} className="px-5">
          <WeatherMiniCard forecast={forecast} />
        </motion.div>

        <TodaysTripCard
          flight={nextFlight}
          hotel={bookings.hotel}
          activity={nextActivity}
          formatDateShort={formatDateShort}
          t={t}
        />

        <TripBudgetCard
          totalBudget={totalBudget}
          spent={spent}
          remaining={remaining}
          currency={currency}
          lastUpdated={lastUpdated}
        />

        <div className="flex flex-col gap-3">
          <SectionHeader title={t("home.quickActions")} />
          <QuickActionsGrid />
        </div>
      </motion.div>
    </PageLoadingGate>
  );
}

export default HomePage;
