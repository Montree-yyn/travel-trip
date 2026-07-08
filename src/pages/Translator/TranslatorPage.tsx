import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  DataErrorState,
  EmptyState,
  GenericPageSkeleton,
  SectionHeader,
  SegmentedControl,
  ThemeToggle,
} from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { staggerContainer } from "@/design-system/motion";
import { usePersistentTranslator } from "@/hooks/usePersistentTranslator";
import { useTranslation } from "@/i18n";
import { copyTextToClipboard } from "@/lib/translator";
import { translateText } from "@/lib/translateService";
import { useTripSync } from "@/sync";
import type { TranslatorHistoryEntry, TranslatorLangCode, TranslatorPhrase } from "@/types/translator";

import { HistoryList } from "./components/HistoryList";
import { LanguageSelectorRow } from "./components/LanguageSelectorRow";
import { PhrasebookList } from "./components/PhrasebookList";
import { TranslateActionButton, TranslateOutputCard } from "./components/TranslateOutputCard";
import { TranslateInputCard } from "./components/TranslateInputCard";

type TranslatorTab = "translate" | "phrasebook" | "history";

const LAST_SOURCE_KEY = "travel-trip-translator-source-lang";
const LAST_TARGET_KEY = "travel-trip-translator-target-lang";

function readStoredLang(key: string, fallback: TranslatorLangCode): TranslatorLangCode {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === "th" || stored === "en" || stored === "ja" || stored === "my" || stored === "zh" || stored === "ko") {
    return stored;
  }
  return fallback;
}

