import { AlertTriangle } from "lucide-react";
import { useRouteError } from "react-router-dom";

import { GlassCard } from "@/components/ui";
import { useTranslation } from "@/i18n";

export function RouteErrorFallback() {
  const error = useRouteError();
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : t("errors.routeDescription");

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md items-center justify-center bg-bg px-5 md:max-w-lg lg:max-w-xl">
      <GlassCard strong padding="lg" className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <AlertTriangle size={24} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">{t("errors.routeTitle")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("errors.routeDescription")}</p>
        <p className="mt-2 text-xs text-ink-faint">{message}</p>
      </GlassCard>
    </div>
  );
}
