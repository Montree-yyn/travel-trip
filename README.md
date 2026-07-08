# Travel Trip 💕

A mobile-first, installable (PWA) travel companion app — **foundation phase**.

This phase only establishes a clean, scalable project foundation (structure,
design system, theming, navigation, empty pages). **No business logic** is
implemented yet — pages are placeholders ready to be built out.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4** (CSS-first theme via `@theme`, no `tailwind.config.js` needed)
- **React Router v7**
- **Framer Motion** for animation
- **Lucide React** for icons
- **vite-plugin-pwa** for installable, offline-ready PWA support

## Design

- Apple Human Interface Guidelines inspired
- "Liquid Sakura Pro" theme — off-white background, soft pink accent, frosted glass surfaces
- Full light & dark mode support (`system`, `light`, `dark`, toggleable, persisted)
- Floating, frosted-glass bottom navigation bar
- Mobile-first, tuned for iPhone 16/17 Pro Max viewports (safe-area aware)

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`) — for the best
preview, open Chrome DevTools device toolbar and pick an iPhone 16/17 Pro Max
frame, or resize the browser to a narrow width.

### Other scripts

```bash
npm run build      # type-check + production build (also emits the service worker)
npm run preview    # preview the production build locally
npm run lint        # run oxlint
```

## Folder Structure

```
travel-trip/
├─ public/
│  ├─ favicon.svg
│  └─ icons/                    # PWA icons (192, 512, maskable, apple-touch)
├─ scripts/
│  ├─ icon-source.svg           # source art for generated PWA icons
│  └─ generate-icons.mjs        # one-off script to regenerate PNG icons
├─ src/
│  ├─ assets/                   # static images/fonts used by components
│  ├─ components/
│  │  ├─ ui/                    # design-system primitives (Button, GlassCard, Chip, ...)
│  │  └─ layout/                # structural components (AppShell, BottomNav, PageHeader)
│  ├─ data/
│  │  └─ sample-trip.ts         # sample Osaka/Kyoto/Ine/Kobe trip (reference data only)
│  ├─ design-system/
│  │  ├─ tokens.ts               # color/spacing/typography/motion tokens (TS-side)
│  │  └─ motion.ts               # shared Framer Motion variants & transitions
│  ├─ hooks/                     # reusable hooks (e.g. useMediaQuery)
│  ├─ lib/
│  │  └─ utils.ts                # `cn()` class-merging helper
│  ├─ pages/                     # one folder per route (currently empty placeholders)
│  │  ├─ Home/
│  │  ├─ Itinerary/
│  │  ├─ Map/
│  │  ├─ Food/
│  │  ├─ Places/
│  │  ├─ Transport/
│  │  ├─ Budget/
│  │  ├─ Checklist/
│  │  ├─ Weather/
│  │  ├─ Currency/
│  │  ├─ Memories/
│  │  └─ More/
│  ├─ router/
│  │  ├─ paths.ts                # centralized route path constants
│  │  └─ AppRouter.tsx           # React Router configuration
│  ├─ theme/
│  │  ├─ theme-context.ts        # theme context + types
│  │  ├─ ThemeProvider.tsx       # light/dark/system provider, persists to localStorage
│  │  └─ useTheme.ts             # `useTheme()` hook
│  ├─ types/
│  │  └─ trip.ts                 # trip/itinerary/budget/checklist domain types
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css                  # Tailwind import + design tokens + base/utility layers
├─ index.html
├─ vite.config.ts                # React, Tailwind, PWA plugins + `@` path alias
└─ tsconfig*.json
```

## Design System

- **Theming**: CSS custom properties defined in `src/index.css` (`:root` for
  light, `.dark` for dark), wired into Tailwind via `@theme inline` so
  utilities like `bg-bg`, `text-ink`, `bg-accent`, `rounded-2xl`, etc. work
  and automatically respond to the active theme.
- **Glass surfaces**: `.glass-surface`, `.glass-surface-strong`, and
  `.glass-shadow` utility classes provide the frosted "Liquid Glass" look.
- **Theme switching**: `<ThemeProvider>` (in `src/theme`) exposes `useTheme()`
  with `theme` (`light` / `dark` / `system`), `resolvedTheme`, `setTheme`, and
  `toggleTheme`. Preference is persisted to `localStorage` and an inline
  script in `index.html` prevents a flash of the wrong theme on load.
- **Motion**: shared variants/transitions in `src/design-system/motion.ts`
  (`fadeIn`, `riseIn`, `scaleIn`, `staggerContainer`, `pageTransition`) keep
  animation feel consistent across the app.
- **Path alias**: import app code with `@/...` instead of relative paths
  (e.g. `import { Button } from "@/components/ui"`).

## Routes

| Path          | Page              |
| ------------- | ----------------- |
| `/`           | Home              |
| `/itinerary`  | Itinerary         |
| `/map`        | Map               |
| `/food`       | Food & Cafe       |
| `/places`     | Places            |
| `/transport`  | Transport         |
| `/budget`     | Budget            |
| `/checklist`  | Checklist         |
| `/weather`    | Weather           |
| `/currency`   | Currency          |
| `/memories`   | Memories          |
| `/more`       | More              |

The floating bottom nav surfaces the 5 primary destinations (Home, Itinerary,
Map, Budget, More); the remaining pages are reachable from **More**.

## PWA

Configured via `vite-plugin-pwa` (`autoUpdate` service worker, manifest with
themed icons). Run `npm run build && npm run preview` to test installability
— dev-mode PWA is disabled by default for faster local iteration.

## Next Steps (not part of this phase)

- Wire real data into pages (see `src/data/sample-trip.ts` and `src/types/trip.ts` for shape)
- Implement itinerary timeline, map integration, budget charts, checklist state, etc.
- Add persistence (local storage / backend)
