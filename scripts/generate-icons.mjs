// One-off script used to render PWA icon PNGs from scripts/icon-source.svg.
// Not part of the app runtime. Requires a temporary dev dependency to run:
//   npm i -D sharp && node scripts/generate-icons.mjs && npm uninstall sharp
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "scripts/icon-source.svg");
const outDir = path.join(root, "public/icons");

mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "maskable-icon-512.png", size: 512, padding: 0.16 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const size = t.size;
  let pipeline = sharp(svgPath, { density: 384 });

  if (t.padding) {
    const inner = Math.round(size * (1 - t.padding * 2));
    pipeline = sharp(svgPath, { density: 384 })
      .resize(inner, inner)
      .extend({
        top: Math.round((size - inner) / 2),
        bottom: Math.round((size - inner) / 2),
        left: Math.round((size - inner) / 2),
        right: Math.round((size - inner) / 2),
        background: "#FF6B9D",
      });
  } else {
    pipeline = pipeline.resize(size, size);
  }

  await pipeline.png().toFile(path.join(outDir, t.file));
  console.log(`generated ${t.file}`);
}
