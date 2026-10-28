import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Content-Security-Policy for the built app.
 *
 * Every origin here was enumerated from source, not guessed:
 *   script  self + www.google.com / www.gstatic.com (reCAPTCHA)
 *   style   self + fonts.googleapis.com + unpkg.com (leaflet)
 *           'unsafe-inline' is unavoidable — React renders style=""
 *           attributes for any component taking a style prop. Inline
 *           style is a far weaker vector than inline script, which is
 *           not permitted at all.
 *   font    fonts.gstatic.com
 *   img     api.iconify.design (reached from CSS `content: url(...)`)
 *           plus the API host, which serves signed bill documents
 *   frame   the API host (bill PDFs render in an iframe) and
 *           www.google.com (reCAPTCHA)
 *
 * Injected at build time only. In dev, Vite's HMR opens a websocket and
 * serves its own module graph; a connect-src that did not name ws://
 * would break the dev server for everyone — a poor trade for a policy
 * that only needs to protect production.
 *
 * `frame-ancestors` is ignored when a policy arrives in a meta tag; it
 * has to be a real header. The nginx block that sets it, and repeats
 * this policy as a header, is in
 * backend/docs/frontend_security_review.md.
 *
 * If a Google tag (GTM/GA4) is ever added — the consent-mode defaults
 * in public/consent-default.js anticipate one — script-src and
 * connect-src will need googletagmanager.com and google-analytics.com.
 * It will fail loudly rather than silently, which is the intent.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.iconify.design https://billmunshi.com https://api.billmunshi.com",
  "connect-src 'self' https://billmunshi.com https://api.billmunshi.com",
  "frame-src 'self' blob: https://www.google.com https://billmunshi.com https://api.billmunshi.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const injectCsp = () => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml(html) {
    const tags = [
      `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      `<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    ].join("\n    ");
    return html.replace(
      /<meta charset="UTF-8"\s*\/?>/i,
      (charset) => `${charset}\n    ${tags}`,
    );
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },

  define: {
    __DEV__: JSON.stringify(true),
  },

  plugins: [react(), injectCsp()],
});
