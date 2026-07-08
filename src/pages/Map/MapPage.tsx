import { ExternalLink, LocateFixed, MapPinned, Navigation, Search, Star } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageAccent, PageLoadingGate } from "@/components/layout";
import { EmptyState, ThemeToggle, TripImage } from "@/components/ui";
import { samplePlaces } from "@/data/sample-places";
import { sampleTrip } from "@/data/sample-trip";
import { useTranslation } from "@/i18n";
import { getGoogleMapsApiKey } from "@/lib/googleMaps";
import { buildDirectionsUrl, createMapTarget, type MapTarget } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/place";

import { MapCanvas, type GoogleMapPlace, type MapPlaceCategory } from "./components/MapCanvas";

type PlaceCategory = Exclude<MapPlaceCategory, "nearby">;

const CATEGORIES: Array<{ value: PlaceCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "attractions", label: "Attractions" },
  { value: "food", label: "Food" },
  { value: "cafe", label: "Cafe" },
  { value: "shopping", label: "Shopping" },
  { value: "transport", label: "Transport" },
  { value: "hotel", label: "Hotel" },
];

function getPlaceCategory(place: Place): PlaceCategory {
  const value = place.category.toLowerCase();
  if (value.includes("food") || value.includes("restaurant")) return "food";
  if (value.includes("cafe") || value.includes("coffee")) return "cafe";
  if (value.includes("shop") || value.includes("mall") || value.includes("market")) return "shopping";
  if (value.includes("station") || value.includes("transport") || value.includes("airport")) return "transport";
  if (value.includes("hotel")) return "hotel";
  return "attractions";
}

function getTripPlaceTarget(place: Place): MapTarget {
  return createMapTarget({
    name: place.name,
    address: place.address,
    city: place.city,
  });
}

function getMapPlaceTarget(place: GoogleMapPlace): MapTarget {
  return {
    name: place.name,
    address: place.address,
    latitude: place.lat,
    longitude: place.lng,
    query: [place.name, place.address].filter(Boolean).join(", "),
  };
}

function openDirections(target: MapTarget) {
  window.open(buildDirectionsUrl(target, "google"), "_blank", "noreferrer");
}

