import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";

import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

export interface DataErrorStateProps {
  icon?: LucideIcon;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  onRetry?: () => void;
}

export function DataErrorState({
  icon: Icon = RefreshCw,
  titleKey = "errors.dataTitle",
  description,
  descriptionKey = "errors.dataDescription",
  onRetry,
}: DataErrorStateProps) {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} initial="hidden" animate="visible" className="flex flex-1 items-center justify-center px-5 py-12">
      <GlassCard padding="lg" className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Icon size={28} strokeWidth={1.75} />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-ink">{t(titleKey)}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{description ?? t(descriptionKey)}</p>
        </div>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}
