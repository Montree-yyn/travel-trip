import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  accent: "bg-accent-soft text-accent-strong",
  neutral: "glass-surface text-ink-muted",
} as const;

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONE_CLASSES;
}

export function Chip({ className, tone = "accent", children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
