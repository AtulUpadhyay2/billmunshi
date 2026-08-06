import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATEGORY } from "@/config/cookies";
import {
  buildCategories,
  clearConsent,
  readConsent,
  replayStoredConsent,
  subscribe,
  writeConsent,
} from "@/utils/cookieConsent";
import CookieBanner from "./CookieBanner";
import CookiePreferences from "./CookiePreferences";

const CookieConsentContext = createContext(null);

/**
 * Consent state for the whole app, plus the banner and preferences UI.
 *
 * Mount once, above the router. Anything that needs to know whether it
 * may run — an analytics loader, an embedded video, a chat widget —
 * asks through `useCookieConsent()` rather than reading storage itself.
 */
export const CookieConsentProvider = ({ children }) => {
  // `undefined` means "haven't looked yet" and is what keeps the banner
  // from flashing on-screen for a visitor who decided months ago.
  const [consent, setConsent] = useState(undefined);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(replayStoredConsent());
    // Keeps tabs in step: deciding in one closes the banner in the rest.
    return subscribe(setConsent);
  }, []);

  const acceptAll = useCallback(() => {
    setConsent(writeConsent(buildCategories(true), "accept_all"));
    setPreferencesOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    setConsent(writeConsent(buildCategories(false), "reject_all"));
    setPreferencesOpen(false);
  }, []);

  const saveSelection = useCallback((categories) => {
    setConsent(writeConsent(categories, "custom"));
    setPreferencesOpen(false);
  }, []);

  const withdraw = useCallback(() => {
    clearConsent();
    setConsent(null);
    setPreferencesOpen(false);
  }, []);

  const hasConsent = useCallback(
    (category) =>
      category === CATEGORY.NECESSARY ||
      Boolean(consent?.categories?.[category]),
    [consent],
  );

  const value = useMemo(
    () => ({
      /** The stored record, `null` if undecided, `undefined` while loading. */
      consent,
      /** True once the visitor has answered. */
      hasDecided: Boolean(consent),
      hasConsent,
      acceptAll,
      rejectAll,
      saveSelection,
      withdraw,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
    }),
    [consent, hasConsent, acceptAll, rejectAll, saveSelection, withdraw],
  );

  // Undecided and not loading — the banner is the only thing standing
  // between us and writing storage we have no permission for.
  const showBanner = consent === null && !preferencesOpen;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomise={() => setPreferencesOpen(true)}
        />
      )}
      {preferencesOpen && (
        <CookiePreferences
          initial={consent?.categories ?? buildCategories(false)}
          onSave={saveSelection}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onClose={() => setPreferencesOpen(false)}
        />
      )}
    </CookieConsentContext.Provider>
  );
};

/**
 * Read consent and open the preferences panel.
 *
 * Safe to call outside the provider — it degrades to "nothing is
 * consented", which is the correct assumption when the consent layer
 * isn't mounted.
 */
export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (ctx) return ctx;
  return {
    consent: null,
    hasDecided: false,
    hasConsent: (category) => category === CATEGORY.NECESSARY,
    acceptAll: () => {},
    rejectAll: () => {},
    saveSelection: () => {},
    withdraw: () => {},
    openPreferences: () => {},
    closePreferences: () => {},
  };
};

export default CookieConsentProvider;
