/**
 * Headless consent state — storage, validation, purging and Google
 * Consent Mode signalling. No React in here, so non-component code
 * (the redux layout slice, a future analytics loader) can ask the same
 * question the UI asks.
 *
 * The stored record is deliberately explicit rather than a bare boolean:
 * a regulator asking "what exactly did this person agree to, and when?"
 * needs the version and timestamp, not just the answer.
 */

import {
  CATEGORY,
  CATEGORY_STORAGE_KEYS,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  OPTIONAL_CATEGORIES,
} from "@/config/cookies";

const MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const listeners = new Set();

/** Every optional category set to the same answer. */
export const buildCategories = (granted) =>
  OPTIONAL_CATEGORIES.reduce(
    (acc, id) => ({ ...acc, [id]: Boolean(granted) }),
    // Necessary is not a choice — it is recorded as granted so consumers
    // can read one uniform map without special-casing it.
    { [CATEGORY.NECESSARY]: true },
  );

const isUsable = (record) => {
  if (!record || typeof record !== "object") return false;
  // A record written against older category definitions isn't consent to
  // the current ones.
  if (record.version !== CONSENT_VERSION) return false;
  if (!record.categories || typeof record.categories !== "object") return false;
  const age = Date.now() - new Date(record.timestamp).getTime();
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return false;
  return true;
};

/**
 * The visitor's stored decision, or null when they haven't made one —
 * which is also what an expired or superseded record returns, so callers
 * only ever have to handle "decided" vs "not decided".
 */
export const readConsent = () => {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    return isUsable(record) ? record : null;
  } catch {
    // Private-mode lockdown or hand-edited garbage: treat as undecided.
    return null;
  }
};

/** True when `category` may be used right now. */
export const hasConsent = (category) => {
  if (category === CATEGORY.NECESSARY) return true;
  const record = readConsent();
  return Boolean(record?.categories?.[category]);
};

/**
 * Delete storage belonging to categories the visitor just refused.
 *
 * Withdrawal has to be effective, not just prospective — leaving the
 * old values behind would mean "reject" changed nothing for anyone who
 * had already accepted.
 */
const purgeDeniedCategories = (categories) => {
  Object.entries(CATEGORY_STORAGE_KEYS).forEach(([category, keys]) => {
    if (categories[category]) return;
    keys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Storage unavailable — nothing was written either.
      }
    });
  });
};

/**
 * Mirror the decision into Google Consent Mode v2.
 *
 * index.html sets every signal to "denied" before any Google tag can
 * load; this is the matching update. Harmless while no Google tag is
 * installed — it just queues on dataLayer — and correct the moment one
 * is, which is the point of wiring it now rather than later.
 */
const signalConsentMode = (categories) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // Google's documented shim: consent commands must reach dataLayer as
  // an arguments object, not a plain array.
  function gtag() {
    window.dataLayer.push(arguments);
  }
  const granted = (allowed) => (allowed ? "granted" : "denied");
  gtag("consent", "update", {
    ad_storage: granted(categories[CATEGORY.MARKETING]),
    ad_user_data: granted(categories[CATEGORY.MARKETING]),
    ad_personalization: granted(categories[CATEGORY.MARKETING]),
    analytics_storage: granted(categories[CATEGORY.ANALYTICS]),
    functionality_storage: granted(categories[CATEGORY.PREFERENCES]),
    personalization_storage: granted(categories[CATEGORY.PREFERENCES]),
    // Security signals cover anti-fraud (reCAPTCHA) and are exempt.
    security_storage: "granted",
  });
};

const notify = (record) => listeners.forEach((fn) => fn(record));

/**
 * Persist a decision and apply it.
 *
 * `method` records *how* the choice was made — accept-all, reject-all or
 * a per-category save. It is part of the audit trail, not decoration:
 * it distinguishes an informed selection from a one-click dismissal.
 */
export const writeConsent = (categories, method = "custom") => {
  const record = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    method,
    categories: { ...buildCategories(false), ...categories, [CATEGORY.NECESSARY]: true },
  };

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Can't persist (private mode). The in-memory decision below still
    // applies for this page view; we'll simply ask again next visit.
  }

  purgeDeniedCategories(record.categories);
  signalConsentMode(record.categories);
  notify(record);
  return record;
};

/** Wipe the decision so the banner reappears. Used by "withdraw consent". */
export const clearConsent = () => {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Nothing stored to begin with.
  }
  purgeDeniedCategories(buildCategories(false));
  signalConsentMode(buildCategories(false));
  notify(null);
};

/**
 * Subscribe to decisions made anywhere — including in another tab, via
 * the storage event, so a visitor who accepts in one tab isn't still
 * being asked in the other.
 */
export const subscribe = (listener) => {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === CONSENT_STORAGE_KEY) listener(readConsent());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/**
 * Re-send a previously stored decision to Consent Mode on boot.
 *
 * index.html defaults everything to denied on every page load, so a
 * returning visitor's acceptance has to be replayed or their choice
 * would silently degrade to "denied" each visit.
 */
export const replayStoredConsent = () => {
  const record = readConsent();
  if (record) signalConsentMode(record.categories);
  return record;
};

/**
 * Consent-gated localStorage write for preference keys.
 *
 * The redux layout slice calls this instead of localStorage directly, so
 * the Preferences toggle genuinely controls whether UI settings persist
 * rather than being a switch that does nothing.
 */
export const setPreference = (key, value) => {
  if (!hasConsent(CATEGORY.PREFERENCES)) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
