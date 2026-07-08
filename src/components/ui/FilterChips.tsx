import { motion } from "framer-motion";

import { tapScaleSubtle } from "@/design-system/motion";
import { cn } from "@/lib/utils";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "floating" adds a stronger glass + shadow for use over photos/maps. */
  variant?: "flat" | "floating";
  className?: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  variant = "flat",
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            whileTap={tapScaleSubtle}
            className={cn(
              "shrink-0 rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-colors",
              variant === "floating" ? "glass-surface-strong" : "glass-surface",
              isActive
                ? "pill-glow bg-gradient-to-b from-accent to-accent-strong text-accent-contrast"
                : "glass-shadow text-ink-muted",
            )}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
