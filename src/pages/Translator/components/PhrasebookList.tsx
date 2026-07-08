import { motion } from "framer-motion";
import { Bookmark, Heart, Trash2 } from "lucide-react";

import { EmptyState, GlassCard, IconButton } from "@/components/ui";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { TRANSLATOR_LANGUAGE_LABELS } from "@/lib/translator";
import type { TranslatorPhrase } from "@/types/translator";

export interface PhrasebookListProps {
  phrases: TranslatorPhrase[];
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (phrase: TranslatorPhrase) => void;
}

export function PhrasebookList({ phrases, onToggleFavorite, onRemove, onSelect }: PhrasebookListProps) {
  const { t } = useTranslation();

  if (phrases.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("translator.phrasebookEmptyTitle")}
        description={t("translator.phrasebookEmptyDescription")}
      />
    );
  }

  const favorites = phrases.filter((phrase) => phrase.favorited);
  const others = phrases.filter((phrase) => !phrase.favorited);

  return (
    <motion.div variants={staggerContainer} className="flex flex-col gap-3 px-5">
      {[...favorites, ...others].map((phrase) => {
        const sourceMeta = TRANSLATOR_LANGUAGE_LABELS[phrase.sourceLang];
        const targetMeta = TRANSLATOR_LANGUAGE_LABELS[phrase.targetLang];

        return (
          <motion.div key={phrase.id} variants={riseIn}>
            <GlassCard padding="md" className="flex flex-col gap-3">
              <button type="button" onClick={() => onSelect(phrase)} className="text-left">
                <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                  <span>{sourceMeta.flag}</span>
                  <span>{t(sourceMeta.labelKey)}</span>
                  <span aria-hidden>→</span>
                  <span>{targetMeta.flag}</span>
                  <span>{t(targetMeta.labelKey)}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{phrase.sourceText}</p>
                <p className="mt-1 text-base font-medium text-accent-strong">{phrase.translatedText}</p>
              </button>
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  aria-label={phrase.favorited ? t("translator.unfavorite") : t("translator.favorite")}
                  size="sm"
                  onClick={() => onToggleFavorite(phrase.id)}
                >
                  <Heart size={16} className={phrase.favorited ? "fill-accent text-accent" : undefined} />
                </IconButton>
                <IconButton aria-label={t("common.remove")} size="sm" onClick={() => onRemove(phrase.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
