import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-5", className)}>
      <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink">{title}</h2>
      {action}
    </div>
  );
}
