import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

/**
 * First-visit consent notice.
 *
 * A compact card pinned bottom-left rather than a full-width bar: it
 * stays out of the page's reading path on desktop while remaining
 * impossible to miss. On phones it goes full-width, where a 22rem card
 * would just be a cramped bar anyway.
 *
 * Deliberately *not* a modal — it must not hold the page hostage — and
 * deliberately without a dismiss "×". A close button that leaves the
 * visitor undecided either blocks them forever or gets read as
 * agreement, both of which are the dark patterns regulators single out.
 * The only ways out are the three buttons, and "Reject all" is the same
 * size and weight as "Accept all" so refusing costs no more effort.
 */
const CookieBanner = ({ onAcceptAll, onRejectAll, onCustomise }) => {
  const regionRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Move focus here on load so the banner is announced and is the
    // first thing a keyboard user reaches — it sits last in the DOM,
    // so without this they'd tab the entire page before finding it.
    // Only ever runs on the initial mount, never mid-task.
    regionRef.current?.focus?.({ preventScroll: true });
    // Next frame, so the entrance transition has a state to animate from.
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // z-99998 sits just under the app's own modals (z-99999), so the
  // banner never covers a dialog's buttons but stays above everything
  // else on the page.
  return (
    <div
      ref={regionRef}
      tabIndex={-1}
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 z-[99998] w-full sm:w-auto p-3 sm:p-5 outline-none"
    >
      <div
        className={`w-full sm:w-[23rem] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 ring-1 ring-slate-900/5 p-5 transition-all duration-300 ease-out motion-reduce:transition-none ${
          shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
            <Icon
              icon="heroicons:shield-check"
              className="text-base text-blue-600 dark:text-blue-400"
            />
          </span>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            We value your privacy
          </h2>
        </div>

        <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
          We use cookies that are necessary to run Bill Munshi and keep it
          secure. With your permission we&rsquo;d also like to remember your
          preferences and measure how the site is used.{" "}
          <Link
            to="/cookie-policy"
            className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            Cookie Policy
          </Link>
        </p>

        {/* Equal-width pair: refusing must never look like the lesser
            option, so the only difference is fill vs outline. */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRejectAll}
            className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-[13px] font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
          >
            Accept all
          </button>
        </div>

        <button
          type="button"
          onClick={onCustomise}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Icon icon="heroicons:adjustments-horizontal" className="text-sm" />
          Customise settings
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
