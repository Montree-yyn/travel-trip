import { TRANSPORT_ICONS } from "@/lib/transport";
import type { TransportRoute } from "@/types/transport";

export function RouteLegCard({ route }: { route: TransportRoute }) {
  const Icon = TRANSPORT_ICONS[route.method];

  return (
    <div className="glass-surface glass-shadow flex items-center gap-3 rounded-2xl p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {route.from} <span className="text-ink-faint">→</span> {route.to}
        </p>
        <p className="text-xs text-ink-muted">
          {route.line ?? route.method} · {route.duration}
        </p>
      </div>
      {route.cost && <span className="shrink-0 text-xs font-semibold text-ink-muted">{route.cost}</span>}
    </div>
  );
}
