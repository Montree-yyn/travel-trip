import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import type { FlightSegment } from "@/types/flight";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FlightMiniCard({ flight }: { flight: FlightSegment }) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="flex-1">
      <Link to={ROUTES.flights}>
        <GlassCard interactive padding="md" className="h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">{t("home.flight")}</span>
            <Plane size={18} className="text-accent-strong" />
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">
            {flight.departure.airportCode} → {flight.arrival.airportCode}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {formatDate(flight.departure.date)} · {flight.flightNumber}
          </p>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
