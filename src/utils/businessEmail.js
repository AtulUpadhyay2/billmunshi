/**
 * Business-email validation for public lead forms.
 *
 * This mirrors `apps/common/validators.py` on the backend so the user gets
 * instant inline feedback. It is a UX convenience only — the API performs
 * the same check and is the actual source of truth, since anything
 * enforced in the browser can be bypassed.
 *
 * Keep this list in sync with FREE_EMAIL_DOMAINS in the backend validator.
 */
export const FREE_EMAIL_DOMAINS = new Set([
  // Global consumer providers
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.in", "ymail.com", "rocketmail.com",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "outlook.in", "live.com", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me", "pm.me",
  "zoho.com", "zohomail.com",
  "gmx.com", "gmx.net", "mail.com", "inbox.com", "fastmail.com",
  "yandex.com", "yandex.ru", "tutanota.com", "hushmail.com",
  // India-specific consumer providers
  "rediffmail.com", "rediff.com", "sify.com", "indiatimes.com",
  "bsnl.in", "bsnl.co.in", "vsnl.net", "vsnl.com", "airtelmail.in",
  // Disposable / throwaway
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "trashmail.com",
  "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PERSONAL_EMAIL_MESSAGE =
  "Please use your work email address. Personal email accounts (Gmail, Yahoo, Outlook, etc.) are not accepted.";

/** True when `email` is syntactically valid and not a free/disposable mailbox. */
export const isBusinessEmail = (email) => {
  const value = (email || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(value)) return false;
  return !FREE_EMAIL_DOMAINS.has(value.split("@")[1]);
};

/** Returns an error string for the given email, or "" when it is acceptable. */
export const validateBusinessEmail = (email) => {
  const value = (email || "").trim();
  if (!value) return "Work email is required.";
  if (!EMAIL_PATTERN.test(value)) return "Please enter a valid email address.";
  if (FREE_EMAIL_DOMAINS.has(value.toLowerCase().split("@")[1])) {
    return PERSONAL_EMAIL_MESSAGE;
  }
  return "";
};