export function TranslatorPage() {
  const { t } = useTranslation();
  const { ready, error, retry } = useTripSync();
  const {
    phrasebook,
    history,
    addHistoryEntry,
    savePhrase,
    togglePhraseFavorite,
    removePhrase,
    removeHistoryEntry,
    clearHistory,
    findPhrase,
  } = usePersistentTranslator();

  const [tab, setTab] = useState<TranslatorTab>("translate");
  const [sourceLang, setSourceLang] = useState<TranslatorLangCode>(() => readStoredLang(LAST_SOURCE_KEY, "en"));
  const [targetLang, setTargetLang] = useState<TranslatorLangCode>(() => readStoredLang(LAST_TARGET_KEY, "ja"));
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [translateErrorKey, setTranslateErrorKey] = useState<string | null>(null);
  // Shown when the API route was unavailable and we used the mock translator.
  const [mockNotice, setMockNotice] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);

  const savedPhrase = useMemo(
    () => (outputText ? findPhrase(inputText, sourceLang, targetLang) : null),
    [findPhrase, inputText, outputText, sourceLang, targetLang],
  );

  const handleSourceChange = useCallback((lang: TranslatorLangCode) => {
    setSourceLang(lang);
    window.localStorage.setItem(LAST_SOURCE_KEY, lang);
    setOutputText(null);
    setTranslateErrorKey(null);
  }, []);

  const handleTargetChange = useCallback((lang: TranslatorLangCode) => {
    setTargetLang(lang);
    window.localStorage.setItem(LAST_TARGET_KEY, lang);
    setOutputText(null);
    setTranslateErrorKey(null);
  }, []);

  const handleSwap = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    window.localStorage.setItem(LAST_SOURCE_KEY, targetLang);
    window.localStorage.setItem(LAST_TARGET_KEY, sourceLang);
    setInputText(outputText ?? inputText);
    setOutputText(null);
    setTranslateErrorKey(null);
  }, [inputText, outputText, sourceLang, targetLang]);

  const handleTranslate = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setTranslateErrorKey("translator.errors.emptyInput");
      setOutputText(null);
      return;
    }

    setLoading(true);
    setTranslateErrorKey(null);
    setOutputText(null);
    setMockNotice(false);

    try {
      const { text: translated, usedMock } = await translateText(trimmed, sourceLang, targetLang);
      setOutputText(translated);
      if (usedMock) {
        setMockNotice(true);
        window.setTimeout(() => setMockNotice(false), 3000);
      }
      addHistoryEntry({
        sourceText: trimmed,
        translatedText: translated,
        sourceLang,
        targetLang,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "translator.errors.failed";
      setTranslateErrorKey(message.startsWith("translator.") ? message : "translator.errors.failed");
    } finally {
      setLoading(false);
    }
  }, [addHistoryEntry, inputText, sourceLang, targetLang]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    await copyTextToClipboard(outputText);
    setCopyNotice(true);
    window.setTimeout(() => setCopyNotice(false), 1500);
  }, [outputText]);

  const handleSavePhrase = useCallback(() => {
    if (!outputText) return;
    savePhrase({
      sourceText: inputText,
      translatedText: outputText,
      sourceLang,
      targetLang,
    });
  }, [inputText, outputText, savePhrase, sourceLang, targetLang]);

  const handleToggleFavorite = useCallback(() => {
    if (!outputText) return;

    const existing = findPhrase(inputText, sourceLang, targetLang);
    if (existing) {
      togglePhraseFavorite(existing.id);
      return;
    }

    savePhrase({
      sourceText: inputText,
      translatedText: outputText,
      sourceLang,
      targetLang,
      favorited: true,
    });
  }, [findPhrase, inputText, outputText, savePhrase, sourceLang, targetLang, togglePhraseFavorite]);

  const applyPhrase = useCallback((phrase: TranslatorPhrase | TranslatorHistoryEntry) => {
    setSourceLang(phrase.sourceLang);
    setTargetLang(phrase.targetLang);
    setInputText(phrase.sourceText);
    setOutputText(phrase.translatedText);
    setTranslateErrorKey(null);
    setTab("translate");
  }, []);

  const showInitialEmpty =
    tab === "translate" && !inputText.trim() && !outputText && !loading && history.length === 0 && phrasebook.length === 0;

  if (!ready) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
        <GenericPageSkeleton />
      </div>
    );
  }

  return (
    <PageAccent tone="indigo">
      <PageLoadingGate>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-28">
          <PageHeader title={t("translator.title")} subtitle={t("translator.subtitle")} actions={<ThemeToggle />} />

          {error && (
            <div className="px-5">
              <DataErrorState
                titleKey="translator.syncErrorTitle"
                descriptionKey="sync.unavailable"
                onRetry={retry}
              />
            </div>
          )}

          <div className="px-5">
            <SegmentedControl
              className="flex w-full"
              value={tab}
              onChange={setTab}
              options={[
                { value: "translate", label: t("translator.tabs.translate") },
                { value: "phrasebook", label: t("translator.tabs.phrasebook") },
                { value: "history", label: t("translator.tabs.history") },
              ]}
            />
          </div>

          {tab === "translate" && (
            <>
              {showInitialEmpty && (
                <EmptyState
                  icon={Languages}
                  title={t("translator.emptyTitle")}
                  description={t("translator.emptyDescription")}
                />
              )}

              <LanguageSelectorRow
                sourceLang={sourceLang}
                targetLang={targetLang}
                onSourceChange={handleSourceChange}
                onTargetChange={handleTargetChange}
                onSwap={handleSwap}
              />

              <TranslateInputCard value={inputText} sourceLang={sourceLang} onChange={setInputText} />

              <TranslateActionButton
                disabled={!inputText.trim()}
                loading={loading}
                onClick={() => void handleTranslate()}
              />

              <TranslateOutputCard
                text={outputText}
                targetLang={targetLang}
                loading={loading}
                errorKey={translateErrorKey}
                saved={Boolean(savedPhrase)}
                favorited={Boolean(savedPhrase?.favorited)}
                onCopy={() => void handleCopy()}
                onSave={handleSavePhrase}
                onToggleFavorite={handleToggleFavorite}
              />

              {mockNotice && (
                <p className="px-5 text-center text-xs text-ink-muted">{t("translator.usingMock")}</p>
              )}

              {copyNotice && (
                <p className="px-5 text-center text-sm font-medium text-accent-strong">{t("common.copied")}</p>
              )}
            </>
          )}

          {tab === "phrasebook" && (
            <>
              <SectionHeader title={t("translator.phrasebookTitle")} />
              <PhrasebookList
                phrases={phrasebook}
                onToggleFavorite={togglePhraseFavorite}
                onRemove={removePhrase}
                onSelect={applyPhrase}
              />
            </>
          )}

          {tab === "history" && (
            <>
              <SectionHeader title={t("translator.historyTitle")} />
              <HistoryList
                history={history}
                onRemove={removeHistoryEntry}
                onSelect={applyPhrase}
                onClear={clearHistory}
              />
            </>
          )}
        </motion.div>
      </PageLoadingGate>
    </PageAccent>
  );
}

export default TranslatorPage;
