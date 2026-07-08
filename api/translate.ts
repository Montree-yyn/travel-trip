import type { VercelRequest, VercelResponse } from "@vercel/node";

// Server-only Google Cloud Translation (Basic / v2) proxy.
// The API key is read ONLY from environment variables here, never sent to the
// client. If the key is missing or the upstream call fails, we respond with a
// 502/503 error code so the client falls back to its local mock translator.

const SUPPORTED_LANGS = new Set(["th", "en", "ja", "my", "zh", "ko"]);
const MAX_TEXT_LENGTH = 2000;
const UPSTREAM_TIMEOUT_MS = 10_000;

const GOOGLE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

interface GoogleTranslateSuccess {
  data?: {
    translations?: Array<{ translatedText?: unknown }>;
  };
}

interface GoogleTranslateError {
  error?: { message?: unknown };
}

function sendUnavailable(res: VercelResponse, status: 502 | 503) {
  //TRANSLATE_UNAVAILABLE is the only error code the client reacts to; it then
  // falls back to mock translation and shows a friendly notice.
  res.status(status).json({ error: "TRANSLATE_UNAVAILABLE" });
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).setHeader("Allow", "POST").json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const { text, source, target } = body as {
    text?: unknown;
    source?: unknown;
    target?: unknown;
  };

  if (!isString(text) || !isString(source) || !isString(target)) {
    res.status(400).json({ error: "INVALID_REQUEST" });
    return;
  }

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) {
    res.status(400).json({ error: "INVALID_REQUEST" });
    return;
  }

  if (!SUPPORTED_LANGS.has(source) || !SUPPORTED_LANGS.has(target)) {
    res.status(400).json({ error: "UNSUPPORTED_LANGUAGE" });
    return;
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    // No key configured → client uses mock translation.
    sendUnavailable(res, 503);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${GOOGLE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q: trimmed, source, target, format: "text" }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      sendUnavailable(res, 502);
      return;
    }

    const json = (await upstream.json()) as GoogleTranslateSuccess | GoogleTranslateError;

    if (json && "error" in json) {
      sendUnavailable(res, 502);
      return;
    }

    const translatedText = json?.data?.translations?.[0]?.translatedText;
    if (!isString(translatedText) || !translatedText.trim()) {
      sendUnavailable(res, 502);
      return;
    }

    res.status(200).json({ translatedText, provider: "google" });
  } catch {
    // Network failure, abort (timeout), or JSON parse error → mock fallback.
    sendUnavailable(res, 502);
  } finally {
    clearTimeout(timer);
  }
}
