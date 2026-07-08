import { motion } from "framer-motion";
import { BookmarkPlus, Copy, Heart, Loader2 } from "lucide-react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { TRANSLATOR_LANGUAGE_LABELS } from "@/lib/translator";
import type { TranslatorLangCode } from "@/types/translator";

export interface TranslateOutputCardProps {
  text: string | null;
  targetLang: TranslatorLangCode;
  loading: boolean;
  errorKey: string | null;
  saved: boolean;
  favorited: boolean;
  onCopy: () => void;
  onSave: () => void;
  onToggleFavorite: () => void;
}

export function TranslateOutputCard({
  text,
  targetLang,
  loading,
  errorKey,
  saved,
  favorited,
  onCopy,
  onSave,
  onToggleFavorite,
}: TranslateOutputCardProps) {
  const { t } = useTranslation();
  const meta = TRANSLATOR_LANGUAGE_LABELS[targetLang];

  return (
    <motion.div variants={scaleIn} className="mx-5">
      <GlassCard padding="lg" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <span className="text-xl leading-none">{meta.flag}</span>
            {t("translator.outputLabel")}
          </span>
          {text && !loading && !errorKey && (
            <div className="flex items-center gap-1">
              <IconButton aria-label={t("translator.copy")} onClick={onCopy} size="sm">
                <Copy size={16} />
              </IconButton>
              <IconButton
                aria-label={saved ? t("translator.saved") : t("translator.savePhrase")}
                onClick={onSave}
                size="sm"
                disabled={saved}
              >
                <BookmarkPlus size={16} />
              </IconButton>
              <IconButton
                aria-label={favorited ? t("translator.unfavorite") : t("translator.favorite")}
                onClick={onToggleFavorite}
                size="sm"
              >
                <Heart size={16} className={favorited ? "fill-accent text-accent" : undefined} />
              </IconButton>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex min-h-[5rem] items-center justify-center gap-2 text-ink-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">{t("translator.translating")}</span>
          </div>
        )}

        {!loading && errorKey && (
          <p className="min-h-[5rem] text-sm leading-relaxed text-red-500 dark:text-red-400">{t(errorKey)}</p>
        )}

        {!loading && !errorKey && text && (
          <p className="min-h-[5rem] whitespace-pre-wrap text-lg leading-relaxed text-accent-strong">{text}</p>
        )}

        {!loading && !errorKey && !text && (
          <p className="min-h-[5rem] text-sm leading-relaxed text-ink-faint">{t("translator.outputEmpty")}</p>
        )}
      </GlassCard>
    </motion.div>
  );
}

export function TranslateActionButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="px-5">
      <Button fullWidth size="lg" disabled={disabled || loading} onClick={onClick}>
        {loading ? t("translator.translating") : t("translator.translate")}
      </Button>
    </div>
  );
}
