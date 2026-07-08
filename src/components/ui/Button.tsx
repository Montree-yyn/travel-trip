import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { tapScale } from "@/design-system/motion";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  primary: "pill-glow bg-gradient-to-b from-accent to-accent-strong text-accent-contrast",
  secondary:
    "glass-surface glass-shadow text-ink border-white/60 dark:border-white/10",
  ghost: "bg-transparent text-ink hover:bg-ink/5 dark:hover:bg-white/5",
  outline: "bg-transparent border border-accent/40 text-accent-strong dark:text-accent",
} as const;

const SIZE_CLASSES = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-6 text-base gap-2",
} as const;

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth, children, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={tapScale}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={cn(
          "inline-flex items-center justify-center rounded-pill font-medium",
          "transition-colors disabled:opacity-40 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
