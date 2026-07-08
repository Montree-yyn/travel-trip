import { motion } from "framer-motion";
import { Hotel } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import type { HotelData } from "@/types/hotel";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HotelMiniCard({ hotel }: { hotel: HotelData }) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="flex-1">
      <Link to={ROUTES.hotel}>
        <GlassCard interactive padding="md" className="h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">{t("home.hotel")}</span>
            <Hotel size={18} className="text-accent-strong" />
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{hotel.name}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {formatDate(hotel.checkIn.date)} → {formatDate(hotel.checkOut.date)}
          </p>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
