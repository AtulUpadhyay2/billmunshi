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
  "img-src 'self' data: blob: https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com https://billmunshi.com https://api.billmunshi.com",
  // @iconify/react fetches its icon data at runtime, so the Iconify
  // hosts belong in connect-src — not only img-src, which covers the
  // CSS `content: url(...)` case. Without them every icon in the
  // product silently fails to render: the policy blocks the fetch, the
  // component gets nothing back and draws an empty box. Caught by
  // booting the built bundle in a headless browser and reading the
  // console; the build itself is perfectly happy either way.
  //
  // simplesvg.com and unisvg.com are Iconify's own fallback hosts, and
  // the library tries all three.
  "connect-src 'self' https://billmunshi.com https://api.billmunshi.com "
    + "https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
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

  build: {
    rollupOptions: {
      output: {
        /**
         * Keep the dependencies in their own chunks, apart from the
         * app's own code.
         *
         * Everything was in one entry chunk, so shipping a one-line
         * fix changed its hash and every returning client re-downloaded
         * React, Redux, react-query and the rest along with it. Split,
         * a deploy only invalidates the app chunk; the dependency
         * chunks stay in cache until a dependency actually changes.
         *
         * First-load bytes are unchanged — the same code arrives, in
         * more than one request over the same connection.
         *
         * Grouped coarsely and by family on purpose. A split that puts
         * closely coupled modules in separate chunks can change their
         * evaluation order, and React has to be initialised before
         * anything that calls it.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (/node_modules\/(react|react-dom|scheduler|react-router|@remix-run)\//.test(id)) {
            return "react";
          }
          if (/node_modules\/(@reduxjs|react-redux|redux|immer|reselect|@tanstack)\//.test(id)) {
            return "state";
          }
          if (/node_modules\/(@headlessui|@floating-ui|@react-aria|@react-stately|@tanstack\/virtual|sonner|@iconify)\//.test(id)) {
            return "ui";
          }
          // Everything else keeps Rollup's own placement. A catch-all
          // "vendor" chunk here is a trap: it collects dependencies
          // that only a lazy route needs — recharts, 428 kB of it —
          // into a chunk the entry HTML modulepreloads, so first load
          // grew from 274 kB to 388 kB gzipped while looking like a
          // split. Measured, not assumed.
          return undefined;
        },
      },
    },
  },
});
