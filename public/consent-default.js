/**
 * Google Consent Mode v2 — default state.
 *
 * Must run before any Google tag (GTM, GA4, Ads) so nothing can read or
 * write storage before the visitor has answered the banner. Everything
 * starts denied except security_storage, which covers anti-fraud
 * (reCAPTCHA) and is exempt from consent.
 *
 * src/utils/cookieConsent.js sends the matching 'update' once a choice
 * exists, and replays it on every page load.
 *
 * This lives in its own file rather than inline so the Content-Security
 * -Policy can be `script-src 'self'` — an inline block would force
 * either 'unsafe-inline', which defeats the policy, or a hash that
 * silently breaks the page the next time this file is edited.
 */
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  // Give the stored decision a moment to replay before tags fire, so a
  // returning visitor isn't measured as a refusal.
  wait_for_update: 500,
});
