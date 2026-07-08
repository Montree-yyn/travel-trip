import authData from "@/data/auth.json";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const allowedEmails = new Set(
  (Array.isArray(authData.allowedEmails) ? authData.allowedEmails : [])
    .filter((email: unknown): email is string => typeof email === "string" && email.trim().length > 0)
    .map(normalizeEmail),
);

export function isEmailAllowed(email: string | null | undefined) {
  if (!email) return false;
  if (allowedEmails.size === 0) return false;
  return allowedEmails.has(normalizeEmail(email));
}

export function getAllowedEmails() {
  return [...allowedEmails];
}
