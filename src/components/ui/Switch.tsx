import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

export function Switch({ checked, onChange, disabled, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-8 w-14 shrink-0 rounded-pill p-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40",
        checked ? "bg-gradient-to-r from-accent to-accent-strong" : "bg-ink/12",
        className,
      )}
      {...props}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="block size-6 rounded-full bg-white shadow-md"
        style={{ marginLeft: checked ? "calc(100% - 1.5rem)" : 0 }}
      />
    </button>
  );
}
