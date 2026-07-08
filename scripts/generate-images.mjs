import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/images");
mkdirSync(outDir, { recursive: true });

const PALETTES = {
  sakura: ["#FFC6D9", "#FF8FB3", "#E8548B"],
  matcha: ["#B7E4C7", "#7FC8A9", "#3E8E7E"],
  sunset: ["#FFD9A6", "#FF9F68", "#E8654B"],
  ocean: ["#A6D8FF", "#6FB4E8", "#3A6FC4"],
  twilight: ["#D9C6FF", "#B48FE8", "#6E4FC4"],
  lantern: ["#FFE29A", "#FFB870", "#E88549"],
  steel: ["#C8D6E5", "#8395A7", "#576574"],
  terminal: ["#DFE6E9", "#B2BEC3", "#636E72"],
};

const IMAGE_THEMES = {
  "osaka-castle": { palette: "sakura", label: "Osaka Castle" },
  "namba-yasaka-shrine": { palette: "lantern", label: "Namba Yasaka" },
  "umeda-sky-building": { palette: "ocean", label: "Umeda Sky" },
  "arashiyama-bamboo-grove": { palette: "matcha", label: "Arashiyama" },
  "gion-district": { palette: "twilight", label: "Gion" },
  "byodo-in-temple": { palette: "matcha", label: "Byodo-in" },
  amanohashidate: { palette: "ocean", label: "Amanohashidate" },
  "kobe-harborland": { palette: "ocean", label: "Kobe Harbor" },
  "rinku-premium-outlets": { palette: "sunset", label: "Rinku Outlets" },
  "tsujita-artisan-noodle": { palette: "sunset", label: "Tsukemen" },
  "kaiten-sushi-ginza-onodera": { palette: "ocean", label: "Sushi" },
  "tuna-master": { palette: "ocean", label: "Tuna Master" },
  "shiki-japanese-tea": { palette: "matcha", label: "Japanese Tea" },
  "lilo-coffee-roasters": { palette: "lantern", label: "Coffee" },
  "gyukatsu-kyoto-katsugyu": { palette: "sunset", label: "Gyukatsu" },
  "arabica-kyoto-higashiyama": { palette: "steel", label: "% Arabica" },
  "omen-ginkakuji": { palette: "matcha", label: "Omen" },
  ujikoen: { palette: "matcha", label: "Uji Tea" },
  "matcha-cafe-uji": { palette: "matcha", label: "Matcha Cafe" },
  "kuromon-market": { palette: "sunset", label: "Kuromon Market" },
  "moken-cream-puff": { palette: "sakura", label: "Cream Puff" },
  "fff-coffee": { palette: "steel", label: "F.F.F. Coffee" },
  "steak-land-kobe": { palette: "sunset", label: "Kobe Beef" },
  "universal-studios": { palette: "twilight", label: "USJ" },
  "super-nintendo-world": { palette: "sakura", label: "Nintendo World" },
  "hotel-smile-osaka": { palette: "twilight", label: "Smile Hotel" },
  "airport-kix": { palette: "ocean", label: "KIX", code: "KIX" },
  "airport-cnx": { palette: "matcha", label: "CNX", code: "CNX" },
  "airport-kul": { palette: "steel", label: "KUL", code: "KUL" },
  "airport-dmk": { palette: "sunset", label: "DMK", code: "DMK" },
  "transport-train": { palette: "steel", label: "Shinkansen" },
  "transport-station": { palette: "terminal", label: "Station" },
  "trip-hero": { palette: "matcha", label: "Japan Trip", wide: true },
};

function svgForTheme(seed, theme) {
  const [c1, c2, c3] = PALETTES[theme.palette];
  const width = theme.wide ? 1200 : 800;
  const height = theme.wide ? 600 : 800;
  const headline = theme.code ?? theme.label;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${theme.label}">
  <defs>
    <linearGradient id="bg-${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow-${seed}" cx="30%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${seed})"/>
  <rect width="${width}" height="${height}" fill="url(#glow-${seed})"/>
  <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.18}" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="${width * 0.18}" cy="${height * 0.78}" r="${Math.min(width, height) * 0.22}" fill="#000000" fill-opacity="0.08"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" fill-opacity="0.92" font-family="system-ui, -apple-system, sans-serif" font-size="${theme.code ? Math.min(width, height) * 0.16 : Math.min(width, height) * 0.08}" font-weight="700">${headline}</text>
  ${theme.code ? `<text x="${width / 2}" y="${height / 2 + Math.min(width, height) * 0.1}" text-anchor="middle" fill="#ffffff" fill-opacity="0.75" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.min(width, height) * 0.045}" font-weight="500">${theme.label}</text>` : ""}
</svg>`;
}

const manifest = {};

for (const [seed, theme] of Object.entries(IMAGE_THEMES)) {
  const filename = `${seed}.svg`;
  writeFileSync(join(outDir, filename), svgForTheme(seed, theme));
  manifest[seed] = `/images/${filename}`;
}

writeFileSync(join(root, "src/data/images.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${Object.keys(manifest).length} images in public/images`);
