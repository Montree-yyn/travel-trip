import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Chip, GlassCard, TripImage } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { TRANSPORT_ICONS } from "@/lib/transport";
import type { TransportRoute } from "@/types/transport";

export function TransportRouteCard({ route }: { route: TransportRoute }) {
  const Icon = TRANSPORT_ICONS[route.method];

  return (
    <motion.div variants={riseIn}>
      <GlassCard padding="none" className="mx-5 overflow-hidden">
        <TripImage
          seed="transport-train"
          alt={route.line ?? route.method}
          icon={Icon}
          className="h-24 w-full"
          iconClassName="size-8"
        />

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-end">
            {route.cost && <Chip tone="accent">{route.cost}</Chip>}
          </div>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{route.from}</p>
              {route.departureTime && <p className="text-xs text-ink-muted">{route.departureTime}</p>}
            </div>
            <ArrowRight size={16} className="shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-sm font-semibold text-ink">{route.to}</p>
              {route.arrivalTime && <p className="text-xs text-ink-muted">{route.arrivalTime}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink/8 pt-2.5 text-xs text-ink-muted">
            <span>{route.line ?? route.method}</span>
            <span className="font-medium text-ink">{route.duration}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
