export const TRANSLATOR_LANGUAGES = ["th", "en", "ja", "my", "zh", "ko"] as const;

export type TranslatorLangCode = (typeof TRANSLATOR_LANGUAGES)[number];

export interface TranslatorPhrase {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: TranslatorLangCode;
  targetLang: TranslatorLangCode;
  favorited: boolean;
  createdAt: string;
}

export interface TranslatorHistoryEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: TranslatorLangCode;
  targetLang: TranslatorLangCode;
  createdAt: string;
}

export interface TranslatorData {
  phrasebook: TranslatorPhrase[];
  history: TranslatorHistoryEntry[];
}
