import { motion } from "framer-motion";
import { Hotel, Plane, Ticket } from "lucide-react";

import { GlassCard, SectionHeader, TripImage } from "@/components/ui";
import { flightsData, outboundFlight, returnFlight } from "@/data/flights";
import { hotelData } from "@/data/hotel";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useLocaleDateFormatter, useTranslation } from "@/i18n";

function formatShortDate(date: string, formatDate: Intl.DateTimeFormat) {
  return formatDate.format(new Date(`${date}T00:00:00`));
}

export function JourneyTicketsPanel() {
  const { t } = useTranslation();
  const formatDate = useLocaleDateFormatter();

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5">
      <motion.div variants={riseIn} className="grid grid-cols-2 gap-3 px-5">
        <GlassCard padding="md" className="flex flex-col gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <Ticket size={16} />
          </span>
          <p className="text-xs text-ink-muted">{t("flights.bookingReference")}</p>
          <p className="break-all text-sm font-semibold text-ink">{flightsData.bookingReference}</p>
        </GlassCard>
        <GlassCard padding="md" className="flex flex-col gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <Hotel size={16} />
          </span>
          <p className="text-xs text-ink-muted">{t("hotel.confirmationNo")}</p>
          <p className="break-all text-sm font-semibold text-ink">{hotelData.confirmationNo}</p>
        </GlassCard>
      </motion.div>

      <div className="flex flex-col gap-3.5">
        <SectionHeader title={t("flights.flightDetails")} />
        {[outboundFlight, returnFlight].map((flight) => (
          <motion.div key={flight.id} variants={riseIn} className="px-5">
            <GlassCard padding="md" className="flex flex-col gap-3">
              <TripImage
                seed={`airport-${flight.arrival.airportCode.toLowerCase()}`}
                icon={Plane}
                className="h-28 w-full rounded-2xl"
                iconClassName="size-8"
                alt={flight.arrival.airport}
              />
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-ink">
                  {flight.departure.airportCode} → {flight.arrival.airportCode}
                </p>
                <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong">
                  {flight.flightNumber}
                </span>
              </div>
              <p className="text-sm text-ink-muted">
                {formatShortDate(flight.departure.date, formatDate)} · {flight.departure.time}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        <SectionHeader title={t("hotel.title")} />
        <motion.div variants={riseIn} className="px-5">
          <GlassCard padding="md" className="flex flex-col gap-2">
            <p className="text-base font-semibold text-ink">{hotelData.name}</p>
            <p className="text-sm text-ink-muted">
              {formatShortDate(hotelData.checkIn.date, formatDate)} →{" "}
              {formatShortDate(hotelData.checkOut.date, formatDate)}
            </p>
            <p className="text-xs text-ink-faint">{hotelData.address}</p>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
