// Google reCAPTCHA v2 ("I'm not a robot") — reads VITE_RECAPTCHA_SITE_KEY.
//
// The site key is public by design: it identifies the widget to Google
// and is visible in the rendered page. The matching SECRET key lives
// only in the backend's RECAPTCHA_SECRET_KEY and is what actually
// validates a token.
export const RECAPTCHA_CONFIG = {
  SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || "",
};

// With no site key configured the widget is skipped and forms submit
// without a token. The backend mirrors this: no secret means no
// verification, so dev works out of the box.
export const isRecaptchaConfigured = () => Boolean(RECAPTCHA_CONFIG.SITE_KEY);
