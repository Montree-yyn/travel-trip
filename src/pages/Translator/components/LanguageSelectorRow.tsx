import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";

import { FilterChips } from "@/components/ui";
import { scaleIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { TRANSLATOR_LANGUAGE_LABELS } from "@/lib/translator";
import { TRANSLATOR_LANGUAGES, type TranslatorLangCode } from "@/types/translator";

export interface LanguageSelectorRowProps {
  sourceLang: TranslatorLangCode;
  targetLang: TranslatorLangCode;
  onSourceChange: (lang: TranslatorLangCode) => void;
  onTargetChange: (lang: TranslatorLangCode) => void;
  onSwap: () => void;
}

export function LanguageSelectorRow({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
}: LanguageSelectorRowProps) {
  const { t } = useTranslation();

  const options = TRANSLATOR_LANGUAGES.map((code) => ({
    value: code,
    label: `${TRANSLATOR_LANGUAGE_LABELS[code].flag} ${t(TRANSLATOR_LANGUAGE_LABELS[code].labelKey)}`,
  }));

  return (
    <motion.div variants={scaleIn} className="relative mx-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("translator.sourceLanguage")}
        </span>
        <FilterChips options={options} value={sourceLang} onChange={onSourceChange} variant="floating" />
      </div>

      <motion.button
        type="button"
        onClick={onSwap}
        whileTap={{ scale: 0.9, rotate: 180 }}
        aria-label={t("translator.swapLanguages")}
        className="glow-accent mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent-strong text-white"
      >
        <ArrowUpDown size={20} />
      </motion.button>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("translator.targetLanguage")}
        </span>
        <FilterChips options={options} value={targetLang} onChange={onTargetChange} variant="floating" />
      </div>
    </motion.div>
  );
}
