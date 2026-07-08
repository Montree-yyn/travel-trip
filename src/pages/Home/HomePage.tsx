import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Avatar, Button, SectionHeader, ThemeToggle } from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { sampleTrip } from "@/data/sample-trip";
import { sampleForecast, getTripDayForecast } from "@/data/sample-weather";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBudget } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import { calculateBudgetSummary } from "@/lib/budget";
import {
  getCurrentTripDay,
  getDaysUntilStart,
  getNextActivity,
  getRemainingTripDays,
  getTripProgressPercent,
} from "@/lib/trip-progress";
import { ROUTES } from "@/router/paths";

import { BudgetMiniCard } from "./components/BudgetMiniCard";
import { CoupleHeroCard } from "./components/CoupleHeroCard";
import { QuickActionsGrid } from "./components/QuickActionsGrid";
import { UpcomingActivityCard } from "./components/UpcomingActivityCard";
import { WeatherMiniCard } from "./components/WeatherMiniCard";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greeting.morning";
  if (hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { expenses } = usePersistentBudget();
  const currentDay = getCurrentTripDay(sampleTrip);
  const currentDayIndex = currentDay.dayNumber;
  const forecast = getTripDayForecast(currentDay.city, currentDay.date) ?? sampleForecast[0]!;
  const nextActivity = getNextActivity(currentDay);
  const countdownDays = getDaysUntilStart(sampleTrip);
  const remainingDays = getRemainingTripDays(sampleTrip);
  const progressPercent = countdownDays > 0 ? 0 : getTripProgressPercent(currentDayIndex, sampleTrip.days);
  const budgetSummary = calculateBudgetSummary({
    expenses,
    totalBudget: sampleTrip.budget.totalMax,
    tripDays: sampleTrip.itinerary,
  });

  return (
    <PageLoadingGate>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5 pb-8"
      >
        <motion.header variants={riseIn} className="flex items-start justify-between px-5 pt-3">
          <div className="min-w-0 pr-3">
            <p className="text-[2.125rem] font-bold leading-[1.1] tracking-tight text-ink">
              {t(getGreetingKey())}
            </p>
            <p className="mt-1.5 text-[0.9375rem] text-ink-muted">
              {t("home.subtitle", {
                companions: sampleTrip.companions.join(" & "),
                day: currentDayIndex,
                city: currentDay.city,
              })}
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

        <CoupleHeroCard
          trip={sampleTrip}
          currentDay={currentDayIndex}
          countdownDays={countdownDays}
          remainingDays={remainingDays}
          progressPercent={progressPercent}
        />

        <motion.div variants={riseIn} className="px-5">
          <WeatherMiniCard forecast={forecast} />
        </motion.div>

        <UpcomingActivityCard item={nextActivity} seed={currentDay.city} />

        <motion.div variants={riseIn} className="px-5">
          <BudgetMiniCard budget={sampleTrip.budget} spent={budgetSummary.totalSpent} />
        </motion.div>

        <motion.div variants={riseIn} className="px-5">
          <Button
            fullWidth
            size="lg"
            className="gap-2.5 shadow-none"
            onClick={() => navigate(ROUTES.itinerary)}
          >
            {t("home.continueJourney")}
            <ArrowRight size={18} strokeWidth={2.25} />
          </Button>
        </motion.div>

        <div className="flex flex-col gap-3">
          <SectionHeader title={t("home.quickActions")} />
          <QuickActionsGrid />
        </div>
      </motion.div>
    </PageLoadingGate>
  );
}

export default HomePage;
