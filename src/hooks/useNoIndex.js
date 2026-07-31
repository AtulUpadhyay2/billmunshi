import { useEffect } from "react";

/**
 * Keeps the current route out of search results.
 *
 * Used by the auth and signed-in app layouts. robots.txt already disallows
 * those paths, but a `noindex` header is the stronger signal: it also drops
 * URLs that were indexed before the rule existed, which Disallow alone
 * cannot do (a disallowed URL can still be indexed from external links).
 *
 * Deliberately does not touch document.title — `usePageTitle` owns that in
 * both layouts, and two hooks writing the title would race.
 */
const useNoIndex = () => {
  useEffect(() => {
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    const previous = robots.getAttribute("content");
    robots.setAttribute("content", "noindex, nofollow");

    // A private route has no canonical URL worth advertising.
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute("href") ?? null;
    canonical?.remove();

    return () => {
      robots.setAttribute(
        "content",
        previous || "index, follow, max-image-preview:large",
      );
      if (previousCanonical) {
        const link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", previousCanonical);
        document.head.appendChild(link);
      }
    };
  }, []);
};

export default useNoIndex;
