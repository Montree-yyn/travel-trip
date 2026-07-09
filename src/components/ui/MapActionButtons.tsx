import { Map } from "lucide-react";

import { useTranslation } from "@/i18n";
import {
  buildGoogleMapsUrl,
  type MapTarget,
} from "@/lib/maps";
import { cn } from "@/lib/utils";

export function MapActionButtons({ target, className }: { target: MapTarget; className?: string }) {
  const { t } = useTranslation();
  const linkClass =
    "glass-surface glass-shadow inline-flex h-9 items-center justify-center gap-1.5 rounded-pill px-3 text-xs font-semibold text-ink-muted transition-colors active:bg-accent-soft";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={buildGoogleMapsUrl(target)} target="_blank" rel="noreferrer" className={linkClass}>
        <Map size={13} className="text-accent-strong" />
        {t("maps.googleMaps")}
      </a>
    </div>
  );
}
