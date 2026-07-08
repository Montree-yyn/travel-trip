/**
 * Liquid Sakura Pro — design tokens.
 *
 * This is the single source of truth for design values that need to be
 * consumed from TypeScript/JS (e.g. Framer Motion configs, charts, canvas).
 * Values here should stay in sync with the CSS custom properties defined in
 * `src/index.css`. Tailwind utility classes remain the primary way to apply
 * these tokens inside JSX — reach for this file only when a raw value is
 * required (animations, inline styles, computed colors).
 */

export const color = {
  light: {
    bg: "#FBF8F6",
    bgElevated: "#FFFFFF",
    ink: "#2B2024",
    inkMuted: "#8C7981",
    inkFaint: "#C2B3B8",
    accent: "#F26C93",
    accentStrong: "#D94F78",
    accentSoft: "#FBE6ED",
  },
  dark: {
    bg: "#100B0D",
    bgElevated: "#1C1519",
    ink: "#F7EDF0",
    inkMuted: "#C2A8B1",
    inkFaint: "#85707A",
    accent: "#FF93B6",
    accentStrong: "#FF6B9D",
    accentSoft: "#3D232C",
  },
} as const;

/** Per-page dynamic accent tones (see matching `.accent-*` classes in index.css). */
export const pageAccentTones = ["pink", "blue", "sky", "teal", "green", "amber", "indigo"] as const;
export type PageAccentTone = (typeof pageAccentTones)[number];

export const radius = {
  xl: "1.125rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  "4xl": "2.5rem",
  pill: "999px",
} as const;

export const spacing = {
  screenX: "1.25rem",
  sectionGap: "1.75rem",
  cardGap: "0.75rem",
} as const;

export const typography = {
  fontFamily:
    '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", system-ui, sans-serif',
  scale: {
    largeTitle: "1.75rem",
    title1: "1.5rem",
    title2: "1.25rem",
    title3: "1.125rem",
    body: "1rem",
    subhead: "0.9375rem",
    footnote: "0.8125rem",
    caption: "0.75rem",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const motionDuration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.48,
} as const;

export const motionEasing = {
  standard: [0.22, 1, 0.36, 1],
  spring: { type: "spring", stiffness: 320, damping: 28 },
  gentleSpring: { type: "spring", stiffness: 220, damping: 26 },
  snappySpring: { type: "spring", stiffness: 460, damping: 30 },
  liquidSpring: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 },
} as const;

export const zIndex = {
  base: 0,
  content: 10,
  header: 20,
  bottomNav: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;
