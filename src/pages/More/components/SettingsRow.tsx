import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { tapScaleSubtle } from "@/design-system/motion";
import { cn } from "@/lib/utils";

export interface SettingsRowProps {
  icon: LucideIcon;
  iconTone?: "accent" | "danger";
  label: string;
  value?: string;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function SettingsRow({ icon: Icon, iconTone = "accent", label, value, trailing, onClick }: SettingsRowProps) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          iconTone === "danger" ? "bg-red-500/12 text-red-500" : "bg-accent-soft text-accent-strong",
        )}
      >
        <Icon size={16} />
      </span>
      <span className={cn("flex-1 text-sm font-medium", iconTone === "danger" ? "text-red-500" : "text-ink")}>
        {label}
      </span>
      {value && <span className="text-sm text-ink-muted">{value}</span>}
      {trailing ?? (onClick && <ChevronRight size={16} className="text-ink-faint" />)}
    </>
  );

  if (onClick) {
    return (
      <motion.button
        onClick={onClick}
        whileTap={tapScaleSubtle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-ink/5 disabled:opacity-60"
      >
        {content}
      </motion.button>
    );
  }

  return <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left">{content}</div>;
}
