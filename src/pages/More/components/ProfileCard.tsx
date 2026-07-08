import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

import { useAuth } from "@/auth";
import { Avatar, GlassCard } from "@/components/ui";
import { scaleIn, tapScale } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import type { TripPlan } from "@/types/trip";

export function ProfileCard({ trip }: { trip: TripPlan }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.displayName ?? trip.companions.join(" & ");
  const email = user?.email ?? t("auth.emailFallback");
  const photoURL = user?.photoURL ?? undefined;

  return (
    <motion.div variants={scaleIn}>
      <GlassCard padding="sm" className="relative mx-5 flex items-center gap-3 overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-12 size-28 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative shrink-0">
          <Avatar name={displayName} src={photoURL} size="md" className="ring-2 ring-bg-elevated" />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-ink">{displayName}</p>
          <p className="truncate text-xs font-medium text-ink-muted">{email}</p>
          <p className="truncate text-xs text-ink-faint">{trip.title}</p>
        </div>
        <motion.button
          whileTap={tapScale}
          aria-label={t("common.editTrip")}
          className="glow-accent relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent-strong text-accent-contrast"
        >
          <Pencil size={14} />
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
