import { motion } from "framer-motion";

import { GlassCard } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { TRANSLATOR_LANGUAGE_LABELS } from "@/lib/translator";
import type { TranslatorLangCode } from "@/types/translator";

export interface TranslateInputCardProps {
  value: string;
  sourceLang: TranslatorLangCode;
  onChange: (value: string) => void;
}

export function TranslateInputCard({ value, sourceLang, onChange }: TranslateInputCardProps) {
  const { t } = useTranslation();
  const meta = TRANSLATOR_LANGUAGE_LABELS[sourceLang];

  return (
    <motion.div variants={scaleIn} className="mx-5">
      <GlassCard padding="lg" className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <span className="text-xl leading-none">{meta.flag}</span>
          {t("translator.inputLabel")}
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("translator.inputPlaceholder")}
          rows={4}
          className="min-h-[7rem] w-full resize-none bg-transparent text-lg leading-relaxed text-ink outline-none placeholder:text-ink-faint"
        />
        <p className="text-xs text-ink-faint">{t("translator.mockHint")}</p>
      </GlassCard>
    </motion.div>
  );
}
