import React from "react";
import { useCookieConsent } from "./CookieConsentProvider";

/**
 * "Cookie settings" trigger for footers.
 *
 * Consent has to be as easy to withdraw as it was to give, which in
 * practice means a permanent, findable control — not a one-time banner.
 * Rendered as a button rather than a link because it opens a dialog and
 * navigates nowhere.
 */
const CookieSettingsLink = ({ className = "", children }) => {
  const { openPreferences } = useCookieConsent();

  return (
    <button type="button" onClick={openPreferences} className={className}>
      {children || "Cookie Settings"}
    </button>
  );
};

export default CookieSettingsLink;
