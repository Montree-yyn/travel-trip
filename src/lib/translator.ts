import type {
  TranslatorData,
  TranslatorHistoryEntry,
  TranslatorLangCode,
  TranslatorPhrase,
} from "@/types/translator";
import { TRANSLATOR_LANGUAGES } from "@/types/translator";

export const MAX_TRANSLATOR_HISTORY = 50;

export const TRANSLATOR_LANGUAGE_LABELS: Record<
  TranslatorLangCode,
  { labelKey: string; flag: string; native: string }
> = {
  th: { labelKey: "translator.languages.th", flag: "🇹🇭", native: "ไทย" },
  en: { labelKey: "translator.languages.en", flag: "🇺🇸", native: "English" },
  ja: { labelKey: "translator.languages.ja", flag: "🇯🇵", native: "日本語" },
  my: { labelKey: "translator.languages.my", flag: "🇲🇲", native: "မြန်မာ" },
  zh: { labelKey: "translator.languages.zh", flag: "🇨🇳", native: "中文" },
  ko: { labelKey: "translator.languages.ko", flag: "🇰🇷", native: "한국어" },
};

const MOCK_DICTIONARY: Record<string, Partial<Record<TranslatorLangCode, string>>> = {
  hello: {
    th: "สวัสดี",
    en: "Hello",
    ja: "こんにちは",
    my: "မင်္ဂလာပါ",
    zh: "你好",
    ko: "안녕하세요",
  },
  "thank you": {
    th: "ขอบคุณ",
    en: "Thank you",
    ja: "ありがとう",
    my: "ကျေးဇူးတင်ပါတယ်",
    zh: "谢谢",
    ko: "감사합니다",
  },
  "excuse me": {
    th: "ขอโทษ",
    en: "Excuse me",
    ja: "すみません",
    my: "တောင်းပန်ပါတယ်",
    zh: "不好意思",
    ko: "실례합니다",
  },
  "where is the bathroom": {
    th: "ห้องน้ำอยู่ที่ไหน",
    en: "Where is the bathroom?",
    ja: "トイレはどこですか",
    my: "ရေချိုးခန်းဘယ်မှာလဲ",
    zh: "洗手间在哪里？",
    ko: "화장실이 어디예요?",
  },
  "how much": {
    th: "เท่าไหร่",
    en: "How much?",
    ja: "いくらですか",
    my: "ဘယ်လောက်လဲ",
    zh: "多少钱？",
    ko: "얼마예요?",
  },
};

export function createTranslatorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isTranslatorLangCode(value: unknown): value is TranslatorLangCode {
  return typeof value === "string" && TRANSLATOR_LANGUAGES.includes(value as TranslatorLangCode);
}

function normalizePhrase(value: unknown): TranslatorPhrase | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TranslatorPhrase>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.sourceText !== "string" ||
    typeof candidate.translatedText !== "string" ||
    !isTranslatorLangCode(candidate.sourceLang) ||
    !isTranslatorLangCode(candidate.targetLang) ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    sourceText: candidate.sourceText.trim(),
    translatedText: candidate.translatedText.trim(),
    sourceLang: candidate.sourceLang,
    targetLang: candidate.targetLang,
    favorited: Boolean(candidate.favorited),
    createdAt: candidate.createdAt,
  };
}

function normalizeHistoryEntry(value: unknown): TranslatorHistoryEntry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TranslatorHistoryEntry>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.sourceText !== "string" ||
    typeof candidate.translatedText !== "string" ||
    !isTranslatorLangCode(candidate.sourceLang) ||
    !isTranslatorLangCode(candidate.targetLang) ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    sourceText: candidate.sourceText.trim(),
    translatedText: candidate.translatedText.trim(),
    sourceLang: candidate.sourceLang,
    targetLang: candidate.targetLang,
    createdAt: candidate.createdAt,
  };
}

export function normalizeTranslatorData(value: unknown): TranslatorData {
  if (!value || typeof value !== "object") {
    return { phrasebook: [], history: [] };
  }

  const candidate = value as Partial<TranslatorData>;
  return {
    phrasebook: Array.isArray(candidate.phrasebook)
      ? candidate.phrasebook.map(normalizePhrase).filter((entry): entry is TranslatorPhrase => entry !== null)
      : [],
    history: Array.isArray(candidate.history)
      ? candidate.history
          .map(normalizeHistoryEntry)
          .filter((entry): entry is TranslatorHistoryEntry => entry !== null)
          .slice(0, MAX_TRANSLATOR_HISTORY)
      : [],
  };
}

export function trimTranslatorHistory(history: TranslatorHistoryEntry[]) {
  return history.slice(0, MAX_TRANSLATOR_HISTORY);
}

function lookupMockDictionary(text: string, target: TranslatorLangCode) {
  const key = text.trim().toLowerCase();
  return MOCK_DICTIONARY[key]?.[target];
}

function mockFallbackTranslation(text: string, target: TranslatorLangCode) {
  const label = TRANSLATOR_LANGUAGE_LABELS[target].native;
  return `[${label}] ${text.trim()}`;
}

/** Local mock translator — replace with Google Cloud Translation in a later phase. */
export async function mockTranslate(
  text: string,
  source: TranslatorLangCode,
  target: TranslatorLangCode,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("translator.errors.emptyInput");
  }

  if (source === target) {
    return trimmed;
  }

  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250));

  const dictionaryHit = lookupMockDictionary(trimmed, target);
  if (dictionaryHit) return dictionaryHit;

  return mockFallbackTranslation(trimmed, target);
}

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
