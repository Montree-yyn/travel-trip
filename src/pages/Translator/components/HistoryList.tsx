import { motion } from "framer-motion";
import { Clock3, Trash2 } from "lucide-react";

import { EmptyState, GlassCard, IconButton } from "@/components/ui";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { TRANSLATOR_LANGUAGE_LABELS } from "@/lib/translator";
import type { TranslatorHistoryEntry } from "@/types/translator";

export interface HistoryListProps {
  history: TranslatorHistoryEntry[];
  onRemove: (id: string) => void;
  onSelect: (entry: TranslatorHistoryEntry) => void;
  onClear: () => void;
}

export function HistoryList({ history, onRemove, onSelect, onClear }: HistoryListProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title={t("translator.historyEmptyTitle")}
        description={t("translator.historyEmptyDescription")}
      />
    );
  }

  return (
    <motion.div variants={staggerContainer} className="flex flex-col gap-3 px-5">
      {history.map((entry) => {
        const sourceMeta = TRANSLATOR_LANGUAGE_LABELS[entry.sourceLang];
        const targetMeta = TRANSLATOR_LANGUAGE_LABELS[entry.targetLang];

        return (
          <motion.div key={entry.id} variants={riseIn}>
            <GlassCard padding="md" className="flex flex-col gap-3">
              <button type="button" onClick={() => onSelect(entry)} className="text-left">
                <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                  <span>{sourceMeta.flag}</span>
                  <span>{t(sourceMeta.labelKey)}</span>
                  <span aria-hidden>→</span>
                  <span>{targetMeta.flag}</span>
                  <span>{t(targetMeta.labelKey)}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{entry.sourceText}</p>
                <p className="mt-1 text-base font-medium text-accent-strong">{entry.translatedText}</p>
              </button>
              <div className="flex items-center justify-end">
                <IconButton aria-label={t("common.remove")} size="sm" onClick={() => onRemove(entry.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
      <button
        type="button"
        onClick={onClear}
        className="mx-auto text-sm font-medium text-ink-muted underline-offset-2 hover:underline"
      >
        {t("translator.clearHistory")}
      </button>
    </motion.div>
  );
}
