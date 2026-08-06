/**
 * Cookie & local-storage registry.
 *
 * This file is the single source of truth for three things that must
 * never drift apart: the consent categories the banner offers, the
 * storage keys each category owns, and the disclosure table shown on the
 * cookie policy page. Adding a tracker means adding it here — nothing
 * else needs editing, and the policy page updates itself.
 *
 * The model is opt-in (GDPR / ePrivacy, and India's DPDP Act 2023):
 * nothing outside NECESSARY is written until the visitor actively
 * agrees, refusing is exactly as easy as agreeing, and withdrawing
 * consent deletes what was already stored.
 */

// Bump when the categories or their purposes change materially — every
// visitor is then re-asked, because consent to the old terms isn't
// consent to the new ones. Cosmetic copy edits don't warrant a bump.
export const CONSENT_VERSION = 1;

export const CONSENT_STORAGE_KEY = "bm_cookie_consent";

// Regulators treat consent as going stale; 12 months is the common
// supervisory-authority guidance and what most CMPs ship with.
export const CONSENT_MAX_AGE_DAYS = 365;

export const CATEGORY = {
  NECESSARY: "necessary",
  PREFERENCES: "preferences",
  ANALYTICS: "analytics",
  MARKETING: "marketing",
};

/**
 * Categories in the order they appear in the preferences panel.
 *
 * `items` documents every cookie or storage entry we are responsible
 * for. `required: true` renders the toggle locked on — those entries
 * are exempt from consent because the service cannot be delivered
 * without them.
 */
export const COOKIE_CATEGORIES = [
  {
    id: CATEGORY.NECESSARY,
    required: true,
    name: "Strictly necessary",
    summary:
      "Needed for the site to work — signing in, keeping you signed in, and blocking automated abuse. These are always on and can't be switched off.",
    items: [
      {
        name: "access_token, refresh_token",
        type: "Local storage",
        provider: "Bill Munshi",
        purpose: "Keeps you signed in and refreshes your session securely.",
        duration: "Until you sign out",
      },
      {
        name: "user, selected_org",
        type: "Local storage",
        provider: "Bill Munshi",
        purpose:
          "Remembers who is signed in and which organisation's data to show.",
        duration: "Until you sign out",
      },
      {
        name: CONSENT_STORAGE_KEY,
        type: "Local storage",
        provider: "Bill Munshi",
        purpose:
          "Stores the cookie choices you made here, so we don't ask again on every page.",
        duration: `${CONSENT_MAX_AGE_DAYS} days`,
      },
      {
        name: "_GRECAPTCHA",
        type: "Cookie",
        provider: "Google reCAPTCHA",
        purpose:
          "Tells humans from bots on the sign-up and demo-request forms. Set only when you use those forms.",
        duration: "6 months",
      },
      {
        name: "csrftoken",
        type: "Cookie",
        provider: "Bill Munshi",
        purpose:
          "Protects form submissions against cross-site request forgery.",
        duration: "1 year",
      },
    ],
  },
  {
    id: CATEGORY.PREFERENCES,
    required: false,
    name: "Preferences",
    summary:
      "Remembers how you like the app to look — dark mode, sidebar layout, text direction. Turning this off keeps everything working; your choices just won't survive a reload.",
    items: [
      {
        name: "darkMode, semiDarkMode, skin, monochrome",
        type: "Local storage",
        provider: "Bill Munshi",
        purpose: "Remembers your theme and colour choices.",
        duration: "Until you clear your browser storage",
      },
      {
        name: "sidebarCollapsed, type, direction",
        type: "Local storage",
        provider: "Bill Munshi",
        purpose:
          "Remembers your sidebar, layout and text-direction settings.",
        duration: "Until you clear your browser storage",
      },
    ],
  },
  {
    id: CATEGORY.ANALYTICS,
    required: false,
    name: "Analytics",
    summary:
      "Helps us understand which pages are useful and where people get stuck, so we can improve the product. Aggregated — never used to identify you personally.",
    items: [],
  },
  {
    id: CATEGORY.MARKETING,
    required: false,
    name: "Marketing",
    summary:
      "Lets us measure which campaigns bring people here and show relevant ads elsewhere. Off unless you turn it on.",
    items: [],
  },
];

/**
 * Storage keys owned by each optional category.
 *
 * Withdrawing consent has to actually remove what was stored, not just
 * stop writing more — this map is what makes that possible. NECESSARY
 * is deliberately absent: those keys are never purged.
 */
export const CATEGORY_STORAGE_KEYS = {
  [CATEGORY.PREFERENCES]: [
    "darkMode",
    "semiDarkMode",
    "skin",
    "monochrome",
    "sidebarCollapsed",
    "type",
    "direction",
  ],
  [CATEGORY.ANALYTICS]: [],
  [CATEGORY.MARKETING]: [],
};

/** Category ids a visitor can actually choose between. */
export const OPTIONAL_CATEGORIES = COOKIE_CATEGORIES.filter(
  (c) => !c.required,
).map((c) => c.id);