function PlaceListItem({ place }: { place: Place }) {
  return (
    <article className="glass-surface glass-shadow overflow-hidden rounded-2xl">
      <div className="flex gap-3 p-3">
        <TripImage seed={place.photoSeed} alt="" icon={MapPinned} className="size-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{place.name}</h2>
              <p className="mt-1 truncate text-xs font-medium text-ink-muted">{place.category}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-strong">
              <Star size={11} className="fill-current" />
              {place.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">{place.address}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/30 px-3 py-2.5 dark:border-white/10">
        <span className="truncate text-xs font-semibold text-ink-muted">
          {place.day ? `Day ${place.day}` : place.city}
        </span>
        <a
          href={buildDirectionsUrl(getTripPlaceTarget(place), "google")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-pill bg-gradient-to-b from-accent to-accent-strong px-3 text-xs font-semibold text-accent-contrast"
        >
          <Navigation size={14} />
          Open in Google Maps
        </a>
      </div>
    </article>
  );
}

function SearchResultCard({ place, active, onSelect }: { place: GoogleMapPlace; active: boolean; onSelect: () => void }) {
  return (
    <article
      className={cn(
        "glass-surface glass-shadow flex items-center gap-3 rounded-2xl p-3",
        active && "ring-2 ring-accent/60",
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="line-clamp-1 text-sm font-semibold text-ink">{place.name}</p>
        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{place.address ?? place.category}</p>
        <p className="mt-1 text-xs font-semibold text-accent-strong">
          {place.rating ? `${place.rating.toFixed(1)} rating` : "Map result"}
        </p>
      </button>
      <button
        type="button"
        onClick={() => openDirections(getMapPlaceTarget(place))}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-pill bg-gradient-to-b from-accent to-accent-strong px-3 text-xs font-semibold text-accent-contrast"
      >
        <ExternalLink size={14} />
        Open
      </button>
    </article>
  );
}

export function MapPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("all");
  const [centerRequest, setCenterRequest] = useState(0);
  const [notice, setNotice] = useState("");
  const [mapPlaces, setMapPlaces] = useState<GoogleMapPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GoogleMapPlace | null>(null);
  const hasApiKey = Boolean(getGoogleMapsApiKey());

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return samplePlaces.filter((place) => {
      const matchesCategory = category === "all" || getPlaceCategory(place) === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [place.name, place.city, place.category, place.address, place.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const handlePlacesChange = useCallback((places: GoogleMapPlace[]) => {
    setMapPlaces(places);
    setSelectedPlace((current) => {
      if (!current) return current;
      return places.some((place) => place.id === current.id) ? current : null;
    });
  }, []);

  const handleUserLocationChange = useCallback(() => undefined, []);

  const firstPlace = filteredPlaces[0] ?? samplePlaces[0];
  const hasPlaces = samplePlaces.length > 0;

  return (
    <PageLoadingGate>
      <PageAccent tone="blue">
        <div className="flex min-h-full flex-col gap-5 px-5 py-4 pb-28">
          <header className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-accent-strong">{sampleTrip.subtitle}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">{t("map.title")}</h1>
            </div>
            <ThemeToggle className="shrink-0" />
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedQuery(query.trim());
            }}
            className="glass-surface-strong glass-shadow flex h-12 items-center gap-2 rounded-pill px-4"
          >
            <Search size={17} className="shrink-0 text-ink-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cafe, restaurant, 7-eleven, hotel..."
              className="min-w-0 flex-1 bg-transparent text-[0.95rem] font-medium text-ink outline-none placeholder:text-ink-faint"
            />
            <button type="submit" className="text-xs font-bold text-accent-strong">
              Search
            </button>
          </form>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => {
                  setCategory(item.value);
                  setSubmittedQuery(query.trim());
                }}
                className={cn(
                  "h-9 shrink-0 rounded-pill px-3.5 text-xs font-semibold transition-colors",
                  category === item.value
                    ? "pill-glow bg-gradient-to-b from-accent to-accent-strong text-accent-contrast"
                    : "glass-surface glass-shadow text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className="glass-surface-strong glass-shadow overflow-hidden rounded-3xl">
            {hasApiKey ? (
              <>
                <div className="h-[22rem] min-h-80">
                  <MapCanvas
                    places={mapPlaces}
                    selectedId={selectedPlace?.id}
                    searchQuery={submittedQuery}
                    category={category}
                    mapStyle="standard"
                    centerRequest={centerRequest}
                    onSelect={setSelectedPlace}
                    onPlacesChange={handlePlacesChange}
                    onUserLocationChange={handleUserLocationChange}
                    onNotice={setNotice}
                    className="h-full"
                  />
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNotice("Requesting your current location...");
                        setCenterRequest((value) => value + 1);
                      }}
                      className="glass-surface glass-shadow inline-flex h-10 items-center gap-2 rounded-pill px-3 text-xs font-semibold text-ink"
                    >
                      <LocateFixed size={15} className="text-accent-strong" />
                      Use current location
                    </button>
                    {selectedPlace && (
                      <button
                        type="button"
                        onClick={() => openDirections(getMapPlaceTarget(selectedPlace))}
                        className="inline-flex h-10 items-center gap-2 rounded-pill bg-ink px-3 text-xs font-semibold text-bg"
                      >
                        <ExternalLink size={14} />
                        Open in Google Maps
                      </button>
                    )}
                  </div>
                  {notice && <p className="rounded-2xl bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-strong">{notice}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="relative min-h-52">
                  <TripImage
                    seed={firstPlace?.photoSeed ?? "trip-hero"}
                    alt=""
                    icon={MapPinned}
                    priority
                    className="absolute inset-0 size-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="inline-flex items-center gap-2 rounded-pill bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">
                      <MapPinned size={13} />
                      Map is not available right now
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight">Use external Google Maps for live navigation</h2>
                    <p className="mt-1 text-sm font-medium text-white/80">Saved trip places are still available below.</p>
                  </div>
                </div>
                {firstPlace && (
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{firstPlace.name}</p>
                      <p className="truncate text-xs text-ink-muted">{firstPlace.address}</p>
                    </div>
                    <a
                      href={buildDirectionsUrl(getTripPlaceTarget(firstPlace), "google")}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-pill bg-ink px-3 text-xs font-semibold text-bg"
                    >
                      <ExternalLink size={14} />
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </>
            )}
          </section>

          {hasApiKey && mapPlaces.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-accent-strong">Map results</p>
                <h2 className="text-lg font-semibold text-ink">{mapPlaces.length} places found</h2>
              </div>
              <div className="flex flex-col gap-3">
                {mapPlaces.map((place) => (
                  <SearchResultCard
                    key={place.id}
                    place={place}
                    active={selectedPlace?.id === place.id}
                    onSelect={() => setSelectedPlace(place)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-accent-strong">Trip places</p>
                <h2 className="text-lg font-semibold text-ink">{filteredPlaces.length} saved places</h2>
              </div>
            </div>

            {hasPlaces ? (
              filteredPlaces.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredPlaces.map((place) => (
                    <PlaceListItem key={place.id} place={place} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Search}
                  title="No places found"
                  description="Try a different search or category."
                />
              )
            ) : (
              <EmptyState
                icon={MapPinned}
                title={t("empty.map.title")}
                description={t("empty.map.description")}
              />
            )}
          </section>
        </div>
      </PageAccent>
    </PageLoadingGate>
  );
}

export default MapPage;
