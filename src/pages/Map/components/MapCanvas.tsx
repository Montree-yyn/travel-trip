import { Loader, LocateFixed, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getGoogleMapsApiKey, loadGoogleMaps } from "@/lib/googleMaps";
import { cn } from "@/lib/utils";

export type MapPlaceCategory =
  | "all"
  | "attractions"
  | "food"
  | "cafe"
  | "shopping"
  | "transport"
  | "hotel"
  | "nearby";

export interface GoogleMapPlace {
  id: string;
  placeId?: string;
  name: string;
  category: MapPlaceCategory;
  rating?: number;
  distanceMeters?: number;
  distanceLabel?: string;
  openNow?: boolean;
  address?: string;
  phone?: string;
  website?: string;
  photoUrl?: string;
  lat: number;
  lng: number;
  source: "google" | "trip";
  openingHours?: string[];
}

export interface MapCanvasProps {
  places: GoogleMapPlace[];
  selectedId?: string;
  searchQuery: string;
  category: MapPlaceCategory;
  mapStyle: "standard" | "satellite";
  centerRequest: number;
  onSelect: (place: GoogleMapPlace) => void;
  onPlacesChange: (places: GoogleMapPlace[]) => void;
  onUserLocationChange: (location: google.maps.LatLngLiteral | null) => void;
  onNotice?: (message: string) => void;
  className?: string;
}

const DEFAULT_CENTER = { lat: 34.6937, lng: 135.5023 };
const DEFAULT_ZOOM = 13;

const categoryKeywords: Record<MapPlaceCategory, string> = {
  all: "tourist attractions restaurants cafes shopping transport hotels",
  attractions: "tourist attractions",
  food: "restaurants",
  cafe: "coffee cafe",
  shopping: "shopping mall store",
  transport: "train station bus station transit",
  hotel: "hotel",
  nearby: "nearby",
};

const standardMapStyles: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#b8d7f2" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f6f2eb" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
];

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
  const earthRadius = 6371000;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters?: number) {
  if (typeof meters !== "number") return undefined;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function inferCategory(place: google.maps.places.PlaceResult): MapPlaceCategory {
  const types = place.types ?? [];
  if (types.some((type) => ["restaurant", "meal_takeaway", "meal_delivery", "bakery"].includes(type))) return "food";
  if (types.some((type) => ["cafe"].includes(type))) return "cafe";
  if (types.some((type) => ["shopping_mall", "department_store", "store", "convenience_store"].includes(type))) return "shopping";
  if (types.some((type) => ["train_station", "subway_station", "bus_station", "transit_station"].includes(type))) return "transport";
  if (types.some((type) => ["lodging"].includes(type))) return "hotel";
  return "attractions";
}

function getMarkerIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function clusterPlaces(places: GoogleMapPlace[], zoom: number) {
  if (zoom >= 16 || places.length < 4) return places.map((place) => ({ center: place, places: [place] }));
  const threshold = zoom < 12 ? 0.03 : 0.011;
  const clusters: Array<{ center: GoogleMapPlace; places: GoogleMapPlace[] }> = [];

  for (const place of places) {
    const cluster = clusters.find(
      (item) => Math.abs(item.center.lat - place.lat) < threshold && Math.abs(item.center.lng - place.lng) < threshold,
    );
    if (cluster) cluster.places.push(place);
    else clusters.push({ center: place, places: [place] });
  }

  return clusters;
}

function mapGooglePlace(
  place: google.maps.places.PlaceResult,
  origin: google.maps.LatLngLiteral | null,
): GoogleMapPlace | null {
  const location = place.geometry?.location;
  if (!location || !place.place_id || !place.name) return null;
  const latLng = { lat: location.lat(), lng: location.lng() };
  const distanceMeters = origin ? getDistanceMeters(origin, latLng) : undefined;

  return {
    id: place.place_id,
    placeId: place.place_id,
    name: place.name,
    category: inferCategory(place),
    rating: place.rating,
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    openNow: place.opening_hours?.isOpen?.() ?? place.opening_hours?.open_now,
    address: place.vicinity ?? place.formatted_address,
    photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 720 }),
    lat: latLng.lat,
    lng: latLng.lng,
    source: "google",
  };
}

