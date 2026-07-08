import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
