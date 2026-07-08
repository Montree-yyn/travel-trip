import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Increases background opacity + blur for content that sits above busy backgrounds. */
  strong?: boolean;
  /** Adds hover/tap affordance for tappable cards. */
  interactive?: boolean;
  /** Uses the deeper "floating" shadow tier reserved for hero/standout cards. */
  elevated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, strong, interactive, elevated, padding = "md", children, ...props },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        whileHover={interactive ? { y: -3 } : undefined}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className={cn(
          "rounded-3xl",
          elevated ? "glass-shadow-lg" : "glass-shadow",
          strong ? "glass-surface-strong" : "glass-surface",
          PADDING_CLASSES[padding],
          interactive && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

GlassCard.displayName = "GlassCard";