function mergePlaceDetails(
  base: GoogleMapPlace,
  details: google.maps.places.PlaceResult | null,
): GoogleMapPlace {
  if (!details) return base;
  return {
    ...base,
    address: details.formatted_address ?? base.address,
    phone: details.formatted_phone_number ?? base.phone,
    website: details.website ?? base.website,
    openingHours: details.opening_hours?.weekday_text ?? base.openingHours,
    openNow: details.opening_hours?.isOpen?.() ?? details.opening_hours?.open_now ?? base.openNow,
    photoUrl: details.photos?.[0]?.getUrl({ maxWidth: 960 }) ?? base.photoUrl,
  };
}

export function MapCanvas({
  places,
  selectedId,
  searchQuery,
  category,
  mapStyle,
  centerRequest,
  onSelect,
  onPlacesChange,
  onUserLocationChange,
  onNotice,
  className,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const hasApiKey = Boolean(getGoogleMapsApiKey());
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() => (hasApiKey ? "loading" : "error"));
  const [error, setError] = useState(() => (hasApiKey ? "" : "Map unavailable"));
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const visiblePlaces = useMemo(() => {
    if (category === "all" || category === "nearby") return places;
    return places.filter((place) => place.category === category);
  }, [category, places]);

  useEffect(() => {
    let cancelled = false;
    if (!hasApiKey) {
      setStatus("error");
      setError("Map unavailable");
      onUserLocationChange(null);
      return;
    }

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        try {
          const map = new google.maps.Map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: "greedy",
            mapTypeControl: false,
            fullscreenControl: false,
            styles: standardMapStyles,
          });
          mapRef.current = map;
          placesServiceRef.current = new google.maps.places.PlacesService(map);
          map.addListener("zoom_changed", () => setZoom(map.getZoom() ?? DEFAULT_ZOOM));
          setStatus("ready");
        } catch {
          setStatus("error");
          setError("Map unavailable");
          onUserLocationChange(null);
        }
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Map unavailable");
        onUserLocationChange(null);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [hasApiKey, onUserLocationChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    try {
      map.setMapTypeId(mapStyle === "satellite" ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP);
      map.setOptions({ styles: mapStyle === "standard" ? standardMapStyles : null });
    } catch {
      setStatus("error");
      setError("Map unavailable");
    }
  }, [mapStyle, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || centerRequest === 0) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        onNotice?.("Using your current location.");
        setUserLocation(location);
        onUserLocationChange(location);
        try {
          map.panTo(location);
          map.setZoom(15);
          userMarkerRef.current?.setMap(null);
          userMarkerRef.current = new google.maps.Marker({
            map,
            position: location,
            clickable: false,
            zIndex: 1000,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#1976ff",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 4,
            },
          });
        } catch {
          setStatus("error");
          setError("Map unavailable");
        }
      },
      () => {
        onNotice?.("Location access was denied. You can still search and open directions.");
        onUserLocationChange(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [centerRequest, onNotice, onUserLocationChange, status]);

  useEffect(() => {
    const service = placesServiceRef.current;
    const map = mapRef.current;
    if (!service || !map || status !== "ready") return;

    if (!google.maps.places) {
      onNotice?.("Places search is not available right now. Trip places are still shown below.");
      onPlacesChange([]);
      return;
    }

    const query = searchQuery.trim();
    const center = userLocation ?? (map.getCenter()?.toJSON() ?? DEFAULT_CENTER);
    const request =
      query.length > 0
        ? ({ query, location: center, radius: 5000 } satisfies google.maps.places.TextSearchRequest)
        : ({
            location: center,
            radius: category === "nearby" ? 1500 : 5000,
            keyword: categoryKeywords[category],
          } satisfies google.maps.places.PlaceSearchRequest);

    const callback = (
      results: google.maps.places.PlaceResult[] | null,
      searchStatus: google.maps.places.PlacesServiceStatus | string,
    ) => {
      if (searchStatus !== "OK" || !results) {
        if (query.length > 0) {
          onNotice?.("No map results found. Try another search or use the trip places below.");
        }
        onPlacesChange([]);
        return;
      }
      const mapped = results
        .map((place) => mapGooglePlace(place, userLocation ?? center))
        .filter((place): place is GoogleMapPlace => place !== null)
        .slice(0, 18);
      onPlacesChange(mapped);
      if (mapped[0]) map.panTo({ lat: mapped[0].lat, lng: mapped[0].lng });
    };

    try {
      if (query.length > 0) service.textSearch(request as google.maps.places.TextSearchRequest, callback);
      else service.nearbySearch(request as google.maps.places.PlaceSearchRequest, callback);
    } catch {
      onPlacesChange([]);
      onNotice?.("Places search is not available right now. Trip places are still shown below.");
    }
  }, [category, onNotice, onPlacesChange, searchQuery, status, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const clusters = clusterPlaces(visiblePlaces, zoom);
    try {
      markersRef.current = clusters.map((cluster) => {
        const isCluster = cluster.places.length > 1;
        const isSelected = cluster.places.some((place) => place.id === selectedId);
        const marker = new google.maps.Marker({
          map,
          position: { lat: cluster.center.lat, lng: cluster.center.lng },
          title: isCluster ? `${cluster.places.length} places` : cluster.center.name,
          label: isCluster ? { text: String(cluster.places.length), color: "#ffffff", fontWeight: "700" } : undefined,
          icon: getMarkerIcon(isSelected || isCluster ? "#2f63c2" : "#ffffff"),
          zIndex: isSelected ? 20 : isCluster ? 15 : 10,
        });
        marker.addListener("click", () => {
          try {
            if (isCluster) {
              map.panTo({ lat: cluster.center.lat, lng: cluster.center.lng });
              map.setZoom(Math.min((map.getZoom() ?? DEFAULT_ZOOM) + 2, 18));
              return;
            }
            if (!cluster.center.placeId || !placesServiceRef.current) {
              onSelect(cluster.center);
              return;
            }
            placesServiceRef.current.getDetails(
              {
                placeId: cluster.center.placeId,
                fields: [
                  "name",
                  "rating",
                  "formatted_address",
                  "formatted_phone_number",
                  "website",
                  "opening_hours",
                  "photos",
                  "geometry",
                ],
              },
              (details) => onSelect(mergePlaceDetails(cluster.center, details)),
            );
          } catch {
            setStatus("error");
            setError("Map unavailable");
          }
        });
        return marker;
      });
    } catch {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      setStatus("error");
      setError("Map unavailable");
    }
  }, [onSelect, selectedId, status, visiblePlaces, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = places.find((place) => place.id === selectedId);
    if (!map || !selected || status !== "ready") return;
    try {
      map.panTo({ lat: selected.lat, lng: selected.lng });
    } catch {
      setStatus("error");
      setError("Map unavailable");
    }
  }, [places, selectedId, status]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#eef3f7]", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/65 px-6 text-center backdrop-blur-xl">
          <div className="glass-surface-strong glass-shadow flex max-w-[18rem] flex-col items-center gap-3 rounded-2xl p-4">
            {status === "loading" ? (
              <>
                <Loader size={22} className="animate-spin text-accent-strong" />
                <p className="text-sm font-semibold text-ink">Loading Google Maps</p>
              </>
            ) : (
              <>
                <TriangleAlert size={22} className="text-accent-strong" />
                <p className="text-sm font-semibold text-ink">Map is not available right now</p>
                <p className="text-xs text-ink-muted">{error || "You can still search saved places and use the rest of the trip."}</p>
              </>
            )}
          </div>
        </div>
      )}
      {status === "ready" && visiblePlaces.length === 0 && (
        <div className="pointer-events-none absolute inset-x-5 top-32 z-10">
          <div className="glass-surface-strong glass-shadow mx-auto flex max-w-[18rem] items-center gap-2 rounded-pill px-3 py-2 text-xs font-semibold text-ink-muted">
            <MapPin size={14} className="text-accent-strong" />
            Search or pick another category
          </div>
        </div>
      )}
      {status === "ready" && !userLocation && (
        <div className="pointer-events-none absolute bottom-56 right-4 z-10 hidden rounded-full bg-white/85 p-2 text-[#1976ff] shadow-lg md:block">
          <LocateFixed size={18} />
        </div>
      )}
    </div>
  );
}
