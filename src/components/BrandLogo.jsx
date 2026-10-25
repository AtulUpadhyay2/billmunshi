import React from "react";
import { Icon } from "@iconify/react";

/**
 * The Bill Munshi mark.
 *
 * Four SVG files used to carry this — logo.svg, logo-white.svg and two
 * "-c" variants — and all four were the DashCode template's "DC"
 * placeholder, so the product's own name never appeared in the header.
 * They also had to be swapped by hand on every theme change, and the
 * light and dark files had drifted apart.
 *
 * Rendering the mark instead of shipping it means one definition, it
 * follows the theme through `dark:` like everything else, and it is the
 * same treatment the marketing page already uses for the same brand.
 *
 * `variant="mark"` drops the wordmark, for a collapsed sidebar or a
 * narrow header where there is no room for it.
 * `tone="light"` forces white text, for a dark panel that is dark in
 * both themes and so cannot rely on `dark:`.
 */
const BrandLogo = ({ variant = "full", tone = "auto", className = "" }) => {
  const wordmark =
    tone === "light"
      ? "text-white"
      : "text-slate-900 dark:text-white";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 ring-1 ring-blue-700/20 flex items-center justify-center shadow-sm">
        <Icon icon="heroicons:document-text" className="text-base text-white" />
      </span>
      {variant === "full" && (
        <span className={`text-base font-bold tracking-tight whitespace-nowrap ${wordmark}`}>
          Bill Munshi
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
