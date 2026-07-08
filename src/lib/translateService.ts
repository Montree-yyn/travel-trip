import { mockTranslate } from "@/lib/translator";
import type { TranslatorLangCode } from "@/types/translator";

// Safe translation service layer.
//
// The client never calls Google directly. It talks to our same-origin Vercel
// API route (`/api/translate`), which holds the API key server-side. If the
// route is unavailable, errors, or times out, we transparently fall back to
// the existing mock translator so the UI always returns a result.

const API_ROUTE = "/api/translate";
const REQUEST_TIMEOUT_MS = 12_000;

export interface TranslateResult {
  text: string;
  /** True when the result came from the local mock fallback rather than the API. */
  usedMock: boolean;
}

interface TranslateApiResponse {
  translatedText?: unknown;
  provider?: unknown;
  error?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function callTranslateApi(
  text: string,
  source: TranslatorLangCode,
  target: TranslatorLangCode,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, source, target }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("translator.errors.failed");
    }

    const payload = (await response.json()) as TranslateApiResponse;
    if (!isNonEmptyString(payload.translatedText)) {
      throw new Error("translator.errors.failed");
    }

    return payload.translatedText;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translate `text` from `source` to `target`.
 *
 * Tries the server API route first; on any failure (network, timeout, non-2xx,
 * bad payload, missing key) it falls back to the local mock translator and
 * reports `usedMock: true` so the UI can show a friendly notice.
 */
export async function translateText(
  text: string,
  source: TranslatorLangCode,
  target: TranslatorLangCode,
): Promise<TranslateResult> {
  try {
    const translated = await callTranslateApi(text, source, target);
    return { text: translated, usedMock: false };
  } catch {
    const translated = await mockTranslate(text, source, target);
    return { text: translated, usedMock: true };
  }
}
