import type { ReactNode } from "react";

import type { PageAccentTone } from "@/design-system/tokens";

interface PageAccentProps {
  /** Which contextual accent tone this page should use. "pink" is the default brand tone (no-op). */
  tone: PageAccentTone;
  children: ReactNode;
}

/**
 * Rescopes the `--accent` / `--accent-strong` / `--accent-soft` / `--shadow-tint`
 * custom properties for everything rendered inside it, giving each page a subtle,
 * contextual tint (e.g. blue for Map, sky for Weather) while the shared UI
 * components (GlassCard, Button, chips…) stay untouched. Uses `display: contents`
 * so it never affects layout — CSS custom properties still cascade to children.
 */
export function PageAccent({ tone, children }: PageAccentProps) {
  if (tone === "pink") return <>{children}</>;

  return <div className={`accent-${tone} contents`}>{children}</div>;
}
