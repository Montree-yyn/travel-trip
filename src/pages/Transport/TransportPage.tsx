import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";

import { DataErrorState, SectionHeader, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { icocaTip, sampleTransportRoutes, sampleTransportStations } from "@/data/sample-transport";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

import { StationCard } from "./components/StationCard";
import { TransportRouteCard } from "./components/TransportRouteCard";

export function TransportPage() {
  const { t } = useTranslation();
  const days = Array.from(new Set(sampleTransportRoutes.map((r) => r.day))).sort((a, b) => (a ?? 0) - (b ?? 0));

  if (sampleTransportRoutes.length === 0 && sampleTransportStations.length === 0) {
    return (
      <PageAccent tone="indigo">
        <DataErrorState />
      </PageAccent>
    );
  }

  return (
    <PageAccent tone="indigo">
      <PageLoadingGate>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
          <PageHeader title={t("transport.title")} subtitle={t("transport.subtitle")} actions={<ThemeToggle />} />

          <motion.div variants={riseIn} className="glass-shadow mx-5 flex gap-3 rounded-2xl bg-accent-soft p-4">
            <CreditCard size={18} className="mt-0.5 shrink-0 text-accent-strong" />
            <p className="text-xs leading-relaxed text-accent-strong">{icocaTip}</p>
          </motion.div>

          {days.map((day) => (
            <div key={day} className="flex flex-col gap-3.5">
              <SectionHeader title={t("transport.daySection", { day: day ?? 0 })} />
              <div className="flex flex-col gap-3">
                {sampleTransportRoutes
                  .filter((r) => r.day === day)
                  .map((route) => (
                    <TransportRouteCard key={route.id} route={route} />
                  ))}
              </div>
            </div>
          ))}

          {sampleTransportStations.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <SectionHeader title={t("transport.keyStations")} />
              <motion.div variants={staggerContainer} className="no-scrollbar flex gap-3 overflow-x-auto px-5">
                {sampleTransportStations.map((station) => (
                  <StationCard key={station.id} station={station} />
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </PageLoadingGate>
    </PageAccent>
  );
}

export default TransportPage;
