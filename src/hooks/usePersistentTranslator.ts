import { useCallback, useEffect, useRef, useState } from "react";

import {
  createTranslatorId,
  trimTranslatorHistory,
} from "@/lib/translator";
import { readTranslatorFromStorage, writeTranslatorToStorage } from "@/sync/localStorage";
import { useTripSync } from "@/sync/TripSyncProvider";
import type {
  TranslatorData,
  TranslatorHistoryEntry,
  TranslatorLangCode,
  TranslatorPhrase,
} from "@/types/translator";

export interface SavePhraseInput {
  sourceText: string;
  translatedText: string;
  sourceLang: TranslatorLangCode;
  targetLang: TranslatorLangCode;
  favorited?: boolean;
}

function phraseKey(sourceText: string, sourceLang: TranslatorLangCode, targetLang: TranslatorLangCode) {
  return `${sourceLang}:${targetLang}:${sourceText.trim().toLowerCase()}`;
}

export function usePersistentTranslator() {
  const { ready, syncVersion, saveTranslator } = useTripSync();
  const [data, setData] = useState<TranslatorData>(() => readTranslatorFromStorage());
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!ready) return;
    skipNextSave.current = true;
    setData(readTranslatorFromStorage());
  }, [ready, syncVersion]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    writeTranslatorToStorage(data);
    void saveTranslator(data);
  }, [data, ready, saveTranslator]);

  const addHistoryEntry = useCallback((input: SavePhraseInput) => {
    const entry: TranslatorHistoryEntry = {
      id: createTranslatorId(),
      sourceText: input.sourceText.trim(),
      translatedText: input.translatedText.trim(),
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({
      ...current,
      history: trimTranslatorHistory([entry, ...current.history.filter((item) => item.id !== entry.id)]),
    }));

    return entry;
  }, []);

  const savePhrase = useCallback((input: SavePhraseInput) => {
    const key = phraseKey(input.sourceText, input.sourceLang, input.targetLang);

    setData((current) => {
      const existing = current.phrasebook.find(
        (phrase) => phraseKey(phrase.sourceText, phrase.sourceLang, phrase.targetLang) === key,
      );

      if (existing) {
        return {
          ...current,
          phrasebook: current.phrasebook.map((phrase) =>
            phrase.id === existing.id
              ? {
                  ...phrase,
                  translatedText: input.translatedText.trim(),
                  favorited: input.favorited ?? phrase.favorited,
                }
              : phrase,
          ),
        };
      }

      const phrase: TranslatorPhrase = {
        id: createTranslatorId(),
        sourceText: input.sourceText.trim(),
        translatedText: input.translatedText.trim(),
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        favorited: input.favorited ?? false,
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        phrasebook: [phrase, ...current.phrasebook],
      };
    });
  }, []);

  const togglePhraseFavorite = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      phrasebook: current.phrasebook.map((phrase) =>
        phrase.id === id ? { ...phrase, favorited: !phrase.favorited } : phrase,
      ),
    }));
  }, []);

  const removePhrase = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      phrasebook: current.phrasebook.filter((phrase) => phrase.id !== id),
    }));
  }, []);

  const removeHistoryEntry = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      history: current.history.filter((entry) => entry.id !== id),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setData((current) => ({ ...current, history: [] }));
  }, []);

  const findPhrase = useCallback(
    (sourceText: string, sourceLang: TranslatorLangCode, targetLang: TranslatorLangCode) => {
      const key = phraseKey(sourceText, sourceLang, targetLang);
      return data.phrasebook.find(
        (phrase) => phraseKey(phrase.sourceText, phrase.sourceLang, phrase.targetLang) === key,
      ) ?? null;
    },
    [data.phrasebook],
  );

  return {
    phrasebook: data.phrasebook,
    history: data.history,
    addHistoryEntry,
    savePhrase,
    togglePhraseFavorite,
    removePhrase,
    removeHistoryEntry,
    clearHistory,
    findPhrase,
  };
}
