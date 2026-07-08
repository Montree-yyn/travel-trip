import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId = "segmented-control",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn("glass-surface glass-shadow inline-flex items-center gap-1 rounded-pill p-1", className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className="relative rounded-pill px-4 py-1.5 text-sm font-medium text-ink-muted transition-colors focus-visible:outline-none"
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="pill-glow absolute inset-0 rounded-pill bg-gradient-to-b from-accent to-accent-strong"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className={cn("relative z-10", isActive && "text-accent-contrast")}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
