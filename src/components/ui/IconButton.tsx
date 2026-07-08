import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { tapScale } from "@/design-system/motion";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  glass: "glass-surface text-ink glass-shadow",
  solid: "bg-gradient-to-b from-accent to-accent-strong text-accent-contrast glow-accent",
  ghost: "bg-transparent text-ink hover:bg-ink/5 dark:hover:bg-white/5",
} as const;

const SIZE_CLASSES = {
  sm: "size-9",
  md: "size-11",
  lg: "size-13",
} as const;

export interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "glass", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={tapScale}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

IconButton.displayName = "IconButton";
