import imagesData from "@/data/images.json";

const imageMap = imagesData as Record<string, string>;

export function resolveImageUrl(seed: string) {
  if (imageMap[seed]) return imageMap[seed];

  const airportMatch = /^airport-([a-z]{3})$/i.exec(seed);
  if (airportMatch) {
    const code = airportMatch[1]!.toLowerCase();
    if (imageMap[`airport-${code}`]) return imageMap[`airport-${code}`]!;
  }

  const cityKey = seed.split("-")[0];
  if (cityKey && imageMap[`${cityKey}-fallback`]) return imageMap[`${cityKey}-fallback`]!;

  return imageMap["trip-hero"] ?? "/images/trip-hero.svg";
}

export function resolveAirportImageUrl(code: string) {
  return resolveImageUrl(`airport-${code.toLowerCase()}`);
}

export function preloadImage(url: string) {
  if (typeof document === "undefined" || !url) return;

  const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  document.head.appendChild(link);
}
