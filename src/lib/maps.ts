export interface MapTarget {
  name?: string;
  address?: string;
  query?: string;
  latitude?: number;
  longitude?: number;
}

export type MapProvider = "apple" | "google";

function hasCoordinates(target: MapTarget) {
  return typeof target.latitude === "number" && typeof target.longitude === "number";
}

function getLabel(target: MapTarget) {
  return target.name ?? target.query ?? target.address ?? "Destination";
}

function getSearchQuery(target: MapTarget) {
  return target.query ?? [target.name, target.address].filter(Boolean).join(", ") ?? getLabel(target);
}

function encode(value: string) {
  return encodeURIComponent(value);
}

export function buildAppleMapsUrl(target: MapTarget) {
  if (hasCoordinates(target)) {
    return `https://maps.apple.com/?ll=${target.latitude},${target.longitude}&q=${encode(getLabel(target))}`;
  }

  return `https://maps.apple.com/?q=${encode(getSearchQuery(target))}`;
}

export function buildGoogleMapsUrl(target: MapTarget) {
  const query = hasCoordinates(target) ? `${target.latitude},${target.longitude}` : getSearchQuery(target);
  return `https://www.google.com/maps/search/?api=1&query=${encode(query)}`;
}

export function buildDirectionsUrl(target: MapTarget, provider: MapProvider = "google") {
  const destination = hasCoordinates(target) ? `${target.latitude},${target.longitude}` : getSearchQuery(target);

  if (provider === "apple") {
    return `https://maps.apple.com/?daddr=${encode(destination)}&dirflg=w`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encode(destination)}`;
}

export function buildPlaceSearchUrl(target: MapTarget, provider: MapProvider = "google") {
  return provider === "apple" ? buildAppleMapsUrl(target) : buildGoogleMapsUrl(target);
}

export function createMapTarget({
  name,
  address,
  city,
  airportCode,
}: {
  name?: string;
  address?: string;
  city?: string;
  airportCode?: string;
}): MapTarget {
  return {
    name,
    address,
    query: [name, airportCode, address, city].filter(Boolean).join(", "),
  };
}
