import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { DataErrorState, GlassCard, MapActionButtons, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { samplePlaces } from "@/data/sample-places";
import { staggerContainer } from "@/design-system/motion";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslation } from "@/i18n";
import { createMapTarget } from "@/lib/maps";
import { ROUTES } from "@/router/paths";

import { InfoStatGrid } from "./components/InfoStatGrid";
import { NearbyPlacesRow } from "./components/NearbyPlacesRow";
import { OpeningHoursCard } from "./components/OpeningHoursCard";
import { PlaceDetailSkeleton } from "./components/PlaceDetailSkeleton";
import { PlaceHero } from "./components/PlaceHero";
import { PlaceSelector } from "./components/PlaceSelector";

export function PlacesPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [selectedId, setSelectedId] = useState(samplePlaces[0]?.id ?? "");
  const place = samplePlaces.find((p) => p.id === selectedId) ?? samplePlaces[0];
  const { isPlaceFavorite, togglePlaceFavorite } = useFavorites();

  useEffect(() => {
    if (pathname !== ROUTES.places) {
      setSelectedId("");
    }
  }, [pathname]);

  if (samplePlaces.length === 0) {
    return (
      <PageAccent tone="green">
        <DataErrorState titleKey="places.unavailableTitle" descriptionKey="places.unavailableDescription" />
      </PageAccent>
    );
  }

  if (!place) {
    return (
      <PageAccent tone="green">
        <DataErrorState titleKey="places.unavailableTitle" descriptionKey="places.unavailableDescription" />
      </PageAccent>
    );
  }

  return (
    <PageAccent tone="green">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative z-0 flex flex-col gap-6 pb-32">
        <PageHeader
          title={t("places.title")}
          subtitle={t("places.subtitle", { count: samplePlaces.length })}
          actions={<ThemeToggle />}
        />

        <PlaceSelector places={samplePlaces} selectedId={selectedId} onSelect={setSelectedId} />

        <PageLoadingGate skeleton={<PlaceDetailSkeleton />}>
          <motion.div key={place.id} variants={staggerContainer} initial="hidden" animate="visible" className="relative z-0 flex flex-col gap-6">
            <PlaceHero place={place} />
            <GlassCard padding="md" className="mx-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-ink-muted">{t("places.navigation")}</p>
                  <p className="text-sm font-semibold text-ink">{place.name}</p>
                </div>
                <button
                  onClick={() => togglePlaceFavorite(place.id)}
                  className="rounded-pill bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong"
                >
                  {isPlaceFavorite(place.id) ? t("common.favorited") : t("common.favorite")}
                </button>
              </div>
              <MapActionButtons
                target={createMapTarget({ name: place.name, address: place.address, city: place.city })}
              />
            </GlassCard>
            <InfoStatGrid place={place} />
            <OpeningHoursCard place={place} />
            <NearbyPlacesRow nearby={place.nearby} />
          </motion.div>
        </PageLoadingGate>
      </motion.div>
    </PageAccent>
  );
}

export default PlacesPage;
