import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { riseIn } from "@/design-system/motion";

import { GlassCard } from "./GlassCard";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Placeholder content for pages that don't have business logic wired up yet. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      variants={riseIn}
      initial="hidden"
      animate="visible"
      className="flex flex-1 items-center justify-center px-5"
    >
      <GlassCard padding="lg" className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Icon size={28} strokeWidth={1.75} />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
