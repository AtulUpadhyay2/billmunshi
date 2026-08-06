/**
 * Central SEO configuration.
 *
 * Every public page pulls its title/description/canonical from here so the
 * metadata lives in one place instead of being scattered across components.
 *
 * NOTE ON THIS BEING AN SPA: tags applied by <Seo> are set at runtime. Google
 * executes JavaScript and will see them, but social crawlers (Facebook,
 * LinkedIn, WhatsApp, X) do NOT run JS — they only read the static markup in
 * index.html. That is why index.html carries a complete default set of
 * Open Graph tags: link previews for every route fall back to those.
 * Per-route link previews would require prerendering or SSR.
 */

export const SITE = {
  name: "Bill Munshi",
  url: "https://billmunshi.com",
  email: "support@billmunshi.com",
  locale: "en_IN",
  // 1200x630 — the size Facebook/LinkedIn/X expect.
  ogImage: "/og-image.png",
  logo: "/favicon.svg",
  defaultTitle:
    "Bill Munshi — AI Bill Processing with Tally & Zoho Books Sync",
  defaultDescription:
    "Automate bill and expense data entry with AI-powered OCR. Bill Munshi extracts line items, taxes and GST, then syncs directly to Tally ERP and Zoho Books.",
};

/** Turn a route path into an absolute canonical URL. */
export const absoluteUrl = (path = "/") => {
  if (!path) return SITE.url;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Per-page metadata.
 *
 * Titles are kept under ~60 characters and descriptions under ~160 so search
 * engines display them without truncating.
 */
export const PAGE_SEO = {
  home: {
    title: "AI Bill Processing with Tally & Zoho Books Sync",
    description:
      "Save hours each week on purchase and expense entry. Bill Munshi reads bills with AI-powered OCR, captures line items and GST, and syncs to Tally ERP or Zoho Books.",
    path: "/",
  },
  bookDemo: {
    title: "Book a Live Demo",
    description:
      "See Bill Munshi in action in a 30-minute walkthrough. A product expert shows you AI bill capture, Tally and Zoho sync, and answers your questions live.",
    path: "/book-demo",
  },
  terms: {
    title: "Terms of Service",
    description:
      "The terms and conditions governing your use of the Bill Munshi bill processing and accounting automation platform.",
    path: "/terms",
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "How Bill Munshi collects, stores, encrypts and protects your financial data, and the choices you have over your information.",
    path: "/privacy-policy",
  },
  cookies: {
    title: "Cookie Policy",
    description:
      "Every cookie and storage key Bill Munshi uses, what each one is for, how long it lasts, and how to change or withdraw your consent at any time.",
    path: "/cookie-policy",
  },
};

/**
 * Organisation / product structured data.
 *
 * This pair is stable across the whole site, so it is also embedded
 * statically in index.html where crawlers see it without running JS.
 * Kept here as the single source of truth for anything that needs it
 * programmatically.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: absoluteUrl(SITE.logo),
  email: SITE.email,
  description: SITE.defaultDescription,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SITE.email,
    availableLanguage: ["English"],
  },
};

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Accounting Software",
  operatingSystem: "Web",
  url: SITE.url,
  description: SITE.defaultDescription,
  featureList: [
    "AI-powered OCR bill capture",
    "Line item, tax and GST extraction",
    "Native Tally ERP integration",
    "Native Zoho Books integration",
    "Role-based access control",
    "Multi-client dashboard for accountants",
  ],
};

/** Build FAQPage structured data from the FAQ list rendered on the landing page. */
export const buildFaqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});
