import { useEffect } from "react";
import { SITE, absoluteUrl } from "@/config/seo";

/**
 * Applies per-route document metadata.
 *
 * Why imperative DOM updates instead of React 19's native <title>/<meta>
 * hoisting: index.html already ships a full static set of tags (needed for
 * social crawlers, which don't execute JS). React would *append* its own
 * copies alongside those, leaving two <title> elements and duplicate
 * descriptions — and browsers honour the first <title>, so per-route titles
 * would silently not apply. Upserting by selector updates the existing tag
 * in place, which keeps exactly one of each.
 */

const upsertMeta = (attr, key, content) => {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const JSON_LD_ATTR = "data-seo-jsonld";

const setJsonLd = (schemas) => {
  // Clear any schema left behind by the previous route.
  document.head
    .querySelectorAll(`script[${JSON_LD_ATTR}]`)
    .forEach((node) => node.remove());

  schemas.filter(Boolean).forEach((schema) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, "true");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
};

/**
 * @param {string}  title       Page title, without the site-name suffix.
 * @param {string}  description Meta description (~160 chars).
 * @param {string}  path        Route path used for the canonical URL.
 * @param {string}  image       OG image path; defaults to the site image.
 * @param {boolean} noindex     Keep the page out of search results.
 * @param {string}  type        Open Graph type. Defaults to "website".
 * @param {object[]} schemas    JSON-LD objects to embed for this route.
 */
const Seo = ({
  title,
  description = SITE.defaultDescription,
  path = "/",
  image = SITE.ogImage,
  noindex = false,
  type = "website",
  schemas = [],
}) => {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.defaultTitle;
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const schemaKey = JSON.stringify(schemas);

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    upsertLink("canonical", noindex ? null : canonical);

    // Open Graph
    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:locale", SITE.locale);

    // X / Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    setJsonLd(schemas);
    // schemaKey stands in for `schemas` so a new array identity on every
    // render doesn't re-run this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, description, canonical, imageUrl, noindex, type, schemaKey]);

  useEffect(() => {
    // Route-specific schema must not leak onto the next page.
    return () => setJsonLd([]);
  }, []);

  return null;
};

export default Seo;
